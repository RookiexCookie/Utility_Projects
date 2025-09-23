// --- Element Selection ---
const terminalInner = document.getElementById('terminalInner');
const fileInput = document.getElementById('fileInput');
const pixelRange = document.getElementById('pixelRange');
const downloadBtn = document.getElementById('downloadBtn');
const preview = document.getElementById('preview');
const previewCanvas = document.getElementById('previewCanvas');
const ctx = previewCanvas.getContext('2d');

let loadedImage = null;

// --- Core Functions ---

function pixelate() {
    if (!loadedImage) return;

    const pixelSize = parseInt(pixelRange.value);
    
    const w = loadedImage.width;
    const h = loadedImage.height;
    previewCanvas.width = w;
    previewCanvas.height = h;

    ctx.imageSmoothingEnabled = false;

    const smallW = w / pixelSize;
    const smallH = h / pixelSize;
    ctx.drawImage(loadedImage, 0, 0, smallW, smallH);

    ctx.drawImage(previewCanvas, 0, 0, smallW, smallH, 0, 0, w, h);
}

function loadImage(file) {
    if (!file.type.startsWith('image/')) {
        runCommand(`load ${file.name}`, ['Error: File is not a recognized image type.']);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            loadedImage = img;
            preview.classList.add('has-image');
            runCommand(`load ${file.name}`, [
                `Success: Image loaded.`,
                `Dimensions: ${img.width} x ${img.height} pixels.`
            ]);
            pixelate();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function downloadImage() {
    if (!loadedImage) {
        runCommand('download', ['Error: No image to download.']);
        return;
    }

    runCommand('download pixel-art.png', ['Saving image...']);

    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = previewCanvas.toDataURL('image/png');
    link.click();
    // Use a short timeout to ensure the download has initiated before clearing
    setTimeout(() => {
        // Clear the visual canvas
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        // Remove the class that indicates an image is present, showing the placeholder
        preview.classList.remove('has-image');
        // Reset the image data
        loadedImage = null;
        // Reset the file input to allow uploading the same file again if desired
        fileInput.value = '';
        // Log a final message
        runCommand('clear', ['Session cleared. Ready for a new image.']);
    }, 100);
}  

async function typeLines(lines, speed = 24) {
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }    
    for (const line of lines) {
        const lineEl = document.createElement('div');
        lineEl.className = 'line';
        terminalInner.appendChild(lineEl);
        
        for (let i = 0; i < line.length; i++) {
            lineEl.textContent += line[i];
            // THIS IS THE AUTO-SCROLL LOGIC
            terminalInner.scrollTop = terminalInner.scrollHeight;
            await wait(1000 / speed);
        }
        await wait(120);
    }
}

async function runCommand(cmd, outputLines = [], typingSpeed = 40) {
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    
    const cmdLine = document.createElement('div');
    cmdLine.className = 'line';
    cmdLine.textContent = '$ ';
    cmdLine.appendChild(cursor);
    terminalInner.appendChild(cmdLine);

    for (let i = 0; i < cmd.length; i++) {
        cmdLine.insertBefore(document.createTextNode(cmd[i]), cursor);
        // And it's also here to scroll as the command is typed
        terminalInner.scrollTop = terminalInner.scrollHeight;
        await new Promise(r => setTimeout(r, 1000 / typingSpeed));
    }
    
    cursor.remove();
    if (outputLines.length) {
        await typeLines(outputLines, Math.max(8, typingSpeed / 1.5));
    }
}

// --- Event Listeners ---

fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) loadImage(file);
});

downloadBtn.addEventListener('click', downloadImage);

pixelRange.addEventListener('input', () => {
    if(loadedImage) pixelate();
});

document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadImage(file);
});

// --- Initial Terminal Message ---
window.onload = () => {
    typeLines([
        'Pixel Terminal v1.0 Initialized.',
        'Ready to accept an image file.',
        'Please use the file chooser or drag & drop an image.'
    ]);
};
