from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
import numpy as np
from scipy.signal import butter, filtfilt
import pandas as pd
from scipy.fft import fft, fftfreq
import os
import glob
import json
import time
from scipy import signal

app = Flask(__name__)
CORS(app)  # Allow all origins for development

# Load and preprocess data
DATA_DIR = 'data/original'
PROCESSED_DATA_DIR = 'data/processed'

def list_csv_files():
    return [os.path.basename(f) for f in glob.glob(os.path.join(DATA_DIR, '*.csv'))]

def load_data(file_name):
    df = pd.read_csv(os.path.join(DATA_DIR, file_name))
    t = df['Time (s)'].values
    theta = df['WFE_angle'].values
    fs = 1.0 / np.mean(np.diff(t))
    return t, theta, fs

def butter_filter(data, cutoff, fs, btype, order=4):
    nyq = 0.5 * fs
    norm_cutoff = cutoff / nyq
    b, a = butter(order, norm_cutoff, btype=btype)
    return filtfilt(b, a, data)

def moving_rms(x, window_samples):
    return np.sqrt(np.convolve(x**2, np.ones(window_samples)/window_samples, mode='same'))

def load_processed_data(file_name, feature='centeredTorque'):
    """Load processed data file and return time and requested feature"""
    try:
        file_path = os.path.join(PROCESSED_DATA_DIR, file_name)
        if not os.path.exists(file_path):
            return None, None
        
        df = pd.read_csv(file_path)
        
        # Check for different possible column names for time and features
        time_col = None
        feature_col = None
        
        if 'Time' in df.columns:
            time_col = 'Time'
        elif 'time' in df.columns:
            time_col = 'time'
            
        # Map feature names to possible column names
        feature_mapping = {
            'centeredTorque': ['centeredTorque', 'Centered Torque'],
            'centeredTremor': ['centeredTremor', 'Centered Tremor'],
            'centeredEnvelope': ['centeredEnvelope', 'Centered Envelope'],
            'centeredAngle': ['centeredAngle', 'Centered Angle'],
            'Centered Low Frequency Carrier': ['Centered Low Frequency Carrier'],
            'Normalized WFE Displacement': ['Normalized WFE Displacement']
        }
        
        possible_feature_cols = feature_mapping.get(feature, [feature])
        for col in possible_feature_cols:
            if col in df.columns:
                feature_col = col
                break
            
        if time_col and feature_col:
            return df[time_col].values, df[feature_col].values
        else:
            print(f"Missing required columns in {file_name}. Available columns: {list(df.columns)}")
            print(f"Looking for time column: {time_col}, feature column: {feature_col}")
            return None, None
            
    except Exception as e:
        print(f"Error loading processed data {file_name}: {e}")
        return None, None

# Global variables to store current data and streaming state
current_data = {
    'data': None,
    'parameters': None,
    'selected_feature': None,
    'is_streaming': False,
    'current_index': 0
}

@app.route('/')
def index():
    return "Welcome to the Signal Processing API!"

@app.route('/api/list-files', methods=['GET'])
def list_files():
    files = list_csv_files()
    return jsonify({'files': files})

@app.route('/api/process-signal', methods=['POST'])
def process_signal():
    params = request.json
    file_name = params.get('file_name', list_csv_files()[0])
    t, theta, fs = load_data(file_name)
    
    # Get WFE displacement
    df = pd.read_csv(os.path.join(DATA_DIR, file_name))
    wfe_disp = df['WFE_disp'].values
    
    # Signal decomposition
    low_cut = 1.5   # Hz
    high_cut = 3.0  # Hz
    theta_centered = theta - np.mean(theta)
    theta_base_centered = butter_filter(theta_centered, low_cut, fs, 'low')
    tremor_comp = butter_filter(theta, high_cut, fs, 'high')
    
    # Derivatives
    theta_dot = np.gradient(theta, 1/fs)
    theta_base_dot = np.gradient(theta_base_centered, 1/fs)
    
    # Envelope
    window_ms = 200
    window_samples = int(window_ms/1000 * fs)
    envelope = moving_rms(tremor_comp, window_samples)
    
    # Torque calculation
    Kp = params.get('Kp', 1.0)
    Kd = params.get('Kd', 0.2)
    alpha = params.get('alpha', 1.0)
    G = params.get('G', 1.0)  # Global gain
    
    # Raw base angle and derivatives for File Data Plot
    theta_base_raw = butter_filter(theta, low_cut, fs, 'low')
    theta_dot_raw = np.gradient(theta, 1/fs)
    theta_base_dot_raw = np.gradient(theta_base_raw, 1/fs)

    # Direct Torque Output - Hybrid Replay
    # τ = G × (θ_base + α × A × T_raw)
    tau_total_raw = G * (theta_base_raw + alpha * envelope * tremor_comp)

    # Centered version for comparison
    tremor_comp_centered = butter_filter(theta_centered, high_cut, fs, 'high')
    envelope_centered = moving_rms(tremor_comp_centered, window_samples)
    env_tremor_centered = envelope_centered * tremor_comp_centered
    
    # Centered direct torque calculation
    tau_total_centered = G * (theta_base_centered + alpha * envelope_centered * tremor_comp_centered)

    # Velocity error
    vel_err = theta_dot - theta_base_dot
    position_error = theta_base_centered - theta_centered
    
    return jsonify({
        'time': t.tolist(),
        'rawAngle': theta.tolist(),
        'baseAngle': theta_base_raw.tolist(),
        'centeredAngle': theta_centered.tolist(),
        'centeredBaseAngle': theta_base_centered.tolist(),
        'tremor': tremor_comp.tolist(),
        'envelope': envelope.tolist(),
        'torque': tau_total_raw.tolist(),
        'wfeDisp': wfe_disp.tolist(),
        'centeredTremor': tremor_comp_centered.tolist(),
        'centeredEnvelope': envelope_centered.tolist(),
        'centeredTorque': tau_total_centered.tolist(),
        'env_tremor': env_tremor_centered.tolist(),
        'vel_err': vel_err.tolist(),
        'position_error': position_error.tolist(),
        'hybridReplay': (theta_base_raw + alpha * envelope * tremor_comp).tolist(),
        'hybridReplayCentered': (theta_base_centered + alpha * envelope_centered * tremor_comp_centered).tolist()
    })

@app.route('/api/frequency-domain', methods=['GET'])
def frequency_domain():
    file_name = request.args.get('file_name', list_csv_files()[0])
    t, theta, fs = load_data(file_name)
    # Compute FFT
    n = len(theta)
    yf = fft(theta)
    xf = fftfreq(n, 1/fs)
    
    # Get positive frequencies only
    pos_freq_mask = xf > 0
    frequencies = xf[pos_freq_mask]
    magnitudes = np.abs(yf[pos_freq_mask])
    
    return jsonify({
        'frequencies': frequencies.tolist(),
        'magnitudes': magnitudes.tolist()
    })

@app.route('/api/envelope-data', methods=['GET'])
def envelope_data():
    file_name = request.args.get('file_name', list_csv_files()[0])
    t, theta, fs = load_data(file_name)
    # Signal decomposition
    low_cut = 1.5   # Hz
    high_cut = 3.0  # Hz
    tremor_comp = butter_filter(theta, high_cut, fs, 'high')
    
    # Envelope
    window_ms = 200
    window_samples = int(window_ms/1000 * fs)
    envelope = moving_rms(tremor_comp, window_samples)
    
    return jsonify({
        'time': t.tolist(),
        'tremor': tremor_comp.tolist(),
        'envelope': envelope.tolist()
    })

@app.route('/api/start-live-stream', methods=['POST'])
def start_live_stream():
    global current_data
    
    try:
        params = request.json
        filename = params.get('filename')
        start_time = params.get('startTime', 0)
        end_time = params.get('endTime', 10)
        selected_feature = params.get('selectedFeature', 'rawAngle')
        
        if not filename:
            return jsonify({'error': 'No filename provided'}), 400
            
        # Load and process data
        data = pd.read_csv(os.path.join(DATA_DIR, filename))
        
        # Determine sampling frequency from time data
        if 'time' in data.columns:
            time = data['time'].values
            # Calculate fs from time differences
            time_diffs = np.diff(time)
            fs = 1.0 / np.mean(time_diffs)  # Average sampling frequency
        else:
            # If no time column, estimate fs from data length and duration
            time = np.arange(len(data)) / 100  # Default to 100Hz if can't determine
            fs = 100
        
        # Get start and end indices
        start_idx = np.searchsorted(time, start_time)
        end_idx = np.searchsorted(time, end_time)
        
        # Extract data within the time range
        time = time[start_idx:end_idx]
        theta = data['theta'].values[start_idx:end_idx]
        theta_dot = data['theta_dot'].values[start_idx:end_idx]
        
        # Signal decomposition
        f, Pxx = signal.welch(theta, fs, nperseg=1024)
        tremor_freq = f[np.argmax(Pxx[1:]) + 1]  # Skip DC component
        
        # Extract tremor component
        b, a = signal.butter(4, [tremor_freq-0.5, tremor_freq+0.5], btype='band', fs=fs)
        tremor = signal.filtfilt(b, a, theta)
        
        # Calculate envelope
        analytic_signal = signal.hilbert(tremor)
        envelope = np.abs(analytic_signal)
        
        # Filtered angle (low-pass filtered)
        b_low, a_low = signal.butter(4, 1.0, btype='low', fs=fs)
        filtered_theta = signal.filtfilt(b_low, a_low, theta)
        
        # Calculate torque for all points
        Kp = params.get('Kp', 1.0)
        Kd = params.get('Kd', 1.0)
        alpha = params.get('alpha', 1.0)
        G = params.get('G', 1.0)
        
        # Direct Torque Output - Hybrid Replay
        # τ = G × (θ_base + α × A × T_raw)
        tau_total = G * (filtered_theta + alpha * envelope * tremor)
        
        # Store processed data
        current_data['data'] = {
            'time': time,
            'rawAngle': theta,
            'filteredAngle': filtered_theta,
            'angularVelocity': theta_dot,
            'torque': tau_total,
            'tremor': tremor,
            'envelope': envelope
        }
        current_data['parameters'] = params
        current_data['selected_feature'] = selected_feature
        current_data['is_streaming'] = True
        current_data['current_index'] = 0
        current_data['fs'] = fs  # Store sampling frequency
        
        return jsonify({
            'message': 'Live stream started successfully',
            'fs': fs
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stop-live-stream', methods=['POST'])
def stop_live_stream():
    global current_data
    current_data['is_streaming'] = False
    return jsonify({'message': 'Live stream stopped successfully'})

@app.route('/api/live-data')
def live_data():
    def generate():
        global current_data
        
        while current_data['is_streaming']:
            if current_data['data'] is None or current_data['current_index'] >= len(current_data['data']['time']):
                break
                
            # Get current data point
            time = current_data['data']['time'][current_data['current_index']]
            selected_feature = current_data['selected_feature']
            
            # Create data point with all features (for recording)
            data_point = {
                'time': float(time),
                'rawAngle': float(current_data['data']['rawAngle'][current_data['current_index']]),
                'filteredAngle': float(current_data['data']['filteredAngle'][current_data['current_index']]),
                'angularVelocity': float(current_data['data']['angularVelocity'][current_data['current_index']]),
                'torque': float(current_data['data']['torque'][current_data['current_index']]),
                'tremor': float(current_data['data']['tremor'][current_data['current_index']]),
                'envelope': float(current_data['data']['envelope'][current_data['current_index']])
            }
            
            # Send data
            yield f"data: {json.dumps(data_point)}\n\n"
            
            # Increment index
            current_data['current_index'] += 1
            
            # Simulate real-time delay based on actual sampling frequency
            time.sleep(1/current_data['fs'])
            
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/file-data', methods=['GET'])
def file_data():
    """API endpoint to load processed data files for case studies"""
    filename = request.args.get('filename')
    feature = request.args.get('feature', 'centeredTorque')  # Default to centeredTorque
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    time_data, feature_data = load_processed_data(filename, feature)
    
    if time_data is None or feature_data is None:
        return jsonify({'error': f'Could not load {feature} data from {filename}'}), 404
    
    return jsonify({
        'time': time_data.tolist(),
        'featureData': feature_data.tolist(),
        'feature': feature
    })

@app.route('/api/list-processed-files', methods=['GET'])
def list_processed_files():
    """API endpoint to list all available processed data files"""
    try:
        files = [os.path.basename(f) for f in glob.glob(os.path.join(PROCESSED_DATA_DIR, '*.csv'))]
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/case-studies-config', methods=['GET', 'POST'])
def case_studies_config():
    """API endpoint to get or update case studies configuration"""
    config_file = os.path.join(os.path.dirname(__file__), 'case_studies_config.json')
    
    if request.method == 'GET':
        try:
            if os.path.exists(config_file):
                with open(config_file, 'r') as f:
                    config = json.load(f)
                return jsonify(config)
            else:
                # Return default configuration
                default_config = {
                    'normal': '',
                    'earlyPD': '',
                    'moderatePD': '',
                    'advancedPD': ''
                }
                return jsonify(default_config)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            config = request.json
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)
            return jsonify({'message': 'Configuration saved successfully'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/save-recorded-data', methods=['POST'])
def save_recorded_data():
    try:
        data = request.json
        recorded_data = data.get('recordedData', [])
        filename = data.get('filename', 'recorded_data.csv')
        parameters = data.get('parameters', {})
        
        if not recorded_data:
            return jsonify({'error': 'No recorded data provided'}), 400
        
        # Create the processed directory if it doesn't exist
        os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
        
        # Create the full file path
        file_path = os.path.join(PROCESSED_DATA_DIR, filename)
        
        # Convert to DataFrame and save
        df = pd.DataFrame(recorded_data)
        df.to_csv(file_path, index=False)
        
        return jsonify({
            'message': 'Data saved successfully',
            'file_path': file_path,
            'filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 