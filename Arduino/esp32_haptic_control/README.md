# ESP32 Haptic Control System - Real-Time Interactive Control

This ESP32 Arduino code provides a **WebSocket server** that receives streaming data from the engineering platform UI and controls haptic feedback with **real-time responsive timing** for interactive applications.

## Key Features

- **⚡ Real-Time Responsive**: Processes data "as fast as possible" for immediate feedback
- **📡 WebSocket Server**: Runs on port 81 for real-time communication with UI
- **🔗 WiFi Connectivity**: Connects to your local WiFi network
- **🎛️ Interactive Control**: Immediate response to user actions and parameter changes
- **📊 Status Monitoring**: Built-in LED shows connection and streaming status
- **💓 Heartbeat System**: Maintains connection with periodic heartbeats

## Timing Approach: **As Fast As Possible**

Unlike the client version that uses precise hardware timers, this control system:
- **Processes data immediately** when available in the buffer
- **Variable timing intervals** based on system load and data arrival
- **Real-time responsive** - prioritizes speed over precision
- **Interactive feedback** - perfect for user control applications

## Hardware Requirements

- ESP32 development board
- Haptic actuator (connected to GPIO 25)
- WiFi network access

## Pin Configuration

- **GPIO 25**: Haptic actuator DAC output
- **GPIO 18**: Motor ON/OFF control
- **GPIO 2**: Built-in LED (status indicator)

## Setup Instructions

### 1. Install Required Libraries

In Arduino IDE, install these libraries via Library Manager:
- `WebSocketsServer` by Markus Sattler
- `ArduinoJson` by Benoit Blanchon

### 2. Configure WiFi

Edit the WiFi credentials in the code:
```cpp
const char* ssid = "YourWiFiSSID";  // Change to your WiFi SSID
const char* password = "YourWiFiPassword";  // Change to your WiFi password
```

### 3. Upload Code

1. Connect your ESP32 to your computer
2. Select the correct board and port in Arduino IDE
3. Upload the code
4. Open Serial Monitor (115200 baud) to see connection status

### 4. Connect Haptic Actuator

Connect your haptic actuator to GPIO 25 and ground. The system uses DAC output for smooth haptic control.

## Communication Protocol

### Commands from UI to ESP32

**Start Streaming:**
```json
{
  "command": "startStreaming",
  "samplingRate": 1200
}
```

**Stop Streaming:**
```json
{
  "command": "stopStreaming"
}
```

**Manual Control:**
```json
{
  "command": "manualControl",
  "value": 128
}
```

**Heartbeat:**
```json
{
  "command": "ping"
}
```

### Streaming Data from UI to ESP32

```json
{
  "time": 5.123,
  "value": 128.5
}
```

### Status Messages from ESP32 to UI

**Connection Status:**
```json
{
  "type": "status",
  "message": "ESP32 connected"
}
```

**Heartbeat Response:**
```json
{
  "type": "pong"
}
```

## Haptic Control

The system processes haptic data with **real-time responsive timing**:

- **DAC Output**: 8-bit resolution (0-255 levels)
- **Immediate Processing**: Data processed as soon as it arrives
- **Variable Timing**: Intervals depend on system load and data rate
- **Interactive Response**: Perfect for user-controlled applications

## Status LED Indicators

- **Off**: Not connected to UI
- **Slow Blink (500ms)**: Connected but not streaming
- **Fast Blink (100ms)**: Connected and streaming data

## Performance & Timing

- **⚡ Real-Time Response**: Immediate processing of incoming data
- **📊 Variable Timing**: Intervals adapt to system load and data arrival
- **🎯 Interactive Feedback**: Perfect for user control applications
- **📈 Buffer Size**: 200 data points for smooth operation
- **🔗 WebSocket Latency**: <10ms for responsive control

## Use Cases

**Perfect for:**
- **Interactive applications** requiring immediate response
- **User-controlled haptic feedback** where speed matters more than precision
- **Real-time parameter adjustment** during experiments
- **Live demonstrations** and interactive sessions
- **Educational applications** where responsiveness enhances learning

## Troubleshooting

### Connection Issues
1. Check WiFi credentials
2. Ensure ESP32 and computer are on same network
3. Check Serial Monitor for IP address
4. Verify WebSocket port 81 is not blocked

### Data Issues
1. Check Serial Monitor for received data
2. Verify data format matches expected JSON structure
3. Check sampling rate compatibility

### Haptic Issues
1. Verify haptic actuator connection to GPIO 25
2. Check DAC output values in Serial Monitor
3. Monitor buffer status and processing rates

## Customization

### Change Haptic Pin
```cpp
const int HAPTIC_PIN = 25;  // Change to desired GPIO pin
```

### Adjust Buffer Size
```cpp
const int BUFFER_SIZE = 200;  // Increase for smoother operation
```

### Modify Processing Speed
```cpp
const int maxPointsPerIteration = 10;  // Process more points per loop
```

## Integration with Engineering Platform

This ESP32 code is designed to work seamlessly with the engineering platform UI:

1. **WebSocket Connection**: Automatically connects when UI starts
2. **Real-Time Streaming**: Receives normalized signal data with immediate processing
3. **Interactive Feedback**: Converts signal values to haptic intensity in real-time
4. **Status Monitoring**: Provides connection and streaming status to UI


The ESP32 will automatically receive the selected signal data and apply haptic feedback with **immediate, responsive timing** perfect for interactive applications. 
