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
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatIcon from '@mui/icons-material/Chat';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axios from 'axios';

const ClinicalSimulationCard = ({ isPlaying, onPlayToggle, isConnected }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caseStudiesConfig, setCaseStudiesConfig] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [patientInfo, setPatientInfo] = useState({});
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisReasoning, setDiagnosisReasoning] = useState('');
  const [showDiagnosisDialog, setShowDiagnosisDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [simulationCompleted, setSimulationCompleted] = useState(false);

  // Patient cases with different scenarios
  const patientCases = {
    'normal_control': {
      name: 'Sarah Johnson',
      age: 28,
      gender: 'Female',
      occupation: 'Software Engineer',
      presentingComplaint: 'Occasional hand shaking during presentations',
      responses: {
        'How long have you noticed the shaking?': 'About 6 months, but it\'s very mild and only happens when I\'m nervous.',
        'Does it happen at rest or during movement?': 'Only when I\'m doing something, like holding a pen or typing. It stops when I\'m relaxed.',
        'Is it worse on one side?': 'No, it affects both hands equally.',
        'Does anyone in your family have similar symptoms?': 'No, not that I know of.',
        'Do you take any medications?': 'Just birth control pills.',
        'Have you noticed any other symptoms?': 'No, just the occasional shaking.',
        'Does caffeine or stress make it worse?': 'Yes, definitely worse with coffee and when I\'m stressed.',
        'Does alcohol affect it?': 'Actually, it seems to get better after a glass of wine.'
      },
      correctDiagnosis: 'Physiological Tremor (Normal)',
      explanation: 'This is a normal physiological tremor, likely enhanced by stress and caffeine. The bilateral nature, improvement with alcohol, and lack of family history suggest this is not a pathological tremor.',
      hapticFile: null // Will be set dynamically
    },
    'early_pd': {
      name: 'Robert Chen',
      age: 62,
      gender: 'Male',
      occupation: 'Retired Teacher',
      presentingComplaint: 'Right hand shaking, especially when resting',
      responses: {
        'How long have you noticed the shaking?': 'About 8 months now. It started very subtly.',
        'Does it happen at rest or during movement?': 'Mostly when I\'m sitting still or resting my hand. It actually gets better when I use my hand.',
        'Is it worse on one side?': 'Yes, it\'s mainly my right hand, though I\'ve noticed some slight shaking in my left hand too.',
        'Does anyone in your family have similar symptoms?': 'My uncle had Parkinson\'s disease.',
        'Do you take any medications?': 'Just blood pressure medication.',
        'Have you noticed any other symptoms?': 'I feel a bit stiff in the morning, and my handwriting has gotten smaller.',
        'Does caffeine or stress make it worse?': 'Not really, it seems to be there regardless.',
        'Does alcohol affect it?': 'No change with alcohol.'
      },
      correctDiagnosis: 'Early-Stage Parkinson\'s Disease',
      explanation: 'The unilateral onset, rest tremor, improvement with movement, family history, and associated symptoms (stiffness, micrographia) strongly suggest early Parkinson\'s disease.',
      hapticFile: null // Will be set dynamically
    },
    'moderate_pd': {
      name: 'Margaret Williams',
      age: 68,
      gender: 'Female',
      occupation: 'Retired Nurse',
      presentingComplaint: 'Both hands shaking, difficulty with daily activities',
      responses: {
        'How long have you noticed the shaking?': 'About 2 years. It started on my left side and has gotten worse.',
        'Does it happen at rest or during movement?': 'Both, but it\'s worse when I\'m resting. It makes it hard to hold things steady.',
        'Is it worse on one side?': 'It started on the left, but now both sides are affected.',
        'Does anyone in your family have similar symptoms?': 'No family history.',
        'Do you take any medications?': 'I take medication for Parkinson\'s disease.',
        'Have you noticed any other symptoms?': 'I feel very stiff, especially in the morning. My balance isn\'t as good as it used to be.',
        'Does caffeine or stress make it worse?': 'Stress makes it worse, but caffeine doesn\'t seem to affect it.',
        'Does alcohol affect it?': 'No effect from alcohol.'
      },
      correctDiagnosis: 'Moderate Parkinson\'s Disease',
      explanation: 'Bilateral symptoms, progression over time, associated motor symptoms (rigidity, balance issues), and current medication use indicate moderate Parkinson\'s disease.',
      hapticFile: null // Will be set dynamically
    },
    'advanced_pd': {
      name: 'James Thompson',
      age: 75,
      gender: 'Male',
      occupation: 'Retired',
      presentingComplaint: 'Severe shaking affecting daily life',
      responses: {
        'How long have you noticed the shaking?': 'Many years now. It has gotten much worse over time.',
        'Does it happen at rest or during movement?': 'It\'s there all the time, but worse at rest. It\'s very disabling.',
        'Is it worse on one side?': 'Both sides are severely affected now.',
        'Does anyone in your family have similar symptoms?': 'No family history.',
        'Do you take any medications?': 'Multiple medications for Parkinson\'s, but they don\'t work as well anymore.',
        'Have you noticed any other symptoms?': 'I have severe stiffness, poor balance, and sometimes my feet freeze when I try to walk.',
        'Does caffeine or stress make it worse?': 'Everything makes it worse now.',
        'Does alcohol affect it?': 'No effect from alcohol.'
      },
      correctDiagnosis: 'Advanced Parkinson\'s Disease',
      explanation: 'Severe bilateral symptoms, long duration, medication resistance, and multiple associated symptoms (freezing, severe rigidity) indicate advanced Parkinson\'s disease.',
      hapticFile: null // Will be set dynamically
    }
  };

  const commonQuestions = [
    'How long have you noticed the shaking?',
    'Does it happen at rest or during movement?',
    'Is it worse on one side?',
    'Does anyone in your family have similar symptoms?',
    'Do you take any medications?',
    'Have you noticed any other symptoms?',
    'Does caffeine or stress make it worse?',
    'Does alcohol affect it?'
  ];

  const diagnosisOptions = [
    'Physiological Tremor (Normal)',
    'Early-Stage Parkinson\'s Disease',
    'Moderate Parkinson\'s Disease',
    'Advanced Parkinson\'s Disease'
  ];

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

  // Initialize patient case with haptic file
  useEffect(() => {
    if (caseStudiesConfig) {
      const availableCases = ['normal_control', 'early_pd', 'moderate_pd', 'advanced_pd'];
      const randomCase = availableCases[Math.floor(Math.random() * availableCases.length)];
      
      // Set haptic file based on configuration
      let hapticFile = null;
      if (randomCase === 'normal_control' && caseStudiesConfig.normal?.file) {
        hapticFile = caseStudiesConfig.normal.file;
      } else if (randomCase === 'early_pd' && caseStudiesConfig.earlyPD?.file) {
        hapticFile = caseStudiesConfig.earlyPD.file;
      } else if (randomCase === 'moderate_pd' && caseStudiesConfig.moderatePD?.file) {
        hapticFile = caseStudiesConfig.moderatePD.file;
      } else if (randomCase === 'advanced_pd' && caseStudiesConfig.advancedPD?.file) {
        hapticFile = caseStudiesConfig.advancedPD.file;
      }

      if (hapticFile) {
        setSelectedFile(hapticFile);
        setPatientInfo(patientCases[randomCase]);
        
        // Load haptic data
        const loadHapticData = async () => {
          try {
            setLoading(true);
            let feature = 'centeredTorque';
            if (randomCase === 'normal_control') {
              feature = caseStudiesConfig.normal?.feature || 'centeredTorque';
            } else if (randomCase === 'early_pd') {
              feature = caseStudiesConfig.earlyPD?.feature || 'centeredTorque';
            } else if (randomCase === 'moderate_pd') {
              feature = caseStudiesConfig.moderatePD?.feature || 'centeredTorque';
            } else if (randomCase === 'advanced_pd') {
              feature = caseStudiesConfig.advancedPD?.feature || 'centeredTorque';
            }

            const response = await axios.get(`/api/file-data?filename=${hapticFile}&feature=${feature}`);
            setFileData(response.data);
            setLoading(false);
          } catch (error) {
            console.error('Error loading haptic data:', error);
            setError(`Failed to load haptic data: ${error.response?.data?.error || error.message}`);
            setLoading(false);
          }
        };

        loadHapticData();
      } else {
        setError('No haptic data available for this case');
        setLoading(false);
      }
    }
  }, [caseStudiesConfig]);

  const handleAskQuestion = (question) => {
    if (patientInfo && patientInfo.responses[question]) {
      const newChat = [
        ...chatHistory,
        { type: 'question', content: question },
        { type: 'answer', content: patientInfo.responses[question] }
      ];
      setChatHistory(newChat);
    }
  };

  const handleCustomQuestion = () => {
    if (currentQuestion.trim()) {
      const newChat = [
        ...chatHistory,
        { type: 'question', content: currentQuestion },
        { type: 'answer', content: 'I\'m sorry, I don\'t have information about that specific question. Could you ask something else?' }
      ];
      setChatHistory(newChat);
      setCurrentQuestion('');
    }
  };

  const handleStartHapticSimulation = () => {
    if (fileData) {
      onPlayToggle('clinical_simulation', fileData);
    }
  };

  const handleStopHapticSimulation = () => {
    onPlayToggle('clinical_simulation', null);
    setCurrentStep(2); // Move to diagnosis step
  };

  const handleSubmitDiagnosis = () => {
    if (diagnosis && diagnosisReasoning) {
      const isCorrectDiagnosis = diagnosis === patientInfo.correctDiagnosis;
      setIsCorrect(isCorrectDiagnosis);
      setCorrectAnswer(patientInfo.correctDiagnosis);
      setShowResults(true);
      setSimulationCompleted(true);
    }
  };

  const handleNewSimulation = () => {
    setCurrentStep(0);
    setChatHistory([]);
    setDiagnosis('');
    setDiagnosisReasoning('');
    setShowDiagnosisDialog(false);
    setShowResults(false);
    setIsCorrect(false);
    setCorrectAnswer('');
    setSimulationCompleted(false);
    setFileData(null);
    setSelectedFile(null);
    setLoading(true);
    
    // Reload with new random case
    window.location.reload();
  };

  const steps = [
    'Patient History',
    'Haptic Examination',
    'Diagnosis'
  ];

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="div" gutterBottom>
            Clinical Simulation: Patient Consultation
          </Typography>
          
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Practice your clinical skills: take a patient history, perform haptic examination, and provide a diagnosis.
          </Typography>

          {/* Patient Information */}
          <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.light', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {patientInfo.name} | <strong>Age:</strong> {patientInfo.age} | <strong>Gender:</strong> {patientInfo.gender}
            </Typography>
            <Typography variant="body2">
              <strong>Occupation:</strong> {patientInfo.occupation}
            </Typography>
            <Typography variant="body2">
              <strong>Presenting Complaint:</strong> {patientInfo.presentingComplaint}
            </Typography>
          </Paper>

          {/* Progress Stepper */}
          <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Patient History */}
          {currentStep === 0 && (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Step 1: Take Patient History
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested Questions:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {commonQuestions.map((question) => (
                    <Chip
                      key={question}
                      label={question}
                      onClick={() => handleAskQuestion(question)}
                      sx={{ m: 0.5 }}
                      variant="outlined"
                      clickable
                    />
                  ))}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Custom Question:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Type your question..."
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                  />
                  <Button variant="outlined" onClick={handleCustomQuestion}>
                    Ask
                  </Button>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Conversation History:
                </Typography>
                <Box sx={{ flexGrow: 1, maxHeight: 300, overflow: 'auto' }}>
                  {chatHistory.length === 0 ? (
                    <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Start by asking the patient some questions...
                    </Typography>
                  ) : (
                    <List dense>
                      {chatHistory.map((item, index) => (
                        <ListItem key={index} sx={{ 
                          backgroundColor: item.type === 'question' ? 'grey.100' : 'white',
                          mb: 1,
                          borderRadius: 1
                        }}>
                          <ListItemText
                            primary={item.content}
                            secondary={item.type === 'question' ? 'You' : 'Patient'}
                            primaryTypographyProps={{
                              fontWeight: item.type === 'question' ? 'bold' : 'normal'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Paper>
              
              <Button
                variant="contained"
                onClick={() => setCurrentStep(1)}
                disabled={chatHistory.length === 0}
                sx={{ alignSelf: 'flex-end' }}
              >
                Proceed to Haptic Examination
              </Button>
            </Box>
          )}

          {/* Step 2: Haptic Examination */}
          {currentStep === 1 && (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Step 2: Haptic Examination
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                  Experience the patient's tremor through haptic feedback to understand the pattern and characteristics.
                </Typography>
                
                <Button
                  variant="contained"
                  onClick={isPlaying ? handleStopHapticSimulation : handleStartHapticSimulation}
                  color={isPlaying ? 'secondary' : 'primary'}
                  disabled={!isConnected}
                  size="large"
                  startIcon={isPlaying ? <MonitorHeartIcon /> : <MonitorHeartIcon />}
                  sx={{ mb: 2 }}
                >
                  {isPlaying ? 'Stop Haptic Simulation' : 'Start Haptic Simulation'}
                </Button>
                
                {isPlaying && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Experiencing haptic feedback... Click "Stop" when you're ready to proceed to diagnosis.
                  </Typography>
                )}
              </Paper>
              
              <Button
                variant="contained"
                onClick={() => setCurrentStep(2)}
                disabled={!fileData}
                sx={{ alignSelf: 'flex-end' }}
              >
                Proceed to Diagnosis
              </Button>
            </Box>
          )}

          {/* Step 3: Diagnosis */}
          {currentStep === 2 && (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Step 3: Provide Diagnosis
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, flexGrow: 1 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel>What is your diagnosis?</FormLabel>
                  <RadioGroup
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  >
                    {diagnosisOptions.map((option) => (
                      <FormControlLabel
                        key={option}
                        value={option}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Clinical Reasoning"
                  value={diagnosisReasoning}
                  onChange={(e) => setDiagnosisReasoning(e.target.value)}
                  placeholder="Explain your reasoning based on the patient history and haptic examination..."
                  sx={{ mb: 2 }}
                />
                
                <Button
                  variant="contained"
                  onClick={handleSubmitDiagnosis}
                  disabled={!diagnosis || !diagnosisReasoning}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  Submit Diagnosis
                </Button>
              </Paper>
            </Box>
          )}

          {/* New Simulation Button */}
          {simulationCompleted && (
            <Button
              variant="outlined"
              onClick={handleNewSimulation}
              sx={{ mt: 2 }}
            >
              Start New Simulation
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isCorrect ? 'Excellent Diagnosis! 🎉' : 'Diagnosis Review'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {isCorrect 
              ? 'Congratulations! You correctly identified the condition based on the patient history and haptic examination.'
              : 'Let\'s review the case together:'
            }
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Your diagnosis: {diagnosis}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Correct diagnosis: {correctAnswer}
            </Typography>
          </Box>
          
          <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Clinical Explanation:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patientInfo.explanation}
            </Typography>
          </Paper>
          
          <Typography variant="body2">
            {!isCorrect && 'Keep practicing! Clinical diagnosis improves with experience and careful attention to both patient history and physical examination findings.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClinicalSimulationCard; 