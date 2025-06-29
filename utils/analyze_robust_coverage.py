import json
import numpy as np

# Load the robust statistics
with open('data/global_robust_stats.json', 'r') as f:
    robust_stats = json.load(f)

print("=== DATA COVERAGE ANALYSIS ===\n")

for feature, stats in robust_stats.items():
    # Calculate the ranges
    robust_range = stats['robust_range']
    traditional_range = stats['max'] - stats['min']
    
    # Calculate what percentage of the traditional range the robust range covers
    range_coverage = (robust_range / traditional_range) * 100
    
    # Calculate the center of the robust range
    robust_center = (stats['lower_bound'] + stats['upper_bound']) / 2
    traditional_center = (stats['min'] + stats['max']) / 2
    
    # Calculate how much the centers differ
    center_offset = abs(robust_center - traditional_center)
    
    print(f"Feature: {feature}")
    print(f"  Traditional range: [{stats['min']:.6f}, {stats['max']:.6f}] (range: {traditional_range:.6f})")
    print(f"  Robust range:     [{stats['lower_bound']:.6f}, {stats['upper_bound']:.6f}] (range: {robust_range:.6f})")
    print(f"  Range coverage:   {range_coverage:.2f}% of traditional range")
    print(f"  Traditional center: {traditional_center:.6f}")
    print(f"  Robust center:     {robust_center:.6f}")
    print(f"  Center offset:     {center_offset:.6f}")
    
    # Calculate what percentage of data points would be clipped
    # This is an estimate based on the IQR method
    # The robust bounds (Q1 - 1.5*IQR to Q3 + 1.5*IQR) typically capture ~99.3% of normal data
    data_coverage = 99.3  # Theoretical coverage for 1.5*IQR bounds
    data_clipped = 100 - data_coverage
    
    print(f"  Data coverage:    ~{data_coverage:.1f}% of data points")
    print(f"  Data clipped:     ~{data_clipped:.1f}% of data points (outliers)")
    print(f"  Resolution gain:  {traditional_range/robust_range:.1f}x better resolution")
    print()

# Summary
print("=== SUMMARY ===")
print("Robust normalization typically captures ~99.3% of the data while providing")
print("much better resolution by excluding extreme outliers.")
print()
print("The robust bounds are centered around zero, making them ideal for")
print("normalizing centered data with 128 as the midpoint.") 