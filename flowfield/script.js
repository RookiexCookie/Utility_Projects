document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // UI Elements
    const complexitySlider = document.getElementById('complexity');
    const speedSlider = document.getElementById('speed');
    const particlesSlider = document.getElementById('particles');
    const colorSlider = document.getElementById('color');
    const randomizeButton = document.getElementById('randomize');
    const resetButton = document.getElementById('reset');
    const saveButton = document.getElementById('save');

    // --- MOUSE INTERACTION SETUP ---
    const mouse = {
        x: null,
        y: null,
        radius: 150 // Area of effect for mouse interaction
    };

    window.addEventListener('mousemove', function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseleave', function() {
        mouse.x = null;
        mouse.y = null;
    });
    // --- END MOUSE INTERACTION ---

    let settings = {
        numParticles: 1500,
        particleSpeed: 1.5,
        noiseScale: 0.01,
        baseHue: 200
    };

    let particles = [];
    let time = 0;

    // The Perlin Noise algorithm remains the same as before...
    const p = new Uint8Array(512);
    const permutation = [ 151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180 ];
    for (let i=0; i < 256 ; i++) p[256+i] = p[i] = permutation[i];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t, a, b) => a + t * (b - a);
    const grad = (hash, x, y, z) => { let h = hash & 15; let u = h < 8 ? x : y; let v = h < 4 ? y : h == 12 || h == 14 ? x : z; return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v); }
    const noise = (x, y, z) => { let X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255; x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z); let u = fade(x), v = fade(y), w = fade(z); let A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z; let B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z; return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x-1, y, z)), lerp(u, grad(p[AB], x, y-1, z), grad(p[BB], x-1, y-1, z))), lerp(v, lerp(u, grad(p[AA+1], x, y, z-1), grad(p[BA+1], x-1, y, z-1)), lerp(u, grad(p[AB+1], x, y-1, z-1), grad(p[BB+1], x-1, y-1, z-1)))); }

    // --- ADVANCED PARTICLE CLASS ---
    class Particle {
        constructor() {
            this.reset();
            this.hue = Math.random() * 50 + settings.baseHue; // Add slight color variation
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.prevX = this.x;
            this.prevY = this.y;
            this.lifespan = Math.random() * 200 + 50;
            this.maxLifespan = this.lifespan;
        }

        update() {
            // 1. Get angle from Perlin noise field
            const angle = noise(this.x * settings.noiseScale, this.y * settings.noiseScale, time * 0.1) * Math.PI * 2;
            let vx = Math.cos(angle) * settings.particleSpeed;
            let vy = Math.sin(angle) * settings.particleSpeed;

            // 2. Check for mouse interaction
            if (mouse.x && mouse.y) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    // Add repulsion force to velocity
                    vx += (dx / distance) * force * 5;
                    vy += (dy / distance) * force * 5;
                }
            }
            
            // Store previous position for drawing trails
            this.prevX = this.x;
            this.prevY = this.y;

            // Update position with combined velocity
            this.x += vx;
            this.y += vy;

            // Update lifespan
            this.lifespan--;

            // Handle edges and lifespan
            if (this.x > canvas.width || this.x < 0 || this.y > canvas.height || this.y < 0 || this.lifespan <= 0) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.prevX, this.prevY);
            ctx.lineTo(this.x, this.y);
            // Color fades as particle nears end of life
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 70%, ${this.lifespan / this.maxLifespan})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < settings.numParticles; i++) {
            particles.push(new Particle());
        }
        clearCanvas();
    }
    
    function clearCanvas() {
        ctx.fillStyle = 'rgba(3, 4, 9, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function animate() {
        // Fading effect for trails
        ctx.fillStyle = 'rgba(3, 4, 9, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        time += 0.002;

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    // --- EVENT LISTENERS ---
    function updateSettings() {
        settings.noiseScale = parseFloat(complexitySlider.value);
        settings.particleSpeed = parseFloat(speedSlider.value);
        settings.baseHue = parseInt(colorSlider.value);

        const newParticleCount = parseInt(particlesSlider.value);
        if (newParticleCount !== settings.numParticles) {
            settings.numParticles = newParticleCount;
            init(); // Re-initialize if particle count changes
        } else {
             particles.forEach(p => p.hue = Math.random() * 50 + settings.baseHue);
        }
    }

    complexitySlider.addEventListener('input', updateSettings);
    speedSlider.addEventListener('input', updateSettings);
    particlesSlider.addEventListener('input', updateSettings);
    colorSlider.addEventListener('input', updateSettings);
    
    resetButton.addEventListener('click', () => {
        time = Math.random() * 1000;
        init();
    });

    randomizeButton.addEventListener('click', () => {
        complexitySlider.value = (Math.random() * (0.03 - 0.002) + 0.002).toFixed(3);
        speedSlider.value = (Math.random() * (5 - 0.1) + 0.1).toFixed(1);
        particlesSlider.value = Math.floor(Math.random() * (5000 - 100) + 100);
        colorSlider.value = Math.floor(Math.random() * 360);
        
        updateSettings();
        time = Math.random() * 1000;
        init();
    });

    saveButton.addEventListener('click', () => {
        // Temporarily draw a solid background for the saved image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = '#030409';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        const link = document.createElement('a');
        link.download = 'flowfield_masterpiece.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    // Initial setup
    updateSettings();
    init();
    animate();
});