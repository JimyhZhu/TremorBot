import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import { 
  Psychology as PsychologyIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import axios from 'axios';

const SensationTestCard = ({ isPlaying, onPlayToggle, isConnected }) => {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showGuessDialog, setShowGuessDialog] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [testCompleted, setTestCompleted] = useState(false);
  const [testCount, setTestCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [caseStudiesConfig, setCaseStudiesConfig] = useState(null);

  const caseOptions = [
    { value: 'normal_control', label: 'Case 1: Normal Control' },
    { value: 'early_pd', label: 'Case 2: Early-Stage Parkinson\'s' },
    { value: 'moderate_pd', label: 'Case 3: Moderate Progression' },
    { value: 'advanced_pd', label: 'Case 4: Advanced Stage' }
  ];

  const caseToLabelMapping = {
    'normal_control': 'Case 1: Normal Control',
    'early_pd': 'Case 2: Early-Stage Parkinson\'s',
    'moderate_pd': 'Case 3: Moderate Progression',
    'advanced_pd': 'Case 4: Advanced Stage'
  };

  const caseDescriptions = {
    'normal_control': 'A healthy control subject with minimal physiological tremor. This serves as a baseline for comparison.',
    'early_pd': 'A mild, resting tremor primarily affecting one hand. The tremor is most prominent when the patient is at rest.',
    'moderate_pd': 'The tremor has become more pronounced and may affect both sides of the body, with some postural instability.',
    'advanced_pd': 'A severe tremor that significantly impacts daily activities, simulated here to show its intensity.'
  };

  // Load case studies configuration
  useEffect(() => {
    const loadCaseStudiesConfig = async () => {
      try {
        const configResponse = await axios.get('/api/case-studies-config');
        const config = configResponse.data;
        setCaseStudiesConfig(config);
      } catch (error) {
        console.error('Error loading case studies configuration:', error);
        setError('Failed to load case studies configuration');
      }
    };

    loadCaseStudiesConfig();
  }, []);

  // Create dynamic file mapping based on current configuration
  const getFileToCaseMapping = () => {
    if (!caseStudiesConfig) return {};
    
    return {
      [caseStudiesConfig.normal?.file]: 'normal_control',
      [caseStudiesConfig.earlyPD?.file]: 'early_pd',
      [caseStudiesConfig.moderatePD?.file]: 'moderate_pd',
      [caseStudiesConfig.advancedPD?.file]: 'advanced_pd'
    };
  };

  // Get available files for sensation test
  const getAvailableFiles = () => {
    if (!caseStudiesConfig) return [];
    
    const files = [];
    if (caseStudiesConfig.normal?.file) files.push(caseStudiesConfig.normal.file);
    if (caseStudiesConfig.earlyPD?.file) files.push(caseStudiesConfig.earlyPD.file);
    if (caseStudiesConfig.moderatePD?.file) files.push(caseStudiesConfig.moderatePD.file);
    if (caseStudiesConfig.advancedPD?.file) files.push(caseStudiesConfig.advancedPD.file);
    
    return files;
  };

  useEffect(() => {
    const loadSensationTestData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Wait for configuration to load
        if (!caseStudiesConfig) {
          setLoading(false);
          return;
        }

        const availableFiles = getAvailableFiles();
        if (availableFiles.length === 0) {
          setError('No case studies configured. Please configure the case studies in the Live Monitor first.');
          setLoading(false);
          return;
        }

        // Randomly select a file from the available files
        const randomFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
        setSelectedFile(randomFile);

        // Determine the feature to use (default to centeredTorque)
        let feature = 'centeredTorque';
        if (randomFile === caseStudiesConfig.normal?.file) {
          feature = caseStudiesConfig.normal?.feature || 'centeredTorque';
        } else if (randomFile === caseStudiesConfig.earlyPD?.file) {
          feature = caseStudiesConfig.earlyPD?.feature || 'centeredTorque';
        } else if (randomFile === caseStudiesConfig.moderatePD?.file) {
          feature = caseStudiesConfig.moderatePD?.feature || 'centeredTorque';
        } else if (randomFile === caseStudiesConfig.advancedPD?.file) {
          feature = caseStudiesConfig.advancedPD?.feature || 'centeredTorque';
        }

        // Load the randomly selected file data
        const response = await axios.get(`/api/file-data?filename=${randomFile}&feature=${feature}`);
        setFileData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading sensation test data:', error);
        setError(`Failed to load data: ${error.response?.data?.error || error.message}`);
        setLoading(false);
      }
    };

    loadSensationTestData();
  }, [caseStudiesConfig]);

  const handleSimulationToggle = () => {
    if (!isConnected) {
      console.warn('Cannot start simulation: haptic device not connected');
      return;
    }
    
    if (fileData) {
      onPlayToggle('sensation_test', fileData);
    }
  };

  const handleStopSimulation = () => {
    onPlayToggle('sensation_test', null);
    setShowGuessDialog(true);
  };

  const handleGuessSubmit = () => {
    if (!userGuess || !selectedFile) return;

    const fileToCaseMapping = getFileToCaseMapping();
    const correctCase = fileToCaseMapping[selectedFile];
    const isUserCorrect = userGuess === correctCase;
    
    setIsCorrect(isUserCorrect);
    setCorrectAnswer(correctCase);
    setShowResult(true);
    setTestCompleted(true);
    
    // Update test statistics
    setTestCount(prev => prev + 1);
    if (isUserCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleResultClose = () => {
    setShowResult(false);
    // Automatically load a new test after showing the result
    loadNewTest();
  };

  const loadNewTest = () => {
    // Close any open dialogs
    setShowGuessDialog(false);
    setShowResult(false);
    
    setUserGuess('');
    setIsCorrect(false);
    setCorrectAnswer('');
    setTestCompleted(false);
    setFileData(null);
    setSelectedFile(null);
    setLoading(true);
    
    // Load with a new random file
    const loadSensationTestData = async () => {
      try {
        const availableFiles = getAvailableFiles();
        if (availableFiles.length === 0) {
          setError('No case studies configured. Please configure the case studies in the Live Monitor first.');
          setLoading(false);
          return;
        }

        const randomFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
        setSelectedFile(randomFile);

        // Determine the feature to use
        let feature = 'centeredTorque';
        if (randomFile === caseStudiesConfig.normal?.file) {
          feature = caseStudiesConfig.normal?.feature || 'centeredTorque';
        } else if (randomFile === caseStudiesConfig.earlyPD?.file) {
          feature = caseStudiesConfig.earlyPD?.feature || 'centeredTorque';
        } else if (randomFile === caseStudiesConfig.moderatePD?.file) {
          feature = caseStudiesConfig.moderatePD?.feature || 'centeredTorque';
        } else if (randomFile === caseStudiesConfig.advancedPD?.file) {
          feature = caseStudiesConfig.advancedPD?.feature || 'centeredTorque';
        }

        const response = await axios.get(`/api/file-data?filename=${randomFile}&feature=${feature}`);
        setFileData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading new sensation test data:', error);
        setError(`Failed to load data: ${error.response?.data?.error || error.message}`);
        setLoading(false);
      }
    };

    loadSensationTestData();
  };

  const handleNewTest = () => {
    loadNewTest();
  };

  const getAccuracyPercentage = () => {
    return testCount > 0 ? Math.round((correctCount / testCount) * 100) : 0;
  };

  // Image placeholder component for sensation test
  const SensationTestImagePlaceholder = () => (
    <Box
      sx={{
        height: 120,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        p: 2,
        mb: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PsychologyIcon sx={{ fontSize: 30, mr: 1, opacity: 0.9 }} />
          <VisibilityOffIcon sx={{ fontSize: 25, opacity: 0.8 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Tremor Recognition Test
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
          Blind haptic feedback identification challenge
        </Typography>
      </Box>
    </Box>
  );

  // Check if all cases are configured
  const isFullyConfigured = () => {
    if (!caseStudiesConfig) return false;
    return caseStudiesConfig.normal?.file && 
           caseStudiesConfig.earlyPD?.file && 
           caseStudiesConfig.moderatePD?.file && 
           caseStudiesConfig.advancedPD?.file;
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="div">
            Tremor Recognition Test
          </Typography>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Experience haptic feedback from a randomly selected case study. After the simulation, 
            you'll be asked to identify which case you think the feedback represents.
          </Typography>

          {/* Image Placeholder */}
          <SensationTestImagePlaceholder />
          
          {/* Configuration Status */}
          {!isFullyConfigured() && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some case studies are not configured. Please configure all cases in the Live Monitor for the best experience.
            </Alert>
          )}
          
          {/* Hidden plot area - replaced with instruction box */}
          <Box sx={{ height: 200, mb: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="warning" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                {error}
              </Alert>
            ) : (
              <Paper 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: 'grey.50',
                  border: '2px dashed',
                  borderColor: 'grey.300'
                }}
              >
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  🎯 Blind Test
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                  The signal pattern is hidden to ensure a fair test of your haptic perception skills.
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Test Statistics */}
          {testCount > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Test Statistics
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip 
                  label={`Tests: ${testCount}`} 
                  variant="outlined" 
                  size="small"
                />
                <Chip 
                  label={`Correct: ${correctCount}`} 
                  variant="outlined" 
                  size="small"
                  color="success"
                />
                <Chip 
                  label={`Accuracy: ${getAccuracyPercentage()}%`} 
                  variant="outlined" 
                  size="small"
                  color={getAccuracyPercentage() >= 75 ? 'success' : getAccuracyPercentage() >= 50 ? 'warning' : 'error'}
                />
              </Stack>
            </Box>
          )}

          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              onClick={isPlaying ? handleStopSimulation : handleSimulationToggle}
              color={isPlaying ? 'secondary' : 'primary'}
              disabled={loading || !fileData || error || !isConnected || !isFullyConfigured()}
              title={!isConnected ? 'Haptic device not connected' : !isFullyConfigured() ? 'Please configure all case studies first' : ''}
              sx={{ flex: 1 }}
            >
              {isPlaying ? 'Stop & Guess' : 'Start Haptic Simulation'}
            </Button>
            
            {testCompleted && (
              <Button 
                variant="outlined" 
                onClick={handleNewTest}
                sx={{ flex: 1 }}
                title="Manually refresh with a new random case"
              >
                Refresh Test
              </Button>
            )}
          </Stack>

          {testCompleted && (
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={isCorrect ? 'Correct!' : 'Incorrect'} 
                color={isCorrect ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Guess Dialog */}
      <Dialog open={showGuessDialog} onClose={() => setShowGuessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>What case did you experience?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Based on the haptic feedback you just experienced, which case study do you think it represents?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Case</InputLabel>
            <Select
              value={userGuess}
              label="Select Case"
              onChange={(e) => setUserGuess(e.target.value)}
            >
              {caseOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGuessDialog(false)}>Cancel</Button>
          <Button onClick={handleGuessSubmit} variant="contained" disabled={!userGuess}>
            Submit Guess
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResult} onClose={handleResultClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isCorrect ? 'Correct! 🎉' : 'Incorrect'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {isCorrect 
              ? 'Great job! You correctly identified the haptic feedback pattern.'
              : 'Not quite right. Here\'s what you experienced:'
            }
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Your guess: {caseToLabelMapping[userGuess]}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Correct answer: {caseToLabelMapping[correctAnswer]}
            </Typography>
          </Box>
          
          {/* Show description of the correct case */}
          <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              About {caseToLabelMapping[correctAnswer]}:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {caseDescriptions[correctAnswer]}
            </Typography>
          </Paper>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            {!isCorrect && 'Keep practicing! The more you experience different tremor patterns, the better you\'ll become at identifying them.'}
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            A new test will automatically start when you close this dialog.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResultClose} variant="contained">
            Continue to Next Test
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SensationTestCard; 