# ESP32 Haptic Client - Hardware Timer-Based Precision Playback

This Arduino script implements a **client-side ESP32** that receives haptic data via WebSocket and plays it back with **precise hardware timer-based timing** for research and precision applications.

## Key Features

- **🕐 Hardware Timer-Based Playback**: Uses ESP32's hardware timer for **exact sample timing** (e.g., 786μs intervals for 1271 Hz)
- **🎯 Research-Grade Precision**: Guaranteed timing accuracy regardless of system load
- **📡 WebSocket Client**: Connects to server and receives binary data/JSON commands
- **⚡ Multi-Core Processing**: Separate tasks on different cores for maximum performance
- **📊 Advanced Statistics**: Tracks samples received, played, overflows, and timing accuracy
- **🔧 Motor Control**: Automatic motor enable/disable during streaming

## Timing Approach: **Precise Hardware Timer**

Unlike the control version that processes data "as fast as possible," this client uses:
- **Hardware timer interrupts** for exact sample timing
- **Guaranteed intervals** between samples (e.g., exactly 786μs for 1271 Hz)
- **Consistent playback speed** regardless of system load
- **Research-grade accuracy** for scientific applications

## Hardware Setup

- **DAC Pin**: GPIO 25 (DAC1) for haptic output
- **Motor Pin**: GPIO 18 for motor ON/OFF control
- **Status LED**: Built-in LED (GPIO 2)

## Configuration

Edit the following constants in the script:
- `WIFI_SSID` and `WIFI_PASSWORD`: Your WiFi credentials
- `MDNS_HOSTNAME`: Hostname for mDNS discovery
- `WS_HOST`, `WS_PORT`, `WS_PATH`: WebSocket server connection details
- `MIN_FREQ` and `MAX_FREQ`: Allowed sampling rate range (1000-1500 Hz)

## Usage

1. Upload the script to an ESP32
2. The client will connect to WiFi and wait for server connection
3. Server sends `startStreaming` command with sampling rate
4. Client receives binary data and plays it back at **precise timing intervals**
5. Server sends `stopStreaming` to end playback and show statistics

## Performance & Timing

- **⏱️ Timing Precision**: Hardware timer ensures exact sample timing (e.g., 786μs ± 1μs)
- **📈 Buffer Management**: 4096-sample ring buffer prevents data loss during network jitter
- **📊 Efficiency Monitoring**: Tracks and reports playback efficiency vs. received data
- **🚨 Overflow Detection**: Monitors buffer overflows and reports timing statistics
- **⚡ Maximum Speed**: Optimized for 1000+ Hz playback with precise timing

## Use Cases

**Perfect for:**
- **Research applications** requiring precise timing
- **Scientific experiments** where timing accuracy is critical
- **High-frequency signals** (1000+ Hz) with exact reproduction
- **Multiple synchronized devices** receiving the same data
- **Tremor research** where timing affects experimental results

## Dependencies

- WiFi library
- WebSocketsClient library
- ESPmDNS library
- ArduinoJson library

## Network Protocol

- **Binary Frames**: Raw sample data (0-255 values)
- **JSON Commands**: 
  - `{"command": "startStreaming", "samplingRate": 1271}`
  - `{"command": "stopStreaming"}`
  - `{"command": "ping"}`

## Status Output

The client provides detailed status information:
- **Timing accuracy** and deviation from expected intervals
- **Buffer usage** and overflow counts
- **Receive and playback rates** with efficiency metrics
- **Connection status** and performance statistics
