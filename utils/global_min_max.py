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
OUTPUT_JSON = '/Users/jimzhu/work_dir/Imperial/FYP/engineering_platform/data/global_stats.json'
low_cut, high_cut = 1.5, 3.0   # Hz
window_ms = 200                # ms for RMS envelope

# features: now 'angle' refers to baseline-centered
features = ('angle', 'disp', 'carrier', 'vel_err', 'env_tremor', 'tremor', 'envelope')
global_stats = { feat: {'min': float('inf'), 'max': float('-inf')} for feat in features }

for path in sorted(glob.glob(os.path.join(INPUT_DIR, '*.csv'))):
    df    = pd.read_csv(path)
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

    # update stats on each centered or raw feature
    for feat, arr in arrays.items():
        mn, mx = np.min(arr), np.max(arr)
        if mn < global_stats[feat]['min']:
            global_stats[feat]['min'] = float(mn)
        if mx > global_stats[feat]['max']:
            global_stats[feat]['max'] = float(mx)
        
            

# save results
with open(OUTPUT_JSON, 'w') as f:
    json.dump(global_stats, f, indent=2)

print(f"Global feature stats saved to {OUTPUT_JSON}:")
for feat, stats in global_stats.items():
    print(f"  {feat:10s} min = {stats['min']:.6f}, max = {stats['max']:.6f}")


'''
(py310) (base) jimzhu@Jims-MacBook-Air FYP % /opt/anaconda3/envs/py310/bin/python /User
s/jimzhu/work_dir/Imperial/FYP/engineering_platform/data/global_min_max.py
Global feature stats saved to /Users/jimzhu/work_dir/Imperial/FYP/engineering_platform/data/global_stats.json:
  angle      min = -3.252353, max = 4.004472
  disp       min = -3.313374, max = 2.670908
  carrier    min = -1.646718, max = 3.015625
  vel_err    min = -121.531825, max = 109.616224
  env_tremor min = -3.565071, max = 5.338192
  tremor     min = ...
  envelope   min = ...
(py310) (base) jimzhu@Jims-MacBook-Air FYP % 
'''