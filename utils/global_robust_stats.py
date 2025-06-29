import os, glob, json
import pandas as pd
import numpy as np
from scipy.signal import butter, filtfilt

def butter_filter(data, cutoff, fs, btype, order=4):
    nyq = 0.5 * fs
    norm_cutoff = cutoff / nyq
    b, a = butter(order, norm_cutoff, btype=btype)
    return filtfilt(b, a, data)

def moving_rms(x, window_samples):
    return np.sqrt(np.convolve(x**2,
                               np.ones(window_samples)/window_samples,
                               mode='same'))

# === Config ===
INPUT_DIR   = '/Users/jimzhu/work_dir/Imperial/FYP/engineering_platform/data/original'
OUTPUT_JSON = '/Users/jimzhu/work_dir/Imperial/FYP/engineering_platform/data/global_robust_stats.json'
low_cut, high_cut = 1.5, 3.0   # Hz
window_ms = 200                # ms for RMS envelope
IQR_MULTIPLIER = 3.0           # Multiplier for IQR to determine robust bounds (1.5 is standard, 3.0 is for "extreme" outliers)

# features: now 'angle' refers to baseline-centered
features = ('angle', 'disp', 'carrier', 'vel_err', 'env_tremor', 'tremor', 'envelope')

# Collect all data across files for robust statistics
all_data = { feat: [] for feat in features }

for path in sorted(glob.glob(os.path.join(INPUT_DIR, '*.csv'))):
    print(f"Processing {os.path.basename(path)}...")
    df = pd.read_csv(path)
    
    # Handle different file formats
    if 'haptic_torque_data' in path:
        # Skip haptic_torque_data.csv as it has different structure
        print(f"  Skipping {os.path.basename(path)} - different format")
        continue
    
    # Check if required columns exist
    if 'Time (s)' not in df.columns or 'WFE_angle' not in df.columns or 'WFE_disp' not in df.columns:
        print(f"  Skipping {os.path.basename(path)} - missing required columns")
        continue
    
    t     = df['Time (s)'].values
    theta = df['WFE_angle'].values
    disp  = df['WFE_disp'].values
    fs    = 1.0 / np.mean(np.diff(t))

    # 1) center the angle
    theta_centered = theta - np.mean(theta)

    # 2) carrier from centered angle
    theta_base = butter_filter(theta_centered, low_cut, fs, 'low')

    # 3) vel_err from centered angle and its carrier
    theta_dot      = np.gradient(theta_centered,      1/fs)
    theta_base_dot = np.gradient(theta_base, 1/fs)
    vel_err = theta_base_dot - theta_dot

    # 4) tremor component from centered angle
    tremor_comp = butter_filter(theta_centered, high_cut, fs, 'high')
    window_samples = int(window_ms/1000 * fs)
    envelope       = moving_rms(tremor_comp, window_samples)
    env_tremor     = envelope * tremor_comp

    arrays = {
        'angle':      theta_centered,
        'disp':       disp,
        'carrier':    theta_base,
        'vel_err':    vel_err,
        'env_tremor': env_tremor,
        'tremor':     tremor_comp,      # centered tremor
        'envelope':   envelope          # centered envelope
    }

    # Collect all data for robust statistics
    for feat, arr in arrays.items():
        all_data[feat].extend(arr)

# Calculate global robust statistics
global_robust_stats = {}

for feat, data_array in all_data.items():
    if len(data_array) == 0:
        continue
        
    # Convert to numpy array and remove any NaN values
    data_array = np.array(data_array)
    data_array = data_array[~np.isnan(data_array)]
    
    if len(data_array) == 0:
        continue
    
    # Calculate percentiles
    q1 = np.percentile(data_array, 25)
    q3 = np.percentile(data_array, 75)
    iqr = q3 - q1
    
    # Calculate robust bounds (Q1 - N*IQR to Q3 + N*IQR)
    lower_bound = q1 - IQR_MULTIPLIER * iqr
    upper_bound = q3 + IQR_MULTIPLIER * iqr
    
    # Also calculate traditional min/max for comparison
    min_val = np.min(data_array)
    max_val = np.max(data_array)
    
    global_robust_stats[feat] = {
        'q1': float(q1),
        'q3': float(q3),
        'iqr': float(iqr),
        'lower_bound': float(lower_bound),
        'upper_bound': float(upper_bound),
        'robust_range': float(upper_bound - lower_bound),
        'min': float(min_val),
        'max': float(max_val),
        'total_samples': len(data_array),
        'iqr_multiplier': IQR_MULTIPLIER
    }

# save results
with open(OUTPUT_JSON, 'w') as f:
    json.dump(global_robust_stats, f, indent=2)

print(f"Global robust stats saved to {OUTPUT_JSON}:")
for feat, stats in global_robust_stats.items():
    print(f"  {feat:10s} Q1={stats['q1']:.6f}, Q3={stats['q3']:.6f}, IQR={stats['iqr']:.6f} (Multiplier: {stats['iqr_multiplier']})")
    print(f"           Robust bounds: [{stats['lower_bound']:.6f}, {stats['upper_bound']:.6f}]")
    print(f"           Traditional:   [{stats['min']:.6f}, {stats['max']:.6f}]")
    print(f"           Samples: {stats['total_samples']}")
    print() 