# ESP32 Haptic Client - Timed Playback

This Arduino script implements a client-side ESP32 that receives haptic data via WebSocket and plays it back with precise timing using hardware interrupts.

## Features

- **Hardware Timer-Based Playback**: Uses ESP32's hardware timer for precise sample timing
- **Ring Buffer System**: 1024-sample circular buffer for smooth playback
- **WebSocket Client**: Connects to server and receives binary data/JSON commands
- **Multi-Tasking**: Separate tasks for WebSocket handling and status monitoring
- **Statistics**: Tracks samples received, played, overflows, and efficiency
- **Motor Control**: Automatic motor enable/disable during streaming

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
4. Client receives binary data and plays it back at precise timing
5. Server sends `stopStreaming` to end playback and show statistics

## Performance

- **Timing Precision**: Hardware timer ensures exact sample timing
- **Buffer Management**: Ring buffer prevents data loss during network jitter
- **Efficiency Monitoring**: Tracks and reports playback efficiency
- **Overflow Detection**: Monitors buffer overflows and reports statistics

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
- Buffer usage and overflow counts
- Receive and playback rates
- Efficiency statistics
- Connection status

This client is designed to work with the haptic server to provide precise, low-latency haptic feedback playback. 