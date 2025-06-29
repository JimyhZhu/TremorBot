import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CardMedia
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import axios from 'axios';

const CaseCard = ({ caseData, isPlaying, onPlayToggle, isConnected }) => {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!caseData.dataFile) {
        setLoading(false);
        setError('No data file configured for this case');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`/api/file-data?filename=${caseData.dataFile}&feature=${caseData.feature}`);
        setFileData(response.data);
      } catch (error) {
        console.error(`Error fetching data for ${caseData.dataFile}:`, error);
        setError(`Failed to load data: ${error.response?.data?.error || error.message}`);
      }
      setLoading(false);
    };

    fetchCaseData();
  }, [caseData.dataFile, caseData.feature]);

  const handleSimulationToggle = () => {
    if (!isConnected) {
      console.warn('Cannot start simulation: haptic device not connected');
      return;
    }
    
    if (fileData) {
      onPlayToggle(caseData.id, fileData);
    }
  };

  const getFeatureLabel = (feature) => {
    const labels = {
      'centeredTorque': 'Centered Torque',
      'centeredTremor': 'Centered Tremor',
      'centeredEnvelope': 'Centered Envelope',
      'centeredAngle': 'Centered Angle',
      'Centered Low Frequency Carrier': 'Centered Low Frequency Carrier',
      'Normalized WFE Displacement': 'Normalized WFE Displacement'
    };
    return labels[feature] || feature;
  };

  // Enhanced case information
  const getCaseDetails = (caseId) => {
    const details = {
      'normal_control': {
        clinicalFeatures: [
          'Low-amplitude bilateral physiological tremor (0.2-0.5°)',
          'Frequency 8-12 Hz, accentuated by anxiety/stress, suppressed at complete rest',
          'No rest tremor, rigidity, bradykinesia, or postural instability'
        ],
        tremorCharacteristics: [
          'Physiological tremor present in all healthy individuals',
          'Enhanced by stress, fatigue, and caffeine',
          'Action/postural tremor pattern',
          'No pathological significance',
          'Serves as baseline for comparison'
        ],
        clinicalSignificance: 'Understanding normal physiological tremor is crucial for distinguishing it from pathological tremors. This baseline helps students recognize when tremor patterns deviate from normal.',
        differentialDiagnosis: ['Enhanced physiological tremor', 'Essential tremor (mild)', 'Anxiety-related tremor'],
        hapticExperience: 'Students will feel minimal, smooth oscillations that represent normal physiological tremor. This provides a reference point for normal hand stability.',
        imagePlaceholder: {
          title: 'Normal Physiological Tremor',
          description: 'Smooth, low-amplitude oscillations representing healthy hand stability',
          color: '#4caf50'
        }
      },
      'early_pd': {
        clinicalFeatures: [
          'Unilateral rest tremor (4-6 Hz) with classic pill-rolling quality',
          'Mild cogwheel rigidity of the wrist/ankle, more pronounced on the affected side',
          'Early bradykinesia: slowed finger tapping, decreased arm swing, micrographia',
          'No significant postural instability or gait disturbance'
        ],
        tremorCharacteristics: [
          'Classic "pill-rolling" rest tremor with thumb-forefinger opposition',
          'Asymmetric involvement with contralateral spread over 1-2 years',
          'Tremor amplitude: 1-3° peak-to-peak, worsens with stress/fatigue',
          'Suppressed during voluntary movement, re-emerges after 1-2 seconds of rest',
          'May spread to ipsilateral leg, chin, or lips'
        ],
        clinicalSignificance: 'Early detection of Parkinson\'s disease is critical for optimal treatment outcomes. The unilateral rest tremor is often the first motor symptom, and early intervention can significantly improve long-term prognosis.',
        differentialDiagnosis: ['Essential tremor', 'Drug-induced parkinsonism', 'Vascular parkinsonism'],
        hapticExperience: 'Students will experience the characteristic rest tremor with its distinctive frequency and amplitude, helping them recognize early Parkinson\'s disease patterns.',
        imagePlaceholder: {
          title: 'Early Parkinson\'s Disease',
          description: 'Unilateral pill-rolling tremor with characteristic 4-6 Hz frequency',
          color: '#2196f3'
        }
      },
      'moderate_pd': {
        clinicalFeatures: [
          'Bilateral, but asymmetrical, rest and action tremor (4-6 Hz)',
          'Moderate rigidity (cogwheel and lead-pipe) in both upper limbs',
          'Clearly demonstrable bradykinesia: decreased facial expression, slowed repetitive movements',
          'Early postural reflex impairment (positive pull-test), festinating/shuffling gait'
        ],
        tremorCharacteristics: [
          'Bilateral rest and postural tremor with persistent asymmetry',
          'Increased tremor amplitude (3-5° peak-to-peak) with functional impact',
          'Tremor may affect head (titubation), voice, and trunk',
          'More pronounced during stress, anxiety, and dual-task performance',
          'May show "re-emergent tremor" after postural hold'
        ],
        clinicalSignificance: 'Moderate Parkinson\'s disease shows clear functional impact and bilateral involvement, representing the typical presentation when patients seek medical attention. This stage requires comprehensive management strategies.',
        differentialDiagnosis: ['Essential tremor', 'Multiple system atrophy', 'Progressive supranuclear palsy'],
        hapticExperience: 'Students will feel more pronounced tremor with bilateral characteristics, demonstrating the progression of Parkinson\'s disease and its functional impact.',
        imagePlaceholder: {
          title: 'Moderate Parkinson\'s Disease',
          description: 'Bilateral asymmetric tremor with increased amplitude and functional impact',
          color: '#ff9800'
        }
      },
      'advanced_pd': {
        clinicalFeatures: [
          'Severe, often action and rest tremor with superimposed peak-dose dyskinesias',
          'Marked rigidity and bradykinesia leading to near-constant hypokinesia',
          'Poor postural reflexes with frequent falls, freezing of gait, festination',
          'Motor fluctuations ("on-off" phenomenon) and levodopa-induced dyskinesias',
          'Prominent non-motor features: orthostatic hypotension, dysphagia, cognitive impairment/dementia'
        ],
        tremorCharacteristics: [
          'Large amplitude tremor (5-8° peak-to-peak) affecting all limbs and trunk',
          'Continuous rest and action tremor with superimposed dyskinesias',
          'Severe functional impairment requiring assistive devices',
          'Medication-resistant component with motor fluctuations',
          'May show "on-off" phenomenon with sudden tremor cessation'
        ],
        clinicalSignificance: 'Advanced Parkinson\'s disease demonstrates the full spectrum of motor symptoms and their impact on daily activities, highlighting the need for comprehensive management including medication optimization, deep brain stimulation consideration, and multidisciplinary care.',
        differentialDiagnosis: ['Multiple system atrophy', 'Progressive supranuclear palsy', 'Corticobasal degeneration'],
        hapticExperience: 'Students will experience severe, disabling tremor that clearly demonstrates the impact of advanced Parkinson\'s disease on motor function.',
        imagePlaceholder: {
          title: 'Advanced Parkinson\'s Disease',
          description: 'Severe bilateral tremor with dyskinesias and motor fluctuations',
          color: '#f44336'
        }
      }
    };
    return details[caseId] || {};
  };

  const caseDetails = getCaseDetails(caseData.id);
  
  const plotLayout = {
      margin: { l: 40, r: 20, t: 20, b: 40 },
      xaxis: { title: 'Time (s)' },
      yaxis: { title: getFeatureLabel(caseData.feature) },
      showlegend: false,
      height: 200,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
  };

  const trace = fileData ? [{
    x: fileData.time,
    y: fileData.featureData,
    type: 'scatter',
    mode: 'lines',
    line: { color: '#1f77b4', width: 1.5 }
  }] : [];

  const getSeverityColor = (severity) => {
    const colors = {
      'normal': 'success',
      'early': 'info',
      'moderate': 'warning',
      'advanced': 'error'
    };
    return colors[severity] || 'default';
  };

  // Image placeholder component
  const ImagePlaceholder = ({ title, description, color }) => (
    <Box
      sx={{
        height: 120,
        backgroundColor: color,
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
          background: `linear-gradient(45deg, ${color} 0%, ${color}dd 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ImageIcon sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" component="div">
            {caseData.title}
          </Typography>
          <Chip 
            label={caseData.severity?.toUpperCase()} 
            color={getSeverityColor(caseData.severity)}
            size="small"
          />
        </Box>
        
        {/* Image Placeholder */}
        {caseDetails.imagePlaceholder && (
          <ImagePlaceholder 
            title={caseDetails.imagePlaceholder.title}
            description={caseDetails.imagePlaceholder.description}
            color={caseDetails.imagePlaceholder.color}
          />
        )}
        
        <Typography sx={{ mb: 2 }} color="text.secondary">
          {caseData.description}
        </Typography>

        {/* Clinical Features Summary */}
        {caseDetails.clinicalFeatures && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssessmentIcon sx={{ mr: 1 }} />
              Key Clinical Features
            </Typography>
            <List dense>
              {caseDetails.clinicalFeatures.map((feature, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={feature}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        <Box sx={{ height: 200, mb: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="warning" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              {error}
            </Alert>
          ) : fileData ? (
            <Plot
              data={trace}
              layout={plotLayout}
              style={{ width: '100%', height: '100%' }}
              config={{ displayModeBar: false }}
            />
          ) : (
            <Typography sx={{ textAlign: 'center', pt: '45%' }}>No data to display</Typography>
          )}
        </Box>

        {/* Expandable Detailed Information */}
        {caseDetails.clinicalFeatures && (
          <Accordion 
            expanded={expanded} 
            onChange={() => setExpanded(!expanded)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                Detailed Clinical Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {/* Tremor Characteristics */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimelineIcon sx={{ mr: 1 }} />
                    Tremor Characteristics
                  </Typography>
                  <List dense>
                    {caseDetails.tremorCharacteristics.map((characteristic, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={characteristic}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Clinical Significance */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon sx={{ mr: 1 }} />
                    Clinical Significance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {caseDetails.clinicalSignificance}
                  </Typography>
                </Box>

                {/* Differential Diagnosis */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Differential Diagnosis
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {caseDetails.differentialDiagnosis.map((diagnosis, index) => (
                      <Chip 
                        key={index} 
                        label={diagnosis} 
                        variant="outlined" 
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>

                {/* Haptic Experience */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Expected Haptic Experience
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {caseDetails.hapticExperience}
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        <Button 
          variant="contained" 
          onClick={handleSimulationToggle}
          color={isPlaying ? 'secondary' : 'primary'}
          disabled={loading || !fileData || error || !isConnected}
          title={!isConnected ? 'Haptic device not connected' : ''}
          sx={{ mt: 'auto' }}
        >
          {isPlaying ? 'Stop Simulation' : 'Start Haptic Simulation'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CaseCard; 