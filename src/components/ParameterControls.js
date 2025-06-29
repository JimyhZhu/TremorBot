import React from 'react';
import { Box, Typography, Slider, TextField } from '@mui/material';

const ParameterControls = ({ parameters, onParameterChange }) => {
  const handleChange = (param) => (event, newValue) => {
    onParameterChange({
      ...parameters,
      [param]: newValue,
    });
  };

  const handleInputChange = (param) => (event) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      onParameterChange({
        ...parameters,
        [param]: value,
      });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Control Parameters
      </Typography>

      {/* Global Gain */}
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>G (Global Gain)</Typography>
        <Slider
          value={parameters.G}
          onChange={handleChange('G')}
          min={0}
          max={2}
          step={0.1}
          marks
          valueLabelDisplay="auto"
        />
        <TextField
          size="small"
          type="number"
          value={parameters.G}
          onChange={handleInputChange('G')}
          inputProps={{ step: 0.1, min: 0, max: 2 }}
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Alpha (Tremor Gain) */}
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>α (Tremor Gain)</Typography>
        <Slider
          value={parameters.alpha}
          onChange={handleChange('alpha')}
          min={0}
          max={2}
          step={0.1}
          marks
          valueLabelDisplay="auto"
        />
        <TextField
          size="small"
          type="number"
          value={parameters.alpha}
          onChange={handleInputChange('alpha')}
          inputProps={{ step: 0.1, min: 0, max: 2 }}
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Kp (Stiffness Gain) */}
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Kp (Stiffness Gain) - Not Used</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Not used in direct torque output mode
        </Typography>
        <Slider
          value={parameters.Kp}
          onChange={handleChange('Kp')}
          min={0}
          max={2}
          step={0.1}
          marks
          valueLabelDisplay="auto"
          disabled
        />
        <TextField
          size="small"
          type="number"
          value={parameters.Kp}
          onChange={handleInputChange('Kp')}
          inputProps={{ step: 0.1, min: 0, max: 2 }}
          sx={{ mt: 1 }}
          disabled
        />
      </Box>

      {/* Kd (Damping Gain) */}
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Kd (Damping Gain) - Not Used</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Not used in direct torque output mode
        </Typography>
        <Slider
          value={parameters.Kd}
          onChange={handleChange('Kd')}
          min={0}
          max={1}
          step={0.05}
          marks
          valueLabelDisplay="auto"
          disabled
        />
        <TextField
          size="small"
          type="number"
          value={parameters.Kd}
          onChange={handleInputChange('Kd')}
          inputProps={{ step: 0.05, min: 0, max: 1 }}
          sx={{ mt: 1 }}
          disabled
        />
      </Box>
    </Box>
  );
};

export default ParameterControls; 