    document.addEventListener('DOMContentLoaded', () => {
        // --- DOM ELEMENTS ---
        const grid = document.getElementById('sequencer-grid');
        const playBtn = document.getElementById('play-btn');
        const stopBtn = document.getElementById('stop-btn');
        const clearBtn = document.getElementById('clear-btn');
        const saveBtn = document.getElementById('save-btn');
        const loadBtn = document.getElementById('load-btn');
        const loadFileInput = document.getElementById('load-file-input');
        const exportBtn = document.getElementById('export-btn');
        const tempoSlider = document.getElementById('tempo');
        const tempoDisplay = document.getElementById('tempo-display');
        const bitcrusherSlider = document.getElementById('bitcrusher');
        const delaySlider = document.getElementById('delay');
        const playhead = document.getElementById('playhead');
        const instrumentsRack = document.getElementById('instruments-rack');

        // --- CONSTANTS ---
        const NUM_INSTRUMENTS = 10;
        const NUM_STEPS = 16;
        const INSTRUMENTS = [
            { name: 'Kick', note: 'C1' }, { name: 'Snare', note: 'G2' }, { name: 'Hi-Hat', note: 'C4' },
            { name: 'Bass 1', note: 'C2' }, { name: 'Bass 2', note: 'G1' }, { name: 'Lead 1', note: 'C4' },
            { name: 'Lead 2', note: 'E4' }, { name: 'Lead 3', note: 'G4' }, { name: 'Arp 1', note: 'C5' },
            { name: 'Noise', note: 'C6' }
        ];
        let gridState = Array(NUM_INSTRUMENTS).fill(null).map(() => Array(NUM_STEPS).fill(false));

        // --- AUDIO SETUP (Tone.js) ---
        const recorder = new Tone.Recorder();
        const bitcrusher = new Tone.BitCrusher(8).connect(recorder).toDestination();
        const delay = new Tone.FeedbackDelay(0, 0.5).connect(bitcrusher);
        const synths = [
            new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 4, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(delay),
            new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } }).connect(delay),
            new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(delay),
            new Tone.MonoSynth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 } }).connect(delay),
            new Tone.MonoSynth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 } }).connect(delay),
            new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 14, detune: 0, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.1 } }).connect(delay),
            new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 14, detune: 0, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.1 } }).connect(delay),
            new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 14, detune: 0, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.1 } }).connect(delay),
            new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } }).connect(delay),
            new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).connect(delay)
        ];

        // --- GRID & INSTRUMENT RACK INITIALIZATION ---
        function initialize() {
            for (let i = 0; i < NUM_INSTRUMENTS; i++) {
                for (let j = 0; j < NUM_STEPS; j++) {
                    const pad = document.createElement('div');
                    pad.classList.add('pad'); pad.dataset.row = i; pad.dataset.col = j;
                    grid.appendChild(pad);
                }
            }
            INSTRUMENTS.forEach((inst, index) => {
                const instDiv = document.createElement('div');
                instDiv.classList.add('instrument'); instDiv.dataset.row = index;
                instDiv.innerHTML = `<div class="instrument-light"></div><div class="instrument-name">${inst.name}</div>`;
                instrumentsRack.appendChild(instDiv);
            });
        }

        // --- SEQUENCER LOGIC ---
        const loop = new Tone.Sequence((time, col) => {
            Tone.Draw.schedule(() => {
                updatePlayhead(col);
                lightUpActiveColumn(col);
            }, time);
            for (let row = 0; row < NUM_INSTRUMENTS; row++) {
                if (gridState[row][col]) {
                    const synth = synths[row]; const note = INSTRUMENTS[row].note;
                    if (synth instanceof Tone.NoiseSynth || synth instanceof Tone.MembraneSynth || synth instanceof Tone.MetalSynth) {
                        synth.triggerAttackRelease("8n", time);
                    } else { synth.triggerAttackRelease(note, "8n", time); }
                }
            }
        }, Array.from(Array(NUM_STEPS).keys()), "16n").start(0);

        // --- UI UPDATE FUNCTIONS ---
        function updatePlayhead(col) {
            playhead.style.opacity = '1';
            const padWidth = grid.querySelector('.pad').offsetWidth + 5;
            playhead.style.transform = `translateX(${col * padWidth}px)`;
        }
        function lightUpActiveColumn(col) {
            document.querySelectorAll('.instrument').forEach((inst, rowIndex) => {
                inst.classList.toggle('playing', gridState[rowIndex][col]);
            });
        }
        function stopPlaybackUI() {
            playhead.style.opacity = '0';
            document.querySelectorAll('.instrument.playing').forEach(inst => inst.classList.remove('playing'));
            playBtn.classList.remove('active'); playBtn.innerHTML = '▶';
        }
        
        // --- PATTERN SAVE FUNCTION ---
        function savePattern() {
            const payload = { gridState: gridState, bpm: Tone.Transport.bpm.value };
            const dataStr = JSON.stringify(payload, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url; anchor.download = 'synthcraft-pattern.json';
            anchor.click();
            URL.revokeObjectURL(url);
            saveBtn.textContent = 'Saved!';
            setTimeout(() => { saveBtn.textContent = 'Save Pattern'; }, 1500);
        }

        // --- EXPORT WAV FUNCTION ---
        async function exportWAV() {
            exportBtn.disabled = true; exportBtn.textContent = 'Recording...';
            await recorder.start();
            Tone.Transport.stop(); Tone.Transport.start();
            const loopDuration = (60 / Tone.Transport.bpm.value) * 4;
            setTimeout(async () => {
                Tone.Transport.stop();
                const recording = await recorder.stop();
                const url = URL.createObjectURL(recording);
                const anchor = document.createElement('a');
                anchor.download = 'synthcraft-loop.wav'; anchor.href = url;
                anchor.click();
                URL.revokeObjectURL(url);
                exportBtn.disabled = false; exportBtn.textContent = 'Export WAV';
            }, loopDuration * 1000 + 50);
        }
        
        // --- EVENT LISTENERS ---
        grid.addEventListener('click', (e) => {
            if (e.target.classList.contains('pad')) {
                const row = e.target.dataset.row; const col = e.target.dataset.col;
                gridState[row][col] = !gridState[row][col];
                e.target.classList.toggle('active', gridState[row][col]);
            }
        });
        playBtn.addEventListener('click', async () => {
            if (Tone.context.state !== 'running') await Tone.start();
            if (Tone.Transport.state === 'started') {
                Tone.Transport.pause(); playBtn.classList.remove('active'); playBtn.innerHTML = '▶';
            } else {
                Tone.Transport.start(); playBtn.classList.add('active'); playBtn.innerHTML = '❚❚';
            }
        });
        stopBtn.addEventListener('click', () => { Tone.Transport.stop(); stopPlaybackUI(); });
        clearBtn.addEventListener('click', () => {
            gridState = Array(NUM_INSTRUMENTS).fill(null).map(() => Array(NUM_STEPS).fill(false));
            document.querySelectorAll('.pad.active').forEach(pad => pad.classList.remove('active'));
        });
        tempoSlider.addEventListener('input', (e) => {
            Tone.Transport.bpm.value = e.target.value;
            tempoDisplay.innerHTML = `${e.target.value} <span>BPM</span>`;
        });
        bitcrusherSlider.addEventListener('input', e => { bitcrusher.bits.value = e.target.value; });
        delaySlider.addEventListener('input', e => {
            delay.feedback.value = e.target.value;
            delay.wet.value = e.target.value > 0 ? 1 : 0;
        });

        saveBtn.addEventListener('click', savePattern);
        exportBtn.addEventListener('click', exportWAV);

        // New listeners for file-based loading
        loadBtn.addEventListener('click', () => { loadFileInput.click(); });
        loadFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.gridState && data.bpm) {
                        gridState = data.gridState;
                        Tone.Transport.bpm.value = data.bpm;
                        document.querySelectorAll('.pad').forEach(pad => {
                            pad.classList.toggle('active', gridState[pad.dataset.row][pad.dataset.col]);
                        });
                        tempoSlider.value = data.bpm;
                        tempoDisplay.innerHTML = `${data.bpm} <span>BPM</span>`;
                    } else { alert('Invalid pattern file.'); }
                } catch (error) { alert('Error reading pattern file.'); console.error(error); }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        // --- INITIALIZE ---
        initialize();
    });