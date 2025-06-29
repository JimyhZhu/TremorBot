import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const EnvelopePlot = ({ fileName }) => {
  const [envelopeData, setEnvelopeData] = useState({
    time: [],
    tremor: [],
    envelope: []
  });

  useEffect(() => {
    if (!fileName) return;
    const fetchEnvelopeData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/envelope-data?file_name=${encodeURIComponent(fileName)}`);
        setEnvelopeData(response.data);
      } catch (error) {
        console.error('Error fetching envelope data:', error);
      }
    };

    fetchEnvelopeData();
  }, [fileName]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tremor Envelope Analysis
      </Typography>
      
      <Plot
        data={[
          {
            x: envelopeData.time,
            y: envelopeData.tremor,
            type: 'scatter',
            mode: 'lines',
            name: 'Tremor Signal',
            line: { color: '#ff7f0e' }
          },
          {
            x: envelopeData.time,
            y: envelopeData.envelope,
            type: 'scatter',
            mode: 'lines',
            name: 'Envelope',
            line: { color: '#d62728' }
          }
        ]}
        layout={{
          title: 'Tremor Signal and Envelope',
          xaxis: { title: 'Time (s)' },
          yaxis: { title: 'Amplitude' },
          height: 400,
          showlegend: true,
          legend: {
            x: 0,
            y: 1,
            orientation: 'h'
          }
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

export default EnvelopePlot; 