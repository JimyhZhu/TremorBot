#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Wire.h>
#include <ESPmDNS.h>  // Add mDNS support

// WiFi Configuration


const char* ssid = "";
const char* password = "";
// mDNS Configuration
const char* mDNS_HOSTNAME = "esp32";  // This will make it available as esp32.local

// WebSocket Configuration
WebSocketsServer webSocket = WebSocketsServer(81);
bool clientConnected = false;
bool lastConnectionLogged = false;

// System State
bool isStreaming = false;
bool isManualControl = false;
unsigned long uptime = 0;

// Pin Definitions
const int STATUS_LED = 2;
const int MOTOR_SWITCH_PIN = 18;  // GPIO 18 for motor ON/OFF
const int HAPTIC_PIN = 25;        // GPIO 25 for DAC output

// Buffer Configuration
const int BUFFER_SIZE = 200;
float valueBuffer[BUFFER_SIZE];
int writeIndex = 0;
int readIndex = 0;
int bufferCount = 0;
bool bufferFull = false;

// Message Rate Monitoring
unsigned long messageCount = 0;
unsigned long lastMessageRateTime = 0;
float messageRate = 0.0;

// Haptic Control Variables
bool hapticRunning = false;
unsigned long hapticWriteCount = 0;  // For rate calculation (resets every second)
unsigned long totalHapticWrites = 0; // Total writes (never resets)
bool hapticRateStarted = false;
unsigned long hapticStartTime = 0;
unsigned long totalStreamingStartTime = 0; // Total streaming duration (never resets)
float hapticWriteRate = 0.0;

// Haptic Timing Control
unsigned long lastHapticTime = 0;
const unsigned long HAPTIC_TIMEOUT = 100; // Reduced from 1000ms to 100ms for faster response
unsigned long HAPTIC_UPDATE_INTERVAL = 786; // Default 1271 Hz (786 us)

// Data Processing
float currentValue = 0.0;
unsigned long lastDataTime = 0;

// Status Tracking
bool lastWiFiStatus = false;
bool lastWebSocketStatus = false;
bool lastStreamingStatus = false;
int lastBufferCount = 0;
unsigned long lastUptime = 0;

// Heartbeat
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 5000; // 5 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("=== ESP32 Haptic Control System ===");
  Serial.println("Initializing...");
  
  // Initialize pins
  pinMode(STATUS_LED, OUTPUT);
  pinMode(MOTOR_SWITCH_PIN, OUTPUT);
  digitalWrite(MOTOR_SWITCH_PIN, LOW); // Start with motor OFF
  dacWrite(HAPTIC_PIN, 128); // Set DAC to centered (128)
  
  Serial.println("DAC initialized on GPIO 25 (centered at 128)");
  Serial.println("Motor switch initialized on GPIO 18");
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected successfully!");
  Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("MAC address: %s\n", WiFi.macAddress().c_str());
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket server started on port 81");
  
  // Start mDNS service
  if (MDNS.begin(mDNS_HOSTNAME)) {
    Serial.println("mDNS responder started");
    Serial.printf("ESP32 will be available at: %s.local\n", mDNS_HOSTNAME);
  } else {
    Serial.println("Error setting up mDNS responder!");
  }
  
  Serial.println("Waiting for UI connection...");
  
  // Blink LED to indicate ready
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED, HIGH);
    delay(200);
    digitalWrite(STATUS_LED, LOW);
    delay(200);
  }
  
  Serial.println("=== System Ready ===");
  Serial.println("Status: Waiting for WebSocket connection");
}

void loop() {
  // Handle WebSocket events
  webSocket.loop();
  
  // Process streaming data for haptic output
  if (isStreaming) {
    processStreamingData();
  }
  
  // Send heartbeat every 5 seconds
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Update status LED
  updateStatusLED();
  
  // Print status on changes
  printStatusOnChange();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      if (clientConnected) {
        clientConnected = false;
        Serial.println("[WS] Client disconnected");
      }
      break;
      
    case WStype_CONNECTED:
      if (!clientConnected) {
        clientConnected = true;
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[WS] Client connected from %s\n", ip.toString().c_str());
      }
      break;

    case WStype_TEXT:
      processCommand(payload, length);
      break;

    case WStype_BIN:
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      break;
  }
}

void processCommand(uint8_t * payload, size_t length) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
        return;
  }
  
  // Check command type
  if (doc.containsKey("command")) {
    String command = doc["command"];
    
    if (command == "startStreaming") {
      isStreaming = true;
      Serial.println("[CMD] Streaming STARTED");
      
      // Update haptic timing based on received sampling rate
      if (doc.containsKey("samplingRate")) {
        uint32_t receivedSamplingRate = doc["samplingRate"];
        HAPTIC_UPDATE_INTERVAL = 1000000 / receivedSamplingRate; // Convert to microseconds
        Serial.printf("[HAPTIC] Updated interval: %lu us for %u Hz sampling rate\n", 
                     HAPTIC_UPDATE_INTERVAL, receivedSamplingRate);
      }
      
      // Reset buffers
      writeIndex = 0;
      readIndex = 0;
      bufferCount = 0;
      bufferFull = false;
      for (int i = 0; i < BUFFER_SIZE; i++) {
        valueBuffer[i] = 0.0;
      }
      
      // Reset message rate monitoring
      messageCount = 0;
      lastMessageRateTime = millis();
      messageRate = 0.0;
      
      // Reset haptic writing rate monitoring
      hapticWriteCount = 0;
      totalHapticWrites = 0;
      hapticStartTime = millis();
      totalStreamingStartTime = millis(); // Track total streaming duration
      hapticRateStarted = false;
      
      // Turn on motor when streaming starts
      startHaptic();
      
      // Send confirmation
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Streaming started\"}");
      
    } else if (command == "stopStreaming") {
      isStreaming = false;
      Serial.println("[CMD] Streaming STOPPED");
      
      // Clear buffer immediately for faster response
      bufferCount = 0;
      writeIndex = 0;
      readIndex = 0;
      bufferFull = false;
      
      stopHaptic();
      
      // Send confirmation
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Streaming stopped\"}");
      
    } else if (command == "ping") {
      // Respond to heartbeat
      webSocket.broadcastTXT("{\"type\":\"pong\"}");
    } else if (command == "startManualControl") {
      isManualControl = true;
      isStreaming = false; // Stop any active streaming
      Serial.println("[CMD] Manual control STARTED");
      
      // Set initial value if provided
      if (doc.containsKey("value")) {
        int manualValue = doc["value"];
        dacWrite(HAPTIC_PIN, manualValue);
        Serial.printf("[MANUAL] Set DAC to: %d\n", manualValue);
      }
      
      // Turn on motor for manual control
      digitalWrite(MOTOR_SWITCH_PIN, HIGH);
      hapticRunning = true;
      
      // Send confirmation
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Manual control started\"}");
      
    } else if (command == "stopManualControl") {
      isManualControl = false;
      Serial.println("[CMD] Manual control STOPPED");
      
      // Turn off motor and reset DAC
      digitalWrite(MOTOR_SWITCH_PIN, LOW);
      dacWrite(HAPTIC_PIN, 128);
      hapticRunning = false;
      
      // Send confirmation
      webSocket.broadcastTXT("{\"type\":\"status\",\"message\":\"Manual control stopped\"}");
      
    } else if (command == "manualControl") {
      if (isManualControl && doc.containsKey("value")) {
        int manualValue = doc["value"];
        dacWrite(HAPTIC_PIN, manualValue);
        Serial.printf("[MANUAL] DAC value: %d\n", manualValue);
      }
    }
  }
  
  // Check for streaming data
  if (doc.containsKey("time") && doc.containsKey("value")) {
    float time = doc["time"];
    float value = doc["value"];
    
    // Track message rate
    messageCount++;
    unsigned long currentTime = millis();
    if (currentTime - lastMessageRateTime >= 1000) { // Every second
      messageRate = (float)messageCount * 1000.0 / (currentTime - lastMessageRateTime);
      messageCount = 0;
      lastMessageRateTime = currentTime;
    }
    
    // Store data in buffer (Producer)
    if (bufferCount < BUFFER_SIZE) {
      valueBuffer[writeIndex] = value;
      writeIndex = (writeIndex + 1) % BUFFER_SIZE;
      bufferCount++;
      if (bufferCount == BUFFER_SIZE) {
        bufferFull = true;
      }
    } else {
      // Buffer full - overwrite oldest data
      valueBuffer[writeIndex] = value;
      writeIndex = (writeIndex + 1) % BUFFER_SIZE;
      readIndex = (readIndex + 1) % BUFFER_SIZE; // Move read index to maintain FIFO
      Serial.println("[WARN] Buffer overflow - data loss!");
    }
    
    // Update current value for immediate haptic control (fallback)
    currentValue = value;
    lastDataTime = millis();
  }
}

void processStreamingData() {
  // Don't process streaming data if manual control is active
  if (isManualControl) {
    return;
  }
  
  // Check if we have recent data
  if (millis() - lastDataTime > HAPTIC_TIMEOUT) {
    stopHaptic();
    return;
  }
  
  // Process haptic data as fast as possible when buffer has data
  int pointsProcessed = 0;
  const int maxPointsPerIteration = 10;
  
  while (bufferCount > 0 && pointsProcessed < maxPointsPerIteration) {
    float hapticValue = valueBuffer[readIndex];
    readIndex = (readIndex + 1) % BUFFER_SIZE;
    bufferCount--;
    if (bufferFull && bufferCount < BUFFER_SIZE) {
      bufferFull = false;
    }
    
    // Ensure motor is ON when we have data
    if (digitalRead(MOTOR_SWITCH_PIN) == LOW) {
      startHaptic();
    }
    
    // Convert value to DAC output (0-255 range) for torque control
    int dacValue = (int)constrain(hapticValue, 0, 255);
    
    // Write to DAC for torque control
    dacWrite(HAPTIC_PIN, dacValue);
    
    // Track haptic writing rate
    hapticWriteCount++;
    totalHapticWrites++;
    pointsProcessed++;
  }
  
  // Update haptic rate calculation
  unsigned long currentTime = millis();
  if (!hapticRateStarted) {
    hapticRateStarted = true;
    hapticStartTime = currentTime;
  }
  if (currentTime - hapticStartTime >= 1000) { // Every second
    hapticWriteRate = (float)hapticWriteCount * 1000.0 / (currentTime - hapticStartTime);
    hapticWriteCount = 0;
    hapticStartTime = currentTime;
  }
}

void startHaptic() {
  if (!hapticRunning) {
    digitalWrite(MOTOR_SWITCH_PIN, HIGH); // Turn on motor
    dacWrite(HAPTIC_PIN, 128); // Set DAC to centered (128)
    hapticRunning = true;
    Serial.println("[HAPTIC] Started (Motor ON, DAC=128 centered)");
  }
}

void stopHaptic() {
  if (hapticRunning) {
    digitalWrite(MOTOR_SWITCH_PIN, LOW); // Turn off motor
    dacWrite(HAPTIC_PIN, 128); // Set DAC to centered (128)
    hapticRunning = false;
    
    // Calculate final accurate haptic writing rate
    if (hapticRateStarted && totalHapticWrites > 0) {
      unsigned long totalTime = millis() - totalStreamingStartTime; // Use total streaming duration
      float finalHapticRate = (float)totalHapticWrites * 1000.0 / totalTime;
      float finalMessageRate = messageRate;
      float efficiency = (finalHapticRate / finalMessageRate) * 100.0;
      
      if (!isStreaming) {
        // Final stop - show complete summary
        Serial.printf("[HAPTIC] Stopped (Motor OFF, DAC=128 centered)\n");
        Serial.printf("[SUMMARY] Duration: %lu ms | Points: %lu | Message Rate: %.1f Hz | Haptic Rate: %.1f Hz | Efficiency: %.1f%%\n", 
                     totalTime, totalHapticWrites, finalMessageRate, finalHapticRate, efficiency);
      } else {
        // Pause - show brief summary
        Serial.printf("[HAPTIC] Paused (Motor OFF, DAC=128 centered)\n");
        Serial.printf("[PAUSE] Duration: %lu ms | Points: %lu | Rate: %.1f Hz\n", 
                     totalTime, totalHapticWrites, finalHapticRate);
      }
    } else {
      Serial.println("[HAPTIC] Stopped (Motor OFF, DAC=128 centered)");
    }
  }
}

void sendHeartbeat() {
  if (clientConnected) {
    webSocket.broadcastTXT("{\"type\":\"heartbeat\",\"timestamp\":" + String(millis()) + "}");
  }
}

void updateStatusLED() {
  static unsigned long lastBlinkTime = 0;
  static bool ledState = false;
  
  if (clientConnected) {
    if (isStreaming) {
      // Fast blink when streaming
      if (millis() - lastBlinkTime > 100) {
        ledState = !ledState;
        digitalWrite(STATUS_LED, ledState);
        lastBlinkTime = millis();
      }
    } else {
      // Slow blink when connected but not streaming
      if (millis() - lastBlinkTime > 500) {
        ledState = !ledState;
        digitalWrite(STATUS_LED, ledState);
        lastBlinkTime = millis();
      }
    }
  } else {
    // LED off when not connected
    digitalWrite(STATUS_LED, LOW);
  }
}

void printStatusOnChange() {
  bool wifiChanged = (WiFi.status() == WL_CONNECTED) != lastWiFiStatus;
  bool wsChanged = clientConnected != lastWebSocketStatus;
  bool streamingChanged = isStreaming != lastStreamingStatus;
  bool bufferChanged = bufferCount != lastBufferCount;
  
  if (wifiChanged || wsChanged || streamingChanged || bufferChanged) {
    printStatus();
    lastWiFiStatus = WiFi.status() == WL_CONNECTED;
    lastWebSocketStatus = clientConnected;
    lastStreamingStatus = isStreaming;
    lastBufferCount = bufferCount;
    lastUptime = millis() / 1000;
  }
}

void printStatus() {
  Serial.println("=== ESP32 STATUS ===");
  Serial.printf("WiFi: %s | IP: %s\n", 
    WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected",
    WiFi.localIP().toString().c_str());
  Serial.printf("WebSocket: %s | Streaming: %s\n", 
    clientConnected ? "Connected" : "Disconnected",
    isStreaming ? "Active" : "Inactive");
  Serial.printf("Buffer: %d/%d | Rate: %.1f msg/s | Haptic: %.1f writes/s | Uptime: %lu s\n", 
    bufferCount, BUFFER_SIZE, messageRate, hapticWriteRate,
    millis() / 1000);
  Serial.println("===================");
} 
