import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button } from '@mui/material';
import CaseCard from './CaseCard';
import SensationTestCard from './SensationTestCard';
import ClinicalSimulationCard from './ClinicalSimulationCard';
import CaseStudiesLivePlot from './CaseStudiesLivePlot';
import { useCaseStudiesWebSocket } from '../hooks/useCaseStudiesWebSocket';
import axios from 'axios';

const CaseStudies = () => {
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStreamingSignal, setSelectedStreamingSignal] = useState('centeredTorque');
  
  const { 
    isConnected, 
    statusMessage, 
    isStreaming,
    currentCaseData,
    sendTremorData, 
    stopTremor,
    manualReconnect 
  } = useCaseStudiesWebSocket();

  useEffect(() => {
    const loadCaseStudies = async () => {
      try {
        setLoading(true);
        
        // Load configuration from backend
        const configResponse = await axios.get('/api/case-studies-config');
        const config = configResponse.data;
        
        // Create cases array from configuration
        const configuredCases = [
          {
            id: 'normal_control',
            title: 'Case 1: Normal Control',
            description: 'A healthy control subject with minimal physiological tremor. This serves as a baseline for comparison.',
            dataFile: config.normal?.file || '',
            feature: config.normal?.feature || 'centeredTorque',
            severity: 'normal'
          },
          {
            id: 'early_pd',
            title: 'Case 2: Early-Stage Parkinson\'s',
            description: 'A mild, resting tremor primarily affecting one hand. The tremor is most prominent when the patient is at rest.',
            dataFile: config.earlyPD?.file || '',
            feature: config.earlyPD?.feature || 'centeredTorque',
            severity: 'early'
          },
          {
            id: 'moderate_pd',
            title: 'Case 3: Moderate Progression',
            description: 'The tremor has become more pronounced and may affect both sides of the body, with some postural instability.',
            dataFile: config.moderatePD?.file || '',
            feature: config.moderatePD?.feature || 'centeredTorque',
            severity: 'moderate'
          },
          {
            id: 'advanced_pd',
            title: 'Case 4: Advanced Stage',
            description: 'A severe tremor that significantly impacts daily activities, simulated here to show its intensity.',
            dataFile: config.advancedPD?.file || '',
            feature: config.advancedPD?.feature || 'centeredTorque',
            severity: 'advanced'
          }
        ];
        
        setCases(configuredCases);
        setLoading(false);
      } catch (error) {
        console.error('Error loading case studies:', error);
        setError('Failed to load case studies configuration. Please configure the files in the Live Monitor first.');
        setLoading(false);
      }
    };
    
    loadCaseStudies();
  }, []);

  const handlePlayToggle = (caseId, fileData) => {
    if (currentPlaying === caseId) {
      // Stop it
      stopTremor();
      setCurrentPlaying(null);
    } else {
      // Start it
      if (currentPlaying) {
        stopTremor(); // Stop previous one first
      }
      sendTremorData(caseId, fileData.time, fileData.featureData);
      setCurrentPlaying(caseId);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Typography variant="body1">
          Please go to the Live Monitor page to configure which files to use for each case study.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Case Studies for Parkinson's Tremor
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        This section provides interactive case studies for medical students to learn about the different types of Parkinsonian tremors using haptic feedback. Select a case to visualize the tremor profile and start the haptic simulation.
      </Typography>

      <Paper sx={{ p: 2, mb: 4, backgroundColor: isConnected ? 'success.light' : 'warning.light' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Haptic Device Status</Typography>
            <Typography>{statusMessage}</Typography>
            {isStreaming && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Streaming tremor data to haptic device...
              </Typography>
            )}
          </Box>
          <Button 
            variant="outlined" 
            onClick={manualReconnect}
            disabled={isStreaming}
            sx={{ minWidth: 120 }}
          >
            {isConnected ? 'Reconnect' : 'Connect'}
          </Button>
        </Box>
      </Paper>

      {/* Live Streaming Plot */}
      <Box sx={{ mb: 4 }}>
        <CaseStudiesLivePlot
          isStreaming={isStreaming}
          currentCaseData={currentCaseData}
          selectedStreamingSignal={selectedStreamingSignal}
          onSignalChange={setSelectedStreamingSignal}
          currentCaseName={currentPlaying ? cases.find(c => c.id === currentPlaying)?.title : null}
        />
      </Box>

      <Grid container spacing={3}>
        {cases.map((caseData) => (
          <Grid item xs={12} md={6} lg={4} key={caseData.id}>
            <CaseCard 
              caseData={caseData}
              isPlaying={currentPlaying === caseData.id}
              onPlayToggle={handlePlayToggle}
              isConnected={isConnected}
            />
          </Grid>
        ))}
        
        {/* Sensation Test Case */}
        <Grid item xs={12} md={6} lg={4}>
          <SensationTestCard
            isPlaying={currentPlaying === 'sensation_test'}
            onPlayToggle={handlePlayToggle}
            isConnected={isConnected}
          />
        </Grid>

        {/* Clinical Simulation Case */}
        <Grid item xs={12} md={6} lg={4}>
          <ClinicalSimulationCard
            isPlaying={currentPlaying === 'clinical_simulation'}
            onPlayToggle={handlePlayToggle}
            isConnected={isConnected}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CaseStudies; 