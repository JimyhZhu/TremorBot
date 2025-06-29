import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const FrequencyDomainPlot = ({ fileName }) => {
  const [frequencyData, setFrequencyData] = useState({
    frequencies: [],
    magnitudes: []
  });

  useEffect(() => {
    if (!fileName) return;
    const fetchFrequencyData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/frequency-domain?file_name=${encodeURIComponent(fileName)}`);
        setFrequencyData(response.data);
      } catch (error) {
        console.error('Error fetching frequency data:', error);
      }
    };

    fetchFrequencyData();
  }, [fileName]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Frequency Domain Analysis
      </Typography>
      
      <Plot
        data={[
          {
            x: frequencyData.frequencies,
            y: frequencyData.magnitudes,
            type: 'scatter',
            mode: 'lines',
            name: 'Magnitude Spectrum',
            line: { color: '#1f77b4' }
          }
        ]}
        layout={{
          title: 'Frequency Spectrum',
          xaxis: { 
            title: 'Frequency (Hz)',
            range: [0, 10]  // Focus on relevant frequency range
          },
          yaxis: { 
            title: 'Magnitude',
            type: 'log'  // Log scale for better visualization
          },
          height: 400,
          showlegend: true
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false
        }}
        style={{ width: '100%' }}
      />
    </Box>
  );
};

export default FrequencyDomainPlot; 