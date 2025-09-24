document.addEventListener('DOMContentLoaded', () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const canvas = document.getElementById('visualizer');
    const canvasCtx = canvas.getContext('2d');

    const audio = document.getElementById('main-audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playIcon = '<i class="fas fa-play"></i>';
    const pauseIcon = '<i class="fas fa-pause"></i>';
    
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const trackTitleEl = document.getElementById('track-title');
    const trackListEl = document.getElementById('track-list');
const loopBtn = document.getElementById('loop-btn'); // Get the loop button
    let isContextStarted = false;
    let source;
        let isLooping = false; // State for looping
    // --- Playlist Management ---
    // Make sure these match your actual file names in the 'assets' folder
    const playlist = [
        { title: "Background Lofi", src: "assets/Background_Lofi.mp3" },
        { title: "Cafe Lofi", src: "assets/Cafe_Lofi.mp3" },
        { title: "Dragon Lofi", src: "assets/Dragon_Lofi.mp3" },
        { title: "Harp Lofi", src: "assets/Harp_Lofi.mp3" },
        { title: "Nordic Lofi", src: "assets/Nordic_Lofi.mp3" },
        { title: "Rain Lofi", src: "assets/Rain_Lofi.mp3" },
        // Add more tracks if you have them, e.g.:
        // { title: "Another Chill Track", src: "assets/another_track.mp3" },
    ];
    let currentTrackIndex = 0;

    function loadTrack(index) {
        if (index >= 0 && index < playlist.length) {
            currentTrackIndex = index;
            const track = playlist[currentTrackIndex];
            audio.src = track.src;
            trackTitleEl.textContent = `Now Playing: ${track.title}`;
            updateTrackListSelection();
            
            if (isContextStarted && !audio.paused) { // If audio was playing, play new track
                audio.load(); // Reload audio element with new source
                audio.play();
                playPauseBtn.innerHTML = pauseIcon;
            } else {
                playPauseBtn.innerHTML = playIcon; // Show play button if not auto-playing
            }
            // Reset progress bar immediately
            progressBar.value = 0;
            currentTimeEl.textContent = '0:00';
            totalDurationEl.textContent = '0:00';
        }
    }

    function playNextTrack() {
        let nextIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(nextIndex);
        audio.play(); // Auto-play next track
        playPauseBtn.innerHTML = pauseIcon;
    }

    function playPreviousTrack() {
        let prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(prevIndex);
        audio.play(); // Auto-play previous track
        playPauseBtn.innerHTML = pauseIcon;
    }

    function renderTrackList() {
        trackListEl.innerHTML = ''; // Clear existing list
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.textContent = track.title;
            li.dataset.index = index;
            li.addEventListener('click', () => {
                if (index !== currentTrackIndex) {
                    loadTrack(index);
                    togglePlayPause(); // Play the selected track
                } else if (audio.paused) {
                    togglePlayPause(); // If already selected but paused, play it
                }
            });
            trackListEl.appendChild(li);
        });
        updateTrackListSelection();
    }

function updateTrackListSelection() {
    Array.from(trackListEl.children).forEach((li, index) => {
        const isActive = index === currentTrackIndex;
        li.classList.toggle('active', isActive);

        // If this list item is the one now active, scroll it into view
        if (isActive) {
            li.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    });
}
    // --- Connect Audio to Visualizer ---
    function setupAudioNodes() {
        if (isContextStarted) return;
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        isContextStarted = true;
    }

    // --- Player Controls Logic ---
    function togglePlayPause() {
        if (!isContextStarted) {
            audioContext.resume();
            setupAudioNodes();
        }

        if (audio.paused) {
            audio.play();
            playPauseBtn.innerHTML = pauseIcon;
        } else {
            audio.pause();
            playPauseBtn.innerHTML = playIcon;
        }
    }
    // --- New Function to Toggle Loop ---
function toggleLoop() {
    isLooping = !isLooping;
    audio.loop = isLooping;
    loopBtn.classList.toggle('active', isLooping);
}
    // --- Update UI based on Audio state ---
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function updateProgress() {
        const { duration, currentTime } = audio;
        progressBar.value = currentTime;
        currentTimeEl.textContent = formatTime(currentTime);
    }
    
    function setDuration() {
        if (!isNaN(audio.duration)) {
            progressBar.max = audio.duration;
            totalDurationEl.textContent = formatTime(audio.duration);
        } else {
            progressBar.max = 0;
            totalDurationEl.textContent = '0:00';
        }
    }

    // --- Event Listeners ---
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', playPreviousTrack);
    nextBtn.addEventListener('click', playNextTrack);
    loopBtn.addEventListener('click', toggleLoop); // Add event listener for loop button
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setDuration);
// --- Updated 'ended' Event Logic ---
    audio.addEventListener('ended', () => {
        // This event will only fire if audio.loop is false.
        // If it's true, the browser handles the loop automatically.
        playNextTrack();
    });
    progressBar.addEventListener('input', () => {
        audio.currentTime = progressBar.value;
    });

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
    });

    // --- Visualizer Drawing Logic (Smoother Frequency Bars) ---
    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);
        
        analyser.fftSize = 256; // Smaller FFT size for smoother visual
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray); // Using frequency data

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#ff0054');
        gradient.addColorStop(1, '#00f5d4');

        canvasCtx.fillStyle = gradient;
        canvasCtx.shadowBlur = 10;
        canvasCtx.shadowColor = '#00f5d4';

        const barWidth = (canvas.width / bufferLength) * 2.5; // Wider bars
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2; // Adjust height for better visual
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 2; // Space between bars
        }
    }
    
    // Initial setup
    renderTrackList();
    loadTrack(currentTrackIndex); // Load the first track
    audio.volume = volumeSlider.value / 100; // Set initial volume
    drawVisualizer(); // Start visualizer
});