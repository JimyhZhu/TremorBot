import React from 'react';
import { Button, Stack, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Box } from '@mui/material';

const LiveMonitorControls = ({
  selectedFile,
  files,
  onFileChange,
  isStreaming,
  isDebugMode,
  onDebugModeChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  isLooping,
  onLoopingChange,
  onStartStop,
  onReset,
  isRecording,
  onToggleRecording,
  onDownload,
  disableStart,
  disableReset,
  disableRecording,
  disableDownload,
  isConnected,
  onReconnect,
  recordAllSignals,
  onRecordAllSignalsChange,
  recordedDataLength
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (isSmallScreen) {
    // Stack controls vertically on very small screens
    return (
      <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
        {/* File selection and debug mode */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
            <InputLabel>Select File</InputLabel>
            <Select
              value={selectedFile}
              onChange={onFileChange}
              label="Select File"
              disabled={isStreaming}
            >
              {files.map((file) => (
                <MenuItem key={file} value={file}>{file}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={isDebugMode}
                onChange={onDebugModeChange}
                disabled={isStreaming}
                size="small"
              />
            }
            label="Debug"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={recordAllSignals}
                onChange={(e) => {
                  console.log('RecordAllSignals checkbox clicked - checked:', e.target.checked, 'disabled:', isStreaming);
                  onRecordAllSignalsChange(e);
                }}
                disabled={isStreaming}
                size="small"
              />
            }
            label="All Signals"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
          />
        </Stack>

        {/* Time controls */}
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Start (s)"
            type="number"
            value={startTime}
            onChange={onStartTimeChange}
            disabled={isStreaming}
            size="small"
            sx={{ width: '80px' }}
          />
          <TextField
            label="End (s)"
            type="number"
            value={endTime}
            onChange={onEndTimeChange}
            disabled={isStreaming}
            size="small"
            sx={{ width: '80px' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isLooping}
                onChange={onLoopingChange}
                disabled={isStreaming}
                size="small"
              />
            }
            label="Loop"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
          />
        </Stack>

        {/* Action buttons */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={onStartStop}
            color={isStreaming ? "error" : "primary"}
            disabled={disableStart}
            size="small"
            sx={{ flex: 1, minWidth: 'auto' }}
          >
            {isStreaming ? "Stop" : "Start"}
          </Button>
          <Button
            variant="outlined"
            onClick={onReset}
            disabled={disableReset}
            size="small"
            sx={{ minWidth: 'auto' }}
          >
            Reset
          </Button>
          <Button
            variant="outlined"
            onClick={onToggleRecording}
            color={isRecording ? "error" : "primary"}
            disabled={disableRecording}
            size="small"
          >
            {isRecording ? (recordAllSignals ? "Auto Recording" : "Stop Recording") : "Start Recording"}
          </Button>
          <Button
            variant="outlined"
            onClick={onDownload}
            disabled={disableDownload}
            size="small"
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {!disableDownload && recordedDataLength > 0 ? `Save to Server (${recordedDataLength})` : "Save to Server"}
          </Button>
        </Stack>

        {/* Connection control */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            onClick={onReconnect}
            disabled={isStreaming}
            size="small"
            color={isConnected ? "success" : "warning"}
            sx={{ minWidth: 'auto' }}
          >
            {isConnected ? "Connected" : "Reconnect"}
          </Button>
        </Stack>
      </Stack>
    );
  }

  if (isMobile) {
    // Two-row layout for mobile
    return (
      <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
        {/* Top row: File selection, debug mode, time controls */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Select File</InputLabel>
            <Select
              value={selectedFile}
              onChange={onFileChange}
              label="Select File"
              disabled={isStreaming}
            >
              {files.map((file) => (
                <MenuItem key={file} value={file}>{file}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={isDebugMode}
                onChange={onDebugModeChange}
                disabled={isStreaming}
                size="small"
              />
            }
            label="Debug Mode"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
          />
          <TextField
            label="Start Time (s)"
            type="number"
            value={startTime}
            onChange={onStartTimeChange}
            disabled={isStreaming}
            size="small"
            sx={{ width: '100px' }}
          />
          <TextField
            label="End Time (s)"
            type="number"
            value={endTime}
            onChange={onEndTimeChange}
            disabled={isStreaming}
            size="small"
            sx={{ width: '100px' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isLooping}
                onChange={onLoopingChange}
                disabled={isStreaming}
                size="small"
              />
            }
            label="Loop"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={recordAllSignals}
                onChange={(e) => {
                  console.log('RecordAllSignals checkbox clicked - checked:', e.target.checked, 'disabled:', isStreaming);
                  onRecordAllSignalsChange(e);
                }}
                disabled={isStreaming}
                size="small"
              />
            }
            label="All Signals"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
          />
        </Stack>

        {/* Bottom row: Action buttons */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            onClick={onStartStop}
            color={isStreaming ? "error" : "primary"}
            disabled={disableStart}
            size="small"
          >
            {isStreaming ? "Stop Streaming" : "Start Streaming"}
          </Button>
          <Button
            variant="outlined"
            onClick={onReset}
            disabled={disableReset}
            size="small"
          >
            Reset Stream
          </Button>
          <Button
            variant="outlined"
            onClick={onToggleRecording}
            color={isRecording ? "error" : "primary"}
            disabled={disableRecording}
            size="small"
          >
            {isRecording ? (recordAllSignals ? "Auto Recording" : "Stop Recording") : "Start Recording"}
          </Button>
          <Button
            variant="outlined"
            onClick={onDownload}
            disabled={disableDownload}
            size="small"
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {!disableDownload && recordedDataLength > 0 ? `Save to Server (${recordedDataLength})` : "Save to Server"}
          </Button>
          <Button
            variant="outlined"
            onClick={onReconnect}
            disabled={isStreaming}
            size="small"
            color={isConnected ? "success" : "warning"}
          >
            {isConnected ? "Connected" : "Reconnect"}
          </Button>
        </Stack>
      </Stack>
    );
  }

  // Desktop layout - single row
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Select File</InputLabel>
        <Select
          value={selectedFile}
          onChange={onFileChange}
          label="Select File"
          disabled={isStreaming}
        >
          {files.map((file) => (
            <MenuItem key={file} value={file}>{file}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={isDebugMode}
            onChange={onDebugModeChange}
            disabled={isStreaming}
            size="small"
          />
        }
        label="Debug Mode"
        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
      />
      <TextField
        label="Start Time (s)"
        type="number"
        value={startTime}
        onChange={onStartTimeChange}
        disabled={isStreaming}
        size="small"
        sx={{ width: '120px' }}
      />
      <TextField
        label="End Time (s)"
        type="number"
        value={endTime}
        onChange={onEndTimeChange}
        disabled={isStreaming}
        size="small"
        sx={{ width: '120px' }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={isLooping}
            onChange={onLoopingChange}
            disabled={isStreaming}
            size="small"
          />
        }
        label="Loop Segment"
        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={recordAllSignals}
            onChange={(e) => {
              console.log('RecordAllSignals checkbox clicked - checked:', e.target.checked, 'disabled:', isStreaming);
              onRecordAllSignalsChange(e);
            }}
            disabled={isStreaming}
            size="small"
          />
        }
        label="Record All Signals"
        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
      />
      <Button
        variant="contained"
        onClick={onStartStop}
        color={isStreaming ? "error" : "primary"}
        disabled={disableStart}
        size="small"
      >
        {isStreaming ? "Stop Streaming" : "Start Streaming"}
      </Button>
      <Button
        variant="outlined"
        onClick={onReset}
        disabled={disableReset}
        size="small"
      >
        Reset Stream
      </Button>
      <Button
        variant="outlined"
        onClick={onToggleRecording}
        color={isRecording ? "error" : "primary"}
        disabled={disableRecording}
        size="small"
      >
        {isRecording ? (recordAllSignals ? "Auto Recording" : "Stop Recording") : "Start Recording"}
      </Button>
      <Button
        variant="outlined"
        onClick={onDownload}
        disabled={disableDownload}
        size="small"
        sx={{ minWidth: 'auto', px: 1 }}
      >
        {!disableDownload && recordedDataLength > 0 ? `Save to Server (${recordedDataLength})` : "Save to Server"}
      </Button>
      <Button
        variant="outlined"
        onClick={onReconnect}
        disabled={isStreaming}
        size="small"
        color={isConnected ? "success" : "warning"}
      >
        {isConnected ? "Connected" : "Reconnect"}
      </Button>
    </Stack>
  );
};

export default LiveMonitorControls; 