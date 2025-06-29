import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab } from '@mui/material';
import LiveMonitor from './components/LiveMonitor';
import NeurologicalConditions from './components/NeurologicalConditions';
import PhysicalExamination from './components/PhysicalExamination';
import CaseStudies from './components/CaseStudies';
import ScienceIcon from '@mui/icons-material/Science';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PsychologyIcon from '@mui/icons-material/Psychology';
import axios from 'axios';

const App = () => {
  const [parameters, setParameters] = useState({
    G: 1.0,
    Kp: 1.5,
    Kd: 0.3,
    alpha: 1.0,
  });

  const location = useLocation();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Haptic Feedback Platform for Parkinson's Disease
          </Typography>
        </Toolbar>
        <Tabs 
          value={location.pathname} 
          indicatorColor="secondary" 
          textColor="inherit" 
          variant="fullWidth"
          aria-label="navigation tabs"
        >
          <Tab 
            label="Engineering Dashboard" 
            value="/live-monitor" 
            component={Link} 
            to="/live-monitor"
            icon={<MonitorHeartIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Neurological Conditions" 
            value="/neurological-conditions" 
            component={Link} 
            to="/neurological-conditions"
            icon={<PsychologyIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Physical Exam" 
            value="/physical-examination" 
            component={Link} 
            to="/physical-examination"
            icon={<MedicalServicesIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Case Studies" 
            value="/case-studies" 
            component={Link} 
            to="/case-studies"
            icon={<ScienceIcon />}
            iconPosition="start"
          />
        </Tabs>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<LiveMonitor parameters={parameters} setParameters={setParameters} />} />
          <Route path="/live-monitor" element={<LiveMonitor parameters={parameters} setParameters={setParameters} />} />
          <Route path="/neurological-conditions" element={<NeurologicalConditions />} />
          <Route path="/physical-examination" element={<PhysicalExamination />} />
          <Route path="/case-studies" element={<CaseStudies />} />
        </Routes>
      </Container>
    </Box>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper; 