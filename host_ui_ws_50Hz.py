from flask import Flask, render_template_string, jsonify, send_from_directory
import os
from pathlib import Path

# ——— CONFIG ———
ESP32_HOST = 'esp32.local'
ESP32_WS_PORT = 81      
script_dir = Path(__file__).parent
DATA_DIR = script_dir / 'data_dir'

app = Flask(__name__)

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ESP32 Haptic Control (WebSocket)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body { font-family: sans-serif; padding:1em; background:#f8f9fa; }
    h2 { margin-bottom: 1em; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .card {
      background: white;
      border: 1px solid #ccc;
      padding: 1em;
      border-radius: 8px;
      min-width: 300px;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
    }
    label, input, select, button { font-size:1em; margin:0.5em 0; }
    button { padding: 0.3em 1em; }
    button:disabled { opacity: 0.5; }
    .wave { width:100%; height:200px; margin-top:1em; }
    #status { margin-bottom:1em; font-size:0.9em; }
    #status.connected { color:green; }
    #status.disconnected { color:red; }
  </style>
</head>
<body>
  <h2>ESP32 Haptic Control (WebSocket)</h2>
  <div id="status" class="disconnected">WebSocket: Disconnected</div>
  <label>Manual Amplitude: <span id="val">0</span>/255</label><br>
  <input type="range" id="slider" min="0" max="255" value="0" disabled><br><br>
  <div class="grid" id="gridContainer"></div>

  <template id="cardTpl">
    <div class="card">
      <h3>Waveform</h3>
      <select class="exampleSelect"><option value="">-- Select example --</option></select><br>
      <input type="file" class="fileInput" accept=".wav,.npy,.csv"><br>
      <div>
        <label>Start (s): <input type="number" class="startTime" value="0" step="0.01"></label>
        <label>End (s): <input type="number" class="endTime" step="0.01"></label>
      </div><br>
      <div class="wave"></div>
      <button class="playBtn" disabled>▶️ Play</button>
      <button class="stopBtn" disabled>⏹ Stop</button>
    </div>
  </template>

  <script>
    const WS_URL = `ws://${"{{ESP32_HOST}}"}:{{ESP32_WS_PORT}}/`;
    const HAPTIC_RATE = 50; // Hz
    let socket;
    const cards = [];

    window.addEventListener('DOMContentLoaded', () => {
      setupWebSocket();
      setupUI();
    });

    function setupWebSocket() {
      socket = new WebSocket(WS_URL);
      const statusEl = document.getElementById('status');
      const slider = document.getElementById('slider');

      socket.onopen = () => {
        statusEl.textContent = 'WebSocket: Connected';
        statusEl.className = 'connected';
        slider.disabled = false;
      };
      socket.onclose = () => {
        statusEl.textContent = 'WebSocket: Disconnected';
        statusEl.className = 'disconnected';
        slider.disabled = true;
      };
      socket.onerror = e => console.error('WS error', e);

      slider.oninput = e => {
        const v = e.target.value;
        document.getElementById('val').innerText = v;
        if (socket.readyState === WebSocket.OPEN) socket.send(v);
      };
    }

    function setupUI() {
      const grid = document.getElementById('gridContainer');
      fetch('/list_files')
        .then(r => r.json())
        .then(files => {
          for (let i = 0; i < 4; i++) {
            const node = document.getElementById('cardTpl').content.cloneNode(true);
            grid.appendChild(node);
            const el = grid.querySelectorAll('.card')[i];
            setupCard(el, files, i+1);
          }
        });
    }

    function setupCard(el, files, idx) {
      const card = {
        el,
        selectEl: el.querySelector('.exampleSelect'),
        fileEl:   el.querySelector('.fileInput'),
        waveEl:   el.querySelector('.wave'),
        startIn:  el.querySelector('.startTime'),
        endIn:    el.querySelector('.endTime'),
        playBtn:  el.querySelector('.playBtn'),
        stopBtn:  el.querySelector('.stopBtn'),
        data: null,
        rate: HAPTIC_RATE,
        interval: null
      };
      el.querySelector('h3').innerText = `Waveform ${idx}`;
      cards.push(card);

      files.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f; opt.innerText = f;
        card.selectEl.appendChild(opt);
      });
      card.fileEl.onchange = e => readFile(card, e.target.files[0]);
      card.selectEl.onchange = e => readURL(card, '/files/' + encodeURIComponent(e.target.value));
      card.playBtn.onclick = () => play(card);
      card.stopBtn.onclick = () => stop(card);
    }

    function readFile(card, file) {
      const reader = new FileReader();
      reader.onload = () => parseBuffer(card, file.name, reader.result);
      reader.readAsArrayBuffer(file);
    }

    function readURL(card, url) {
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => parseBuffer(card, url, buf));
    }

    function parseBuffer(card, name, buffer) {
      const ext = name.split('.').pop().toLowerCase();
      let raw;
      if (ext === 'wav') {
        const wav = parseWav(buffer);
        raw = wav.channelData;
      } else if (ext === 'npy') {
        raw = parseNpy(new Uint8Array(buffer)).data;
      } else {
        const txt = new TextDecoder().decode(buffer);
        raw = new Float32Array(txt.trim().split('\\n').map(parseFloat));
      }
      card.data = raw;
      card.rate = HAPTIC_RATE;
      card.startIn.value = 0;
      card.endIn.value = (card.data.length / card.rate).toFixed(2);
      card.playBtn.disabled = false;
      drawWave(card);
    }

    function play(card) {
      const s = Math.max(0, parseFloat(card.startIn.value));
      let e = parseFloat(card.endIn.value);
      const maxT = card.data.length / card.rate;
      if (isNaN(e) || e > maxT) e = maxT;
      let idx = Math.floor(s * card.rate);
      const endIdx = Math.floor(e * card.rate);
      const period = 1000 / card.rate;
      card.playBtn.disabled = true;
      card.stopBtn.disabled = false;
      card.interval = setInterval(() => {
        if (idx >= endIdx) return stop(card);
        const sample = card.data[idx++];
        const dac = Math.round((sample + 1) / 2 * 255);
        if (socket.readyState === WebSocket.OPEN) socket.send(dac);
      }, period);
    }

    function stop(card) {
      clearInterval(card.interval);
      card.playBtn.disabled = false;
      card.stopBtn.disabled = true;
      if (socket.readyState === WebSocket.OPEN) socket.send(0);
    }

    function drawWave(card) {
      const N = card.data.length;
      const x = Array.from({length: N}, (_, i) => i / card.rate);
      Plotly.newPlot(card.waveEl, [{ x, y: Array.from(card.data), mode:'lines', line:{width:1} }], {
        margin:{t:30,r:10,l:50,b:40},
        xaxis:{title:'Time (s)'}, yaxis:{title:'Amplitude'}
      }, {responsive:true});
    }

    function parseWav(buf) {
      const view = new DataView(buf);
      if (view.getUint32(0, false) !== 0x52494646) throw 'Not WAV';
      const numCh = view.getUint16(22, true);
      const sampleRate = view.getUint32(24, true);
      let offset = 12, dataOff = 0, dataSz = 0;
      while (offset < view.byteLength) {
        const id = view.getUint32(offset, false);
        const sz = view.getUint32(offset+4, true);
        offset += 8;
        if (id === 0x64617461) { dataOff = offset; dataSz = sz; break; }
        offset += sz;
      }
      const count = dataSz / (2*numCh);
      const out = new Float32Array(count);
      let p = dataOff;
      for (let i=0;i<count;i++) {
        let sum=0;
        for (let c=0;c<numCh;c++) {
          sum += view.getInt16(p, true)/32768;
          p += 2;
        }
        out[i] = sum/numCh;
      }
      return { sampleRate, channelData: out };
    }

    function parseNpy(arr) {
      const view = new DataView(arr.buffer);
      const headerLen = view.getUint16(8, true) + 10;
      const count = (arr.length - headerLen)/4;
      const data = new Float32Array(count);
      for (let i=0;i<count;i++) {
        data[i] = view.getFloat32(headerLen + i*4, true);
      }
      return { data };
    }
  </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML, ESP32_HOST=ESP32_HOST, ESP32_WS_PORT=ESP32_WS_PORT)

@app.route('/list_files')
def list_files():
    files = sorted(
        f for f in os.listdir(DATA_DIR)
        if f.lower().endswith(('.wav', '.npy', '.csv'))
    )
    return jsonify(files)

@app.route('/files/<path:fn>')
def serve_file(fn):
    return send_from_directory(DATA_DIR, fn, as_attachment=False)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
