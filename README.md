# TremorBot Platform

A comprehensive React-based platform combining **Engineering Dashboard** and **Medical Education** components for tremor analysis, haptic feedback development, and clinical training. This platform provides tools for signal processing, hardware testing, and medical education in physical examination.

## Platform Components

### 🛠️ Engineering Dashboard
- Real-time signal visualization and processing
- Interactive parameter control for tremor simulation
- Haptic device integration and testing
- Data recording and analysis tools
- Live streaming capabilities

### 🏥 Medical Education
- **Neurological Conditions Overview**: Comprehensive learning resources
- **Physical Examination Guide**: Clinical assessment training
- **Case Studies**: Interactive tremor pattern analysis
- **Clinical Simulation**: Patient consultation practice
- **Sensation Testing**: Haptic feedback discrimination training

## Features

- Real-time signal visualization
- Interactive parameter control (α, Kp, Kd)
- Frequency domain analysis
- Tremor envelope visualization
- Band-pass filtering
- RMS envelope extraction
- **Neurological Conditions Overview**
- **Physical Examination Guide for Parkinson's Disease**
- **Case Studies for Parkinson's Tremor Analysis**
- **Haptic Feedback Sensation Testing**
- **Clinical Simulation with Patient Scenarios**
- **Live Monitor with Real-time Streaming**

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- pip (Python package manager)

## Setup

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the Flask backend:
   ```bash
   python app.py
   ```

2. In a new terminal, start the React frontend:
   ```bash
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

### Engineering Dashboard

1. **Signal Processing**: Use the parameter controls to adjust:
   - α (Tremor Gain) - Controls tremor intensity in hybrid replay (0 ≤ α ≲ 1.5)
   - G (Global Gain) - Overall system gain
   - Kp, Kd - Not used in direct torque output mode

2. **Real-time Visualization**: The main visualization updates in real-time to show:
   - Raw angle
   - Base angle (low-frequency carrier)
   - Tremor component
   - Envelope
   - Hybrid replay trajectory: θ_play = θ_base + α × A × T_raw
   - Direct torque output: τ = G × (θ_base + α × A × T_raw)

3. **Live Monitor**: Access real-time streaming, haptic device control, and data recording

4. **Additional Analysis**: Frequency domain characteristics and tremor envelope analysis

### Medical Education

1. **Neurological Conditions**: Study comprehensive overviews of movement disorders
2. **Physical Examination**: Learn clinical assessment techniques for Parkinson's disease
3. **Case Studies**: Practice identifying different tremor patterns through haptic feedback
4. **Clinical Simulation**: Engage in realistic patient consultations with history-taking and diagnosis
5. **Sensation Testing**: Develop haptic discrimination skills through blind testing

## Neurological Conditions

The platform includes a comprehensive overview of key neurological conditions that affect movement, providing essential clinical knowledge for medical students and practitioners:

### Three Major Conditions Covered

1. **Parkinson's Disease**
   - Progressive neurodegenerative disorder
   - Loss of dopaminergic neurons in substantia nigra
   - Cardinal signs: bradykinesia, rigidity, tremor, postural instability
   - Epidemiology: 1-2% of population over 60 years
   - Treatment: Levodopa/carbidopa, dopamine agonists, deep brain stimulation

2. **Hemiplegia**
   - Unilateral paralysis typically caused by stroke
   - Damage to motor cortex or corticospinal tract
   - Clinical features: spasticity, hyperreflexia, Babinski sign
   - Associated symptoms: aphasia, neglect syndrome, visual field defects
   - Treatment: Rehabilitation, spasticity management, assistive devices

3. **Huntington's Disease**
   - Autosomal dominant inherited disorder
   - CAG trinucleotide repeat expansion in HTT gene
   - Motor: chorea, dystonia, bradykinesia
   - Cognitive: executive dysfunction, memory impairment
   - Psychiatric: depression, irritability, psychosis
   - Treatment: Symptomatic only (tetrabenazine, antipsychotics)

### Educational Features
- **Comprehensive Condition Profiles**: Detailed information on epidemiology, pathophysiology, clinical features, diagnosis, and treatment
- **Interactive Comparison Table**: Side-by-side comparison of key features across conditions
- **Clinical Pearls**: Essential diagnostic and management insights
- **Structured Learning**: Organized accordion interface for easy navigation
- **Evidence-Based Content**: Current clinical guidelines and research findings

This section provides foundational knowledge essential for understanding movement disorders and their clinical presentations.

## Physical Examination

The platform includes a comprehensive guide to the physical examination of Parkinson's disease, covering the four cardinal signs essential for diagnosis:

### Four Cardinal Signs

1. **Bradykinesia (Required for Diagnosis)**
   - Slowness of movement and reduced amplitude
   - Clinical features: hypokinesia, micrographia, reduced arm swing
   - Examination techniques: finger tapping, hand opening/closing, foot tapping
   - Most disabling feature affecting activities of daily living

2. **Rigidity**
   - Increased muscle tone affecting both agonist and antagonist muscles
   - Clinical features: cogwheel rigidity, lead pipe rigidity, asymmetric onset
   - Examination techniques: passive joint movement, contralateral activation
   - Contributes to characteristic stooped posture

3. **Tremor**
   - Typically rest tremor (4-6 Hz) with pill-rolling movement
   - Clinical features: asymmetric onset, suppressed by voluntary movement
   - Examination techniques: observation at rest, mental distraction, postural testing
   - Most recognizable but not required for diagnosis

4. **Postural Instability & Gait Disturbance**
   - Balance and walking problems appearing later in disease course
   - Clinical features: shuffling gait, festination, freezing, retropulsion
   - Examination techniques: pull test, tandem walking, turning assessment
   - Major cause of falls and disability

5. **Four Joint Motion Assessment (WFE, WAA, EFE, EPS)**
   - Standardized quantitative assessment of specific joint movements
   - **WFE**: Wrist Flexion-Extension - rapid alternating wrist movements
   - **WAA**: Wrist Abduction-Adduction - side-to-side wrist motion
   - **EFE**: Elbow Flexion-Extension - rapid elbow bending and straightening
   - **EPS**: Elbow Pronation-Supination - forearm rotation (palm up/down)
   - Used to quantify bradykinesia and rigidity for disease progression tracking

### Educational Features
- **Interactive Accordion Interface**: Expandable sections for each cardinal sign
- **Clinical Context**: Detailed explanations of examination techniques
- **Key Points Summary**: Essential diagnostic criteria and clinical pearls
- **Severity Indicators**: Clear marking of required vs. supportive features
- **Practical Guidance**: Step-by-step examination instructions

This section provides medical students with the foundational knowledge needed to perform accurate physical examinations for Parkinson's disease diagnosis.

## Case Studies

The platform includes interactive case studies for medical students to learn about different types of Parkinsonian tremors:

### Standard Cases
- **Case 1: Normal Control** - Baseline healthy control subject
- **Case 2: Early-Stage Parkinson's** - Mild resting tremor
- **Case 3: Moderate Progression** - More pronounced bilateral tremor
- **Case 4: Advanced Stage** - Severe tremor impacting daily activities

### Sensation Test
A special interactive test that:
1. **Dynamically syncs** with the case studies configuration from the Live Monitor
2. Randomly selects one of the four configured case studies
3. Plays haptic feedback without revealing the case
4. Prompts the user to identify which case they experienced
5. Provides immediate feedback on their answer
6. Allows multiple attempts with new random selections
7. Tracks test statistics and accuracy over time

**Configuration**: The sensation test automatically uses the files and features configured in the Live Monitor's "Case Studies Configuration" section. When administrators change the case study files, the sensation test immediately reflects these changes without requiring manual updates.

This feature helps students develop their ability to distinguish between different tremor patterns through haptic feedback alone.

### Clinical Simulation
A comprehensive clinical skills assessment that simulates real patient consultations:
1. **Patient History Taking**: Interactive chat interface to practice asking relevant clinical questions
2. **Haptic Examination**: Experience the patient's tremor through haptic feedback
3. **Clinical Diagnosis**: Provide a diagnosis based on history and examination findings
4. **Educational Feedback**: Detailed explanations of correct diagnoses and clinical reasoning

**Features**:
- **Focused Patient Scenarios**: Four carefully selected patient cases covering key movement disorders:
  - Physiological Tremor (Normal Control)
  - Early-Stage Parkinson's Disease
  - Moderate Parkinson's Disease
  - Advanced Parkinson's Disease
- **Interactive History Taking**: Suggested questions and custom question capability
- **Clinical Reasoning**: Students must explain their diagnostic thinking
- **Comprehensive Feedback**: Detailed clinical explanations for each case
- **Progressive Learning**: Step-by-step clinical workflow simulation
- **Realistic Patient Profiles**: Diverse demographics, occupations, and clinical presentations
- **Haptic Integration**: Direct haptic feedback experience for each case using configured data files

This feature helps students develop comprehensive clinical skills including history-taking, physical examination interpretation, and diagnostic reasoning for the most clinically relevant movement disorders.

## Hybrid Replay System

The platform implements a **Direct Torque Output** hybrid replay system that combines smooth voluntary movement with controllable tremor overlay:

### **Direct Torque Output Equation:**
```
τ = G × (θ_base + α × A × T_raw)
```

Where:
- **τ**: Direct torque output
- **G**: Global gain parameter
- **θ_base**: Smooth voluntary movement (low-frequency carrier)
- **A**: Envelope function (amplitude modulation)
- **T_raw**: Raw tremor component
- **α**: Tremor gain parameter (0 ≤ α ≲ 1.5)

### **System Behavior:**
- **No Feedback Control**: Direct torque calculation without PD control loop
- **Faithful Reproduction**: Torque directly equals the hybrid replay trajectory
- **Tunable Intensity**: α parameter controls tremor strength
- **Envelope Modulation**: Preserves tremor amplitude variations
- **Smooth Base**: Ensures clean voluntary movement
- **Realistic Range**: Covers practical tremor intensities

### **Parameter Effects:**
- **α = 0**: Pure carrier output (no tremor)
- **α = 1**: Full tremor output
- **α > 1**: Amplified tremor output
- **α ≲ 1.5**: Maximum realistic tremor intensity
- **G**: Scales overall torque magnitude

## Data Processing

The platform uses the following signal processing techniques:
- Butterworth filtering for signal decomposition
- Moving RMS for envelope extraction
- FFT for frequency domain analysis

## API Endpoints

- `/api/process-signal` (POST): Process signals with current parameters
- `/api/frequency-domain` (GET): Get frequency domain analysis
- `/api/envelope-data` (GET): Get tremor and envelope data
- `/api/case-studies-config` (GET/POST): Manage case studies configuration
- `/api/file-data` (GET): Load processed data files for case studies
- `/api/start-live-stream` (POST): Start real-time signal streaming
- `/api/stop-live-stream` (POST): Stop real-time signal streaming
- `/api/live-data` (GET): Server-sent events for live data streaming
- `/api/list-processed-files` (GET): List available processed data files
- `/api/save-recorded-data` (POST): Save recorded data with metadata

## Live Monitor

The platform includes a comprehensive Live Monitor system for real-time signal processing and haptic feedback:

### Key Features
- **Real-time Signal Streaming**: Live visualization of processed signals with configurable sampling rates
- **Haptic Device Integration**: Direct WebSocket communication with ESP32 haptic devices
- **Case Studies Configuration**: Dynamic configuration of case study files and features for haptic playback
- **Data Recording**: Capture and save processed data with parameter metadata
- **Normalized Visualization**: Global statistics-based normalization for consistent signal display
- **Manual Control**: Direct haptic device control for testing and calibration

### Case Studies Configuration
- **Dynamic File Management**: Configure which data files are used for each case study
- **Feature Selection**: Choose which signal features (centeredTorque, centeredAngle, etc.) to stream
- **Real-time Updates**: Changes immediately affect all case studies, sensation tests, and clinical simulations
- **Global Statistics**: Automatic normalization using global min/max or robust IQR statistics

### Streaming Capabilities
- **High-Speed Streaming**: Support for 1000Hz+ sampling rates with efficient batching
- **Multiple Signal Types**: Stream centered angles, torques, envelopes, and displacement data
- **Looping Support**: Continuous playback for extended haptic experiences
- **Connection Management**: Automatic reconnection and status monitoring
