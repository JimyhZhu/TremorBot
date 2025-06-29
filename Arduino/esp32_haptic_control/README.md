# ESP32 Haptic Control System

This ESP32 Arduino code provides a WebSocket server that can receive streaming data from the engineering platform UI and control haptic feedback based on the received signals.

## Features

- **WebSocket Server**: Runs on port 81 for real-time communication
- **WiFi Connectivity**: Connects to your local WiFi network
- **Haptic Control**: PWM-based haptic feedback control
- **PID Control**: Proportional-Integral-Derivative control for smooth haptic response
- **Real-time Data Processing**: Handles high-frequency streaming data (up to 1.2kHz)
- **Status Indicators**: Built-in LED shows connection and streaming status
- **Heartbeat System**: Maintains connection with periodic heartbeats

## Hardware Requirements

- ESP32 development board
- Haptic actuator (connected to GPIO 25)
- WiFi network access

## Pin Configuration

- **GPIO 25**: Haptic actuator PWM output
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

Connect your haptic actuator to GPIO 25 and ground. The system uses PWM at 20kHz for smooth haptic control.

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

The system uses PID control to convert the received normalized values (0-255) into haptic feedback intensity:

- **PWM Frequency**: 20kHz
- **Resolution**: 8-bit (0-255 levels)
- **PID Parameters**: 
  - Kp = 1.0 (Proportional)
  - Ki = 0.1 (Integral)
  - Kd = 0.05 (Derivative)

## Status LED Indicators

- **Off**: Not connected to UI
- **Slow Blink (500ms)**: Connected but not streaming
- **Fast Blink (100ms)**: Connected and streaming data

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
2. Check PWM frequency and resolution settings
3. Monitor PID control values in Serial Monitor

## Performance

- **Maximum Sampling Rate**: 1.2kHz
- **WebSocket Latency**: <10ms
- **PWM Frequency**: 20kHz
- **Buffer Size**: 100 data points

## Customization

### Change Haptic Pin
```cpp
const int HAPTIC_PIN = 25;  // Change to desired GPIO pin
```

### Adjust PID Parameters
```cpp
float Kp = 1.0;  // Proportional gain
float Ki = 0.1;  // Integral gain
float Kd = 0.05; // Derivative gain
```

### Modify PWM Settings
```cpp
const int PWM_FREQ = 20000;      // PWM frequency in Hz
const int PWM_RESOLUTION = 8;    // PWM resolution (8-bit = 0-255)
```

## Integration with Engineering Platform

This ESP32 code is designed to work seamlessly with the engineering platform UI:

1. **WebSocket Connection**: Automatically connects when UI starts
2. **Real-time Streaming**: Receives normalized signal data at full sampling rate
3. **Haptic Feedback**: Converts signal values to haptic intensity
4. **Status Monitoring**: Provides connection and streaming status to UI

The ESP32 will automatically receive the selected signal data and apply haptic feedback based on the normalized values (0-255 range). 