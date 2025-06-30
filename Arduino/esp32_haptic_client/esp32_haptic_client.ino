#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Wire.h>
#include <ESPmDNS.h>

// WiFi Configuration
const char* ssid = "";
const char* password = "";
const char* mDNS_HOSTNAME = "esp32";

// WebSocket Configuration
WebSocketsServer webSocket = WebSocketsServer(81);
bool clientConnected = false;

// System State
volatile bool isStreaming = false;
volatile bool isManualControl = false;

// Pin Definitions
const int STATUS_LED = 2;
const int MOTOR_SWITCH_PIN = 18;
const int HAPTIC_PIN = 25;

// High-Performance Buffer Configuration
const int BUFFER_SIZE = 4096;  // Larger buffer for high-speed streaming
volatile float valueBuffer[BUFFER_SIZE];
volatile int writeIndex = 0;
volatile int readIndex = 0;
volatile int bufferCount = 0;
volatile bool bufferOverflow = false;

// Performance monitoring
volatile unsigned long messageCount = 0;
volatile unsigned long hapticWriteCount = 0;
volatile unsigned long totalHapticWrites = 0;
volatile unsigned long droppedFrames = 0;
unsigned long lastStatsTime = 0;
float messageRate = 0.0;
float hapticWriteRate = 0.0;

// Timing variables
volatile unsigned long lastDataTime = 0;
volatile bool hapticRunning = false;

// FreeRTOS Task handles
TaskHandle_t hapticTaskHandle = nullptr;
TaskHandle_t websocketTaskHandle = nullptr;

// Synchronization
portMUX_TYPE bufferMux = portMUX_INITIALIZER_UNLOCKED;
portMUX_TYPE stateMux = portMUX_INITIALIZER_UNLOCKED;

// Forward declarations
void hapticTask(void* parameter);
void websocketTask(void* parameter);
void startHaptic();
void stopHaptic();

void setup() {
  Serial.begin(115200);
  Serial.println("=== ESP32 High-Speed Haptic System ===");
  
  // Initialize pins
  pinMode(STATUS_LED, OUTPUT);
  pinMode(MOTOR_SWITCH_PIN, OUTPUT);
  digitalWrite(MOTOR_SWITCH_PIN, LOW);
  dacWrite(HAPTIC_PIN, 128);
  
  Serial.println("Hardware initialized");
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);  // Reduced delay
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket server started on port 81");
  
  // Start mDNS
  if (MDNS.begin(mDNS_HOSTNAME)) {
    Serial.printf("mDNS: %s.local\n", mDNS_HOSTNAME);
  }
  
  // Create high-priority haptic task on Core 1
  xTaskCreatePinnedToCore(
    hapticTask,
    "HapticTask",
    4096,
    nullptr,
    3,  // High priority
    &hapticTaskHandle,
    1   // Core 1
  );
  
  // Create WebSocket task on Core 0
  xTaskCreatePinnedToCore(
    websocketTask,
    "WebSocketTask", 
    8192,
    nullptr,
    2,  // Medium priority
    &websocketTaskHandle,
    0   // Core 0
  );
  
  Serial.println("=== System Ready ===");
  Serial.println("Maximum performance mode enabled");
}

void loop() {
  // Main loop handles only status updates and statistics
  unsigned long currentTime = millis();
  
  if (currentTime - lastStatsTime >= 1000) {
    updateStatistics();
    lastStatsTime = currentTime;
  }
  
  // Update status LED
  updateStatusLED();
  
  // Small delay to prevent watchdog issues
  delay(1);
}

// Dedicated haptic processing task - maximum speed
void hapticTask(void* parameter) {
  const TickType_t xDelay = 0;  // No delay - run as fast as possible
  
  while (true) {
    bool streaming, hasData;
    float value;
    
    // Check if we should be streaming
    portENTER_CRITICAL(&stateMux);
    streaming = isStreaming && !isManualControl;
    portEXIT_CRITICAL(&stateMux);
    
    if (!streaming) {
      vTaskDelay(pdMS_TO_TICKS(1));  // Minimal delay when not streaming
      continue;
    }
    
    // Check for timeout
    portENTER_CRITICAL(&stateMux);
    if (millis() - lastDataTime > 1000) {  // 1 second timeout
      portEXIT_CRITICAL(&stateMux);
      stopHaptic();
      continue;
    }
    portEXIT_CRITICAL(&stateMux);
    
    // Process all available buffer data in one go
    int processedCount = 0;
    while (processedCount < 100) {  // Process up to 100 samples per iteration
      portENTER_CRITICAL(&bufferMux);
      hasData = (bufferCount > 0);
      if (hasData) {
        value = valueBuffer[readIndex];
        readIndex = (readIndex + 1) % BUFFER_SIZE;
        bufferCount--;
        portENTER_CRITICAL(&stateMux);
        hapticWriteCount++;
        totalHapticWrites++;
        portEXIT_CRITICAL(&stateMux);
      }
      portEXIT_CRITICAL(&bufferMux);
      
      if (!hasData) break;
      
      // Ensure motor is running
      if (!hapticRunning) {
        startHaptic();
      }
      
      // Write to DAC as fast as possible
      int dacValue = (int)constrain(value, 0, 255);
      dacWrite(HAPTIC_PIN, dacValue);
      
      processedCount++;
    }
    
    // Yield if we processed data, otherwise tiny delay
    if (processedCount > 0) {
      taskYIELD();
    } else {
      vTaskDelay(xDelay);
    }
  }
}

// Dedicated WebSocket handling task
void websocketTask(void* parameter) {
  while (true) {
    webSocket.loop();
    
    // Process with minimal delay
    vTaskDelay(1);
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      if (clientConnected) {
        clientConnected = false;
        Serial.println("[WS] Client disconnected");
        stopHaptic();
      }
      break;
      
    case WStype_CONNECTED:
      if (!clientConnected) {
        clientConnected = true;
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[WS] Client connected: %s\n", ip.toString().c_str());
      }
      break;

    case WStype_TEXT:
      processCommand(payload, length);
      break;

    default:
      break;
  }
}

void processCommand(uint8_t * payload, size_t length) {
  // Use static document to avoid repeated allocations
  static DynamicJsonDocument doc(1024);
  doc.clear();
  
  DeserializationError error = deserializeJson(doc, payload);
  if (error) return;
  
  // Handle commands
  if (doc.containsKey("command")) {
    String command = doc["command"];
    
    if (command == "startStreaming") {
      portENTER_CRITICAL(&stateMux);
      isStreaming = true;
      isManualControl = false;
      portEXIT_CRITICAL(&stateMux);
      
      // Reset buffers
      portENTER_CRITICAL(&bufferMux);
      writeIndex = 0;
      readIndex = 0;
      bufferCount = 0;
      bufferOverflow = false;
      portEXIT_CRITICAL(&bufferMux);
      
      // Reset stats
      portENTER_CRITICAL(&stateMux);
      messageCount = 0;
      hapticWriteCount = 0;
      totalHapticWrites = 0;
      droppedFrames = 0;
      portEXIT_CRITICAL(&stateMux);
      
      Serial.println("[CMD] High-speed streaming STARTED");
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Streaming started\"}");
      
    } else if (command == "stopStreaming") {
      portENTER_CRITICAL(&stateMux);
      isStreaming = false;
      portEXIT_CRITICAL(&stateMux);
      
      stopHaptic();
      Serial.println("[CMD] Streaming STOPPED");
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Streaming stopped\"}");
      
    } else if (command == "startManualControl") {
      portENTER_CRITICAL(&stateMux);
      isManualControl = true;
      isStreaming = false;
      portEXIT_CRITICAL(&stateMux);
      
      if (doc.containsKey("value")) {
        int manualValue = doc["value"];
        dacWrite(HAPTIC_PIN, manualValue);
      }
      
      digitalWrite(MOTOR_SWITCH_PIN, HIGH);
      hapticRunning = true;
      
      Serial.println("[CMD] Manual control STARTED");
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Manual control started\"}");
      
    } else if (command == "stopManualControl") {
      portENTER_CRITICAL(&stateMux);
      isManualControl = false;
      portEXIT_CRITICAL(&stateMux);
      
      stopHaptic();
      Serial.println("[CMD] Manual control STOPPED");
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Manual control stopped\"}");
      
    } else if (command == "manualControl") {
      bool manualActive;
      portENTER_CRITICAL(&stateMux);
      manualActive = isManualControl;
      portEXIT_CRITICAL(&stateMux);
      
      if (manualActive && doc.containsKey("value")) {
        int manualValue = doc["value"];
        dacWrite(HAPTIC_PIN, manualValue);
      }
      
    } else if (command == "ping") {
      webSocket.broadcastTXT("{\"type\":\"pong\"}");
    }
  }
  
  // Handle streaming data with maximum efficiency
  if (doc.containsKey("value")) {
    float value = doc["value"];
    
    // Update message count
    portENTER_CRITICAL(&stateMux);
    messageCount++;
    lastDataTime = millis();
    portEXIT_CRITICAL(&stateMux);
    
    // Add to buffer with overflow handling
    portENTER_CRITICAL(&bufferMux);
    if (bufferCount < BUFFER_SIZE) {
      valueBuffer[writeIndex] = value;
      writeIndex = (writeIndex + 1) % BUFFER_SIZE;
      bufferCount++;
    } else {
      // Buffer full - implement smart dropping
      if (!bufferOverflow) {
        bufferOverflow = true;
        Serial.println("[WARN] Buffer overflow - entering high-speed mode");
      }
      
      // Drop older samples and add new one
      valueBuffer[writeIndex] = value;
      writeIndex = (writeIndex + 1) % BUFFER_SIZE;
      readIndex = (readIndex + 1) % BUFFER_SIZE;
      
      portENTER_CRITICAL(&stateMux);
      droppedFrames++;
      portEXIT_CRITICAL(&stateMux);
    }
    portEXIT_CRITICAL(&bufferMux);
  }
}

void startHaptic() {
  if (!hapticRunning) {
    digitalWrite(MOTOR_SWITCH_PIN, HIGH);
    dacWrite(HAPTIC_PIN, 128);
    hapticRunning = true;
    Serial.println("[HAPTIC] Motor ON - High-speed mode");
  }
}

void stopHaptic() {
  if (hapticRunning) {
    digitalWrite(MOTOR_SWITCH_PIN, LOW);
    dacWrite(HAPTIC_PIN, 128);
    hapticRunning = false;
    
    unsigned long totalWrites;
    portENTER_CRITICAL(&stateMux);
    totalWrites = totalHapticWrites;
    portEXIT_CRITICAL(&stateMux);
    
    Serial.printf("[HAPTIC] Motor OFF - Processed %lu samples\n", totalWrites);
  }
}

void updateStatistics() {
  static unsigned long lastMessageCount = 0;
  static unsigned long lastHapticCount = 0;
  
  unsigned long currentMessages, currentHaptic, dropped;
  
  portENTER_CRITICAL(&stateMux);
  currentMessages = messageCount;
  currentHaptic = hapticWriteCount;
  dropped = droppedFrames;
  
  // Reset counters
  messageCount = 0;
  hapticWriteCount = 0;
  droppedFrames = 0;
  portEXIT_CRITICAL(&stateMux);
  
  messageRate = currentMessages;
  hapticWriteRate = currentHaptic;
  
  if (isStreaming && (currentMessages > 0 || currentHaptic > 0)) {
    int bufUsage;
    portENTER_CRITICAL(&bufferMux);
    bufUsage = bufferCount;
    portEXIT_CRITICAL(&bufferMux);
    
    Serial.printf("[PERF] Msg: %.0f Hz | Haptic: %.0f Hz | Buffer: %d/%d | Dropped: %lu\n", 
                  messageRate, hapticWriteRate, bufUsage, BUFFER_SIZE, dropped);
    
    // Send performance data to client
    if (clientConnected) {
      String perfData = "{\"type\":\"performance\",\"messageRate\":" + String(messageRate) + 
                       ",\"hapticRate\":" + String(hapticWriteRate) + 
                       ",\"bufferUsage\":" + String(bufUsage) + 
                       ",\"droppedFrames\":" + String(dropped) + "}";
      webSocket.broadcastTXT(perfData);
    }
  }
}

void updateStatusLED() {
  static unsigned long lastBlinkTime = 0;
  static bool ledState = false;
  unsigned long blinkInterval;
  
  if (clientConnected) {
    if (isStreaming) {
      blinkInterval = 50;  // Very fast blink for high-speed streaming
    } else {
      blinkInterval = 500; // Slow blink when connected
    }
    
    if (millis() - lastBlinkTime > blinkInterval) {
      ledState = !ledState;
      digitalWrite(STATUS_LED, ledState);
      lastBlinkTime = millis();
    }
  } else {
    digitalWrite(STATUS_LED, LOW);
  }
}
