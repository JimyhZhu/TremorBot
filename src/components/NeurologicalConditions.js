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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Accessibility as AccessibilityIcon,
  Psychology as PsychologyIcon,
  LocalHospital as LocalHospitalIcon,
} from '@mui/icons-material';

const NeurologicalConditions = () => {
  const [expanded, setExpanded] = useState('panel1');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const conditions = [
    {
      id: 'parkinsons',
      title: 'Parkinson\'s Disease',
      subtitle: 'Progressive Movement Disorder',
      icon: <TrendingUpIcon color="primary" />,
      severity: 'Progressive',
      description: 'Parkinson\'s disease is a progressive neurodegenerative disorder characterized by the loss of dopaminergic neurons in the substantia nigra, leading to motor and non-motor symptoms.',
      epidemiology: {
        prevalence: '1-2% of population over 60 years',
        onset: 'Average age 60-65 years',
        gender: 'Slightly more common in males',
        riskFactors: ['Age', 'Family history', 'Environmental toxins', 'Head trauma']
      },
      pathophysiology: [
        'Loss of dopaminergic neurons in substantia nigra pars compacta',
        'Formation of Lewy bodies (alpha-synuclein aggregates)',
        'Dopamine deficiency in basal ganglia',
        'Disruption of motor control circuits'
      ],
      clinicalFeatures: {
        motor: [
          'Bradykinesia (required for diagnosis)',
          'Resting tremor (4-6 Hz)',
          'Rigidity (cogwheel or lead pipe)',
          'Postural instability',
          'Reduced facial expression',
          'Micrographia',
          'Shuffling gait'
        ],
        nonMotor: [
          'Depression and anxiety',
          'Sleep disturbances',
          'Autonomic dysfunction',
          'Cognitive impairment',
          'Olfactory dysfunction',
          'Constipation'
        ]
      },
      diagnosis: [
        'Clinical diagnosis based on cardinal signs',
        'Bradykinesia plus at least one other cardinal sign',
        'Response to levodopa supports diagnosis',
        'Imaging: DAT scan, MRI (rule out other causes)',
        'Exclusion of secondary parkinsonism'
      ],
      treatment: [
        'Levodopa/carbidopa (gold standard)',
        'Dopamine agonists',
        'MAO-B inhibitors',
        'COMT inhibitors',
        'Deep brain stimulation (advanced cases)',
        'Physical therapy and exercise'
      ],
      prognosis: 'Progressive disease with variable course. Motor symptoms typically respond well to medication initially, but complications develop over time.'
    },
    {
      id: 'hemiplegia',
      title: 'Hemiplegia',
      subtitle: 'Unilateral Paralysis',
      icon: <AccessibilityIcon color="secondary" />,
      severity: 'Acute/Chronic',
      description: 'Hemiplegia is complete paralysis of one side of the body, typically caused by stroke, brain injury, or other neurological conditions affecting the motor cortex or corticospinal tract.',
      epidemiology: {
        prevalence: 'Varies by cause, stroke affects ~800,000/year in US',
        onset: 'Any age, more common in elderly',
        gender: 'Varies by underlying cause',
        riskFactors: ['Hypertension', 'Diabetes', 'Atrial fibrillation', 'Smoking', 'Obesity']
      },
      pathophysiology: [
        'Damage to motor cortex (Brodmann area 4)',
        'Corticospinal tract disruption',
        'Upper motor neuron lesion',
        'Loss of voluntary motor control on contralateral side'
      ],
      clinicalFeatures: {
        motor: [
          'Complete paralysis of one side of body',
          'Spasticity and hyperreflexia',
          'Babinski sign positive',
          'Muscle weakness (hemiparesis)',
          'Loss of fine motor control',
          'Gait disturbance'
        ],
        associated: [
          'Aphasia (if left hemisphere affected)',
          'Neglect syndrome (if right hemisphere)',
          'Visual field defects',
          'Sensory loss',
          'Dysphagia',
          'Incontinence'
        ]
      },
      diagnosis: [
        'Clinical examination showing unilateral paralysis',
        'Imaging: CT/MRI to identify cause (stroke, tumor, trauma)',
        'Neurological assessment for associated deficits',
        'Vascular studies if stroke suspected',
        'Laboratory tests for underlying conditions'
      ],
      treatment: [
        'Acute: Thrombolysis for ischemic stroke',
        'Rehabilitation: Physical therapy, occupational therapy',
        'Spasticity management: Botox, baclofen',
        'Assistive devices and mobility aids',
        'Speech therapy if aphasia present',
        'Prevention of complications (pressure sores, contractures)'
      ],
      prognosis: 'Variable depending on cause and extent of damage. Early rehabilitation improves outcomes. Some recovery possible through neuroplasticity.'
    },
    {
      id: 'huntingtons',
      title: 'Huntington\'s Disease',
      subtitle: 'Inherited Neurodegenerative Disorder',
      icon: <PsychologyIcon color="error" />,
      severity: 'Progressive',
      description: 'Huntington\'s disease is an autosomal dominant inherited neurodegenerative disorder caused by CAG trinucleotide repeat expansion in the HTT gene, leading to progressive motor, cognitive, and psychiatric symptoms.',
      epidemiology: {
        prevalence: '5-10 per 100,000 in Western populations',
        onset: '30-50 years (adult-onset), juvenile form <20 years',
        gender: 'Equal in males and females',
        riskFactors: ['Family history (autosomal dominant)', 'CAG repeat length >40']
      },
      pathophysiology: [
        'CAG repeat expansion in HTT gene (>40 repeats)',
        'Mutant huntingtin protein accumulation',
        'Selective neuronal loss in striatum and cortex',
        'Dysfunction of basal ganglia circuits',
        'Impaired GABAergic transmission'
      ],
      clinicalFeatures: {
        motor: [
          'Chorea (involuntary, jerky movements)',
          'Dystonia and rigidity',
          'Bradykinesia (late stage)',
          'Dysarthria and dysphagia',
          'Gait disturbance and falls',
          'Oculomotor abnormalities'
        ],
        cognitive: [
          'Executive dysfunction',
          'Memory impairment',
          'Attention deficits',
          'Slowed processing speed',
          'Dementia (late stage)'
        ],
        psychiatric: [
          'Depression and anxiety',
          'Irritability and aggression',
          'Psychosis',
          'Obsessive-compulsive behaviors',
          'Suicidal ideation'
        ]
      },
      diagnosis: [
        'Family history of HD',
        'Clinical symptoms (chorea, cognitive decline, psychiatric symptoms)',
        'Genetic testing: CAG repeat count in HTT gene',
        'Imaging: MRI showing caudate atrophy',
        'Neuropsychological assessment'
      ],
      treatment: [
        'Symptomatic treatment only (no disease-modifying therapy)',
        'Tetrabenazine for chorea',
        'Antipsychotics for psychiatric symptoms',
        'Antidepressants for mood disorders',
        'Physical and occupational therapy',
        'Genetic counseling and family support'
      ],
      prognosis: 'Progressive and fatal disease. Average survival 15-20 years from diagnosis. Juvenile form progresses more rapidly.'
    }
  ];

  const comparisonTable = [
    {
      feature: 'Onset',
      parkinsons: 'Insidious, gradual',
      hemiplegia: 'Acute (stroke) or gradual (tumor)',
      huntingtons: 'Gradual, 30-50 years'
    },
    {
      feature: 'Inheritance',
      parkinsons: 'Sporadic (90%), familial (10%)',
      hemiplegia: 'Not inherited',
      huntingtons: 'Autosomal dominant'
    },
    {
      feature: 'Primary Motor Feature',
      parkinsons: 'Bradykinesia',
      hemiplegia: 'Paralysis',
      huntingtons: 'Chorea'
    },
    {
      feature: 'Cognitive Involvement',
      parkinsons: 'Late, mild',
      hemiplegia: 'Variable (aphasia, neglect)',
      huntingtons: 'Early, progressive'
    },
    {
      feature: 'Treatment',
      parkinsons: 'Symptomatic (levodopa)',
      hemiplegia: 'Rehabilitation',
      huntingtons: 'Symptomatic only'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
        Neurological Conditions Overview
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Clinical Context</AlertTitle>
        Understanding the key neurological conditions that affect movement is essential for accurate diagnosis and appropriate management. 
        This overview covers the most clinically relevant movement disorders encountered in practice.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {conditions.map((condition) => (
            <Accordion
              key={condition.id}
              expanded={expanded === condition.id}
              onChange={handleChange(condition.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {condition.icon}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {condition.title}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      {condition.subtitle}
                    </Typography>
                  </Box>
                  <Chip 
                    label={condition.severity} 
                    color={condition.severity === 'Progressive' ? 'error' : 'warning'} 
                    size="small" 
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body1" paragraph>
                    {condition.description}
                  </Typography>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Epidemiology
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Prevalence: ${condition.epidemiology.prevalence}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Typical Onset: ${condition.epidemiology.onset}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Gender Distribution: ${condition.epidemiology.gender}`}
                      />
                    </ListItem>
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Pathophysiology
                  </Typography>
                  <List dense>
                    {condition.pathophysiology.map((item, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Clinical Features
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Motor Symptoms
                      </Typography>
                      <List dense>
                        {condition.clinicalFeatures.motor.map((feature, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <AccessibilityIcon color="secondary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        {condition.id === 'hemiplegia' ? 'Associated Symptoms' : 
                         condition.id === 'huntingtons' ? 'Cognitive & Psychiatric' : 'Non-Motor Symptoms'}
                      </Typography>
                      <List dense>
                        {condition.clinicalFeatures[condition.id === 'hemiplegia' ? 'associated' : 
                                                   condition.id === 'huntingtons' ? 'cognitive' : 'nonMotor'].map((feature, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <PsychologyIcon color="info" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Diagnosis
                  </Typography>
                  <List dense>
                    {condition.diagnosis.map((item, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Treatment
                  </Typography>
                  <List dense>
                    {condition.treatment.map((item, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LocalHospitalIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>

                  <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Prognosis
                    </Typography>
                    <Typography variant="body2">
                      {condition.prognosis}
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
                Key Differences
              </Typography>
              
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Feature</TableCell>
                      <TableCell>PD</TableCell>
                      <TableCell>Hemiplegia</TableCell>
                      <TableCell>HD</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonTable.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {row.feature}
                        </TableCell>
                        <TableCell>{row.parkinsons}</TableCell>
                        <TableCell>{row.hemiplegia}</TableCell>
                        <TableCell>{row.huntingtons}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Clinical Pearls
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Bradykinesia required for PD"
                    secondary="Must be present for diagnosis"
                  />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Hemiplegia is unilateral"
                    secondary="Always affects one side only"
                  />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemIcon>
                    <PsychologyIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="HD is inherited"
                    secondary="Autosomal dominant pattern"
                  />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemIcon>
                    <TrendingUpIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="All are progressive"
                    secondary="Symptoms worsen over time"
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

export default NeurologicalConditions; 