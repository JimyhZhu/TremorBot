import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Accessibility as AccessibilityIcon,
  DirectionsWalk as DirectionsWalkIcon,
  PlayCircle as PlayCircleIcon,
} from '@mui/icons-material';

const PhysicalExamination = () => {
  const [expanded, setExpanded] = useState('panel1');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const examinationSigns = [
    {
      id: 'bradykinesia',
      title: '1. Bradykinesia',
      subtitle: 'Slowness of Movement',
      required: true,
      icon: <TrendingUpIcon color="primary" />,
      videoUrl: 'https://www.youtube.com/embed/AK0r4_5WhUo',
      videoTitle: 'Bradykinesia Examination - Stanford Medicine 25',
      description: 'Bradykinesia is the hallmark feature of Parkinson\'s disease and is required for diagnosis. It refers to slowness of movement and reduced amplitude of movement.',
      clinicalFeatures: [
        'Reduced spontaneous movement (hypokinesia)',
        'Slowed execution of voluntary movements',
        'Decreased amplitude of repetitive movements',
        'Difficulty initiating movement (akinesia)',
        'Reduced facial expression (hypomimia)',
        'Micrographia (small handwriting)',
        'Reduced arm swing during walking'
      ],
      examinationTechniques: [
        'Finger tapping test: Ask patient to tap thumb and index finger rapidly',
        'Hand opening/closing: Rapid opening and closing of hands',
        'Foot tapping: Rapid tapping of foot on ground',
        'Rapid alternating movements: Pronation/supination of hands',
        'Observe for reduced amplitude and speed'
      ],
      clinicalSignificance: 'Bradykinesia is the most disabling feature of PD and is often the first symptom noticed by patients. It affects activities of daily living and is a key target for treatment.',
      severity: 'Required for diagnosis'
    },
    {
      id: 'rigidity',
      title: '2. Rigidity',
      subtitle: 'Increased Muscle Tone',
      required: false,
      icon: <AccessibilityIcon color="secondary" />,
      videoUrl: 'https://www.youtube.com/embed/cxHpFWKIfGw?start=311',
      videoTitle: 'Rigidity Examination - Stanford Medicine 25 (5:11-8:11)',
      description: 'Rigidity is increased muscle tone that is present throughout the range of movement and affects both agonist and antagonist muscles.',
      clinicalFeatures: [
        'Cogwheel rigidity: Ratchet-like resistance during passive movement',
        'Lead pipe rigidity: Uniform resistance throughout range of motion',
        'Present in both directions of movement',
        'Often asymmetric, affecting one side more than the other',
        'May be enhanced by contralateral voluntary movement',
        'Can affect neck, trunk, and limbs'
      ],
      examinationTechniques: [
        'Passive movement of joints: Check for resistance',
        'Cogwheel phenomenon: Most prominent at wrist and elbow',
        'Contralateral activation: Ask patient to move opposite limb',
        'Neck rigidity: Passive rotation and flexion of neck',
        'Trunk rigidity: Passive rotation of shoulders'
      ],
      clinicalSignificance: 'Rigidity contributes to the characteristic stooped posture and reduced arm swing. It can cause pain and stiffness, particularly in the early morning.',
      severity: 'Common but not required'
    },
    {
      id: 'tremor',
      title: '3. Tremor',
      subtitle: 'Involuntary Rhythmic Movement',
      required: false,
      icon: <TrendingUpIcon color="error" />,
      videoUrl: 'https://www.youtube.com/embed/cxHpFWKIfGw?start=491',
      videoTitle: 'Tremor Examination - Stanford Medicine 25 (8:11-11:42)',
      description: 'Tremor in Parkinson\'s disease is typically a rest tremor, but kinetic and postural tremors may also occur.',
      clinicalFeatures: [
        'Rest tremor: Present when limb is at rest, typically 4-6 Hz',
        'Pill-rolling tremor: Characteristic thumb-forefinger movement',
        'Usually asymmetric and unilateral initially',
        'Suppressed by voluntary movement',
        'May re-emerge after maintaining posture (re-emergent tremor)',
        'Can affect jaw, lips, tongue, and legs'
      ],
      examinationTechniques: [
        'Observe hands at rest: Look for pill-rolling movement',
        'Mental distraction: Ask patient to count backwards',
        'Postural tremor: Arms outstretched, palms down',
        'Kinetic tremor: Finger-to-nose testing',
        'Check for jaw and lip tremor'
      ],
      clinicalSignificance: 'Rest tremor is the most recognizable feature of PD but is not required for diagnosis. It can be socially embarrassing and affect fine motor tasks.',
      severity: 'Common but not required'
    },
    {
      id: 'posturalInstability',
      title: '4. Postural Instability & Gait Disturbance',
      subtitle: 'Balance and Walking Problems',
      required: false,
      icon: <DirectionsWalkIcon color="warning" />,
      videoUrl: 'https://www.youtube.com/embed/cxHpFWKIfGw?start=702',
      videoTitle: 'Gait & Postural Instability - Stanford Medicine 25 (11:42+)',
      description: 'Postural instability and gait disturbances typically appear later in the disease course and are major causes of disability.',
      clinicalFeatures: [
        'Reduced postural reflexes',
        'Shuffling gait with short steps',
        'Reduced arm swing',
        'Festination (involuntary acceleration)',
        'Freezing of gait',
        'Difficulty turning',
        'Retropulsion on pull test',
        'Stooped posture'
      ],
      examinationTechniques: [
        'Pull test: Stand behind patient, pull shoulders backward',
        'Observe walking: Look for shuffling, reduced arm swing',
        'Tandem walking: Heel-to-toe walking',
        'Turning: Ask patient to turn 360 degrees',
        'Freezing: Observe for sudden stops during walking'
      ],
      clinicalSignificance: 'Postural instability is a major cause of falls and disability. It typically responds poorly to medication and may require surgical intervention.',
      severity: 'Late feature'
    },
    {
      id: 'jointMotions',
      title: '5. Four Joint Motion Assessment',
      subtitle: 'WFE, WAA, EFE, EPS',
      required: false,
      icon: <AccessibilityIcon color="info" />,
      videoUrl: 'https://www.youtube.com/embed/0hhcxaeOCYs?start=80',
      videoTitle: 'Joint Motion Assessment - GeekyMedics (1:20+)',
      description: 'The four joint motion assessment evaluates specific movement patterns that are commonly affected in Parkinson\'s disease and other movement disorders.',
      clinicalFeatures: [
        'WFE (Wrist Flexion-Extension): Impaired smooth alternating movements',
        'WAA (Wrist Abduction-Adduction): Reduced range and speed of motion',
        'EFE (Elbow Flexion-Extension): Decreased amplitude and frequency',
        'EPS (Elbow Pronation-Supination): Cogwheel rigidity and bradykinesia'
      ],
      examinationTechniques: [
        'WFE: Ask patient to flex and extend wrist rapidly and smoothly',
        'WAA: Instruct patient to move wrist side-to-side (ulnar/radial deviation)',
        'EFE: Have patient flex and extend elbow in rapid alternating motion',
        'EPS: Ask patient to rotate forearm (palm up/palm down) rapidly',
        'Observe for: amplitude, speed, smoothness, and fatigue'
      ],
      clinicalSignificance: 'These specific joint motions help quantify bradykinesia and rigidity. They are sensitive indicators of motor dysfunction and can be used to track disease progression and treatment response.',
      severity: 'Quantitative assessment tool'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
        Physical Examination of Parkinson's Disease
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Clinical Context</AlertTitle>
        The diagnosis of Parkinson's disease is primarily clinical, based on the presence of cardinal motor features. 
        A thorough physical examination is essential for accurate diagnosis and assessment of disease severity.
        Watch the embedded videos from Stanford Medicine 25 for visual demonstrations of each examination technique.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {examinationSigns.map((sign) => (
            <Accordion
              key={sign.id}
              expanded={expanded === sign.id}
              onChange={handleChange(sign.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {sign.icon}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {sign.title}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      {sign.subtitle}
                    </Typography>
                  </Box>
                  {sign.required && (
                    <Chip 
                      label="Required" 
                      color="error" 
                      size="small" 
                      icon={<WarningIcon />}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body1" paragraph>
                    {sign.description}
                  </Typography>

                  {/* Video Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <PlayCircleIcon sx={{ mr: 1 }} />
                      Video Demonstration
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {sign.videoTitle}
                      </Typography>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 0,
                          paddingBottom: '56.25%', // 16:9 aspect ratio
                          mb: 2
                        }}
                      >
                        <iframe
                          src={sign.videoUrl}
                          title={sign.videoTitle}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </Box>
                    </Paper>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Clinical Features
                  </Typography>
                  <List dense>
                    {sign.clinicalFeatures.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Examination Techniques
                  </Typography>
                  <List dense>
                    {sign.examinationTechniques.map((technique, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <InfoIcon color="info" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={technique} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Clinical Significance
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {sign.clinicalSignificance}
                  </Typography>

                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="primary">
                      Severity: {sign.severity}
                    </Typography>
                  </Paper>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Points
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Bradykinesia is required for diagnosis"
                    secondary="Must be present to diagnose PD"
                  />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Asymmetric onset is typical"
                    secondary="Symptoms often start on one side"
                  />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemIcon>
                    <TrendingUpIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Progressive disease"
                    secondary="Symptoms worsen over time"
                  />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Response to levodopa"
                    secondary="Improvement supports diagnosis"
                  />
                </ListItem>

                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemIcon>
                    <AccessibilityIcon color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Four Joint Motions"
                    secondary="WFE, WAA, EFE, EPS"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Four Joint Motion Assessment
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Standardized assessment of specific joint movements to quantify motor dysfunction:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary="WFE - Wrist Flexion-Extension"
                    secondary="Rapid alternating wrist movements"
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary="WAA - Wrist Abduction-Adduction"
                    secondary="Side-to-side wrist motion"
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary="EFE - Elbow Flexion-Extension"
                    secondary="Rapid elbow bending and straightening"
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary="EPS - Elbow Pronation-Supination"
                    secondary="Forearm rotation (palm up/down)"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Video Resources
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Videos from Stanford Medicine 25 and GeekyMedics provide expert demonstrations of physical examination techniques for movement disorders.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PlayCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Bradykinesia"
                    secondary="Stanford Medicine 25 - Complete demonstration"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PlayCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Rigidity, Tremor, Gait"
                    secondary="Stanford Medicine 25 - Timestamps: 5:11-8:11, 8:11-11:42, 11:42+"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PlayCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Joint Motion Assessment"
                    secondary="GeekyMedics - Start time: 1:20"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PhysicalExamination; 