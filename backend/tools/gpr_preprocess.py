# gpr_preprocess.py
import os
import zipfile
import numpy as np
import matplotlib.pyplot as plt
from scipy.fft import rfft, rfftfreq
from scipy.io import loadmat
from pathlib import Path
import sys
import json
from scipy.signal import detrend, butter, filtfilt

ZIP_PATH = "../datasets/archive.zip"  

OUT_DIR = Path("gpr_outputs")
OUT_DIR.mkdir(exist_ok=True)

def try_load_file(fp):
    ext = fp.suffix.lower()
    if ext == ".npy":
        return np.load(fp)
    if ext == ".csv" or ext == ".txt":
        return np.loadtxt(fp, delimiter=",")
    if ext == ".mat":
        d = loadmat(fp)
        # heuristics: pick the largest 2D array
        arrays = [v for v in d.values() if isinstance(v, np.ndarray) and v.ndim == 2]
        if len(arrays) > 0:
            return max(arrays, key=lambda a: a.size)
        raise ValueError("No 2D array found in .mat")
    raise ValueError(f"Unsupported file type: {ext}")

def bandpass(data, fs=1.0, low=50, high=1000, order=4):
    ny = 0.5 * fs
    b, a = butter(order, [low/ny, high/ny], btype="band")
    return filtfilt(b, a, data, axis=-1)

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    z.extractall("tmp_gpr")

# search for candidate files
candidates = list(Path("tmp_gpr").rglob("*"))
loaded = None
for f in candidates:
    if f.suffix.lower() in (".npy", ".csv", ".mat", ".txt"):
        try:
            arr = try_load_file(f)
            if arr.ndim == 2 and arr.size > 100:
                loaded = (f, arr)
                break
        except Exception as e:
            print("skip", f, e)

if not loaded:
    print("No suitable 2D GPR file found in archive.")
    sys.exit(1)

fp, data = loaded
print("Loaded:", fp, "shape:", data.shape)

# ensure shape is (n_traces, n_samples). If shape[0] < shape[1] it's probably correct, but adjust if needed.
n0, n1 = data.shape
if n0 < 10 and n1 > 10:
    # transpose if traces are columns
    data = data.T
    print("Transposed ->", data.shape)

# basic preprocessing
data = detrend(data, axis=1)  # remove linear trend along depth axis per trace
# optional bandpass if you know sampling frequency (fs) and band (example commented)
# data = bandpass(data, fs=1000.0, low=50, high=400)

# Normalize for visualization
vmin, vmax = np.percentile(data, [1, 99])
vis = np.clip((data - vmin) / (vmax - vmin), 0, 1)

# Heatmap
plt.figure(figsize=(10,6))
plt.imshow(vis.T, aspect='auto', cmap='turbo', origin='lower')
plt.colorbar(label='Normalized amplitude')
plt.xlabel('Trace index')
plt.ylabel('Depth sample')
plt.title('GPR B-scan heatmap')
plt.savefig(OUT_DIR / "heatmap.png", dpi=150)
plt.close()

# Depth-intensity curve (mean absolute value per depth)
energy = np.mean(np.abs(data), axis=0)
plt.figure(figsize=(8,4))
plt.plot(energy, np.arange(len(energy)))
plt.gca().invert_yaxis()
plt.xlabel('Mean absolute amplitude')
plt.ylabel('Depth sample')
plt.title('Depth vs Intensity (mean abs)')
plt.savefig(OUT_DIR / "depth_curve.png", dpi=150)
plt.close()

# FFT of mean trace
mean_trace = np.mean(data, axis=0)
# if sampling interval unknown, we'll use arbitrary fs=1 and only plot relative freq
yf = np.abs(rfft(mean_trace))
xf = rfftfreq(mean_trace.size, d=1.0)
plt.figure(figsize=(8,4))
plt.semilogy(xf, yf + 1e-6)
plt.xlabel('Frequency (arb)')
plt.ylabel('Amplitude')
plt.title('Frequency content (mean trace)')
plt.savefig(OUT_DIR / "freq_plot.png", dpi=150)
plt.close()

# Save small preview json
meta = {
    "shape": data.shape,
    "vmin": float(vmin),
    "vmax": float(vmax),
}
with open(OUT_DIR / "meta.json", "w") as f:
    json.dump(meta, f, indent=2)

print("Outputs saved to", OUT_DIR.resolve())
