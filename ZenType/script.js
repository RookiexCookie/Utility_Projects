// DOM Elements
const mainContainer = document.getElementById('main-container');
const typingTestWrapper = document.getElementById('typing-test');
const textDisplayContainer = document.getElementById('text-display-container');
const textDisplay = document.getElementById('text-display');
const caret = document.getElementById('caret');
const resultsScreen = document.getElementById('results-screen');
const liveStats = document.getElementById('live-stats');
const liveWpm = document.getElementById('live-wpm');
const resultsWpm = document.getElementById('results-wpm');
const resultsAccuracy = document.getElementById('results-accuracy');
const resultsTime = document.getElementById('results-time');
const configButtons = document.querySelectorAll('.config-button');
const resetButtonResults = document.getElementById('reset-btn-results');

// State
let currentIndex = 0;
let textToType = '';
let timer, liveUpdateTimer;
let timeElapsed = 0;
let errors = 0;
let correctChars = 0;
let totalCharsTyped = 0; // CALCULATION FIX: New variable
let isTestActive = false;
let testConfig = {
    punctuation: false,
    numbers: false,
    mode: 'words',
    amount: 10
};

// --- CORE FUNCTIONS ---

function generateWords() {
    let wordCount = testConfig.mode === 'time' ? 250 : testConfig.amount; // Generate more words for time mode
    let words = [];
    for (let i = 0; i < wordCount; i++) {
        words.push(commonWords[Math.floor(Math.random() * commonWords.length)]);
    }

    if (testConfig.punctuation) {
        words = words.map((word, i) => (Math.random() < 0.1 && i > 0 ? word + ',' : word));
        words[words.length - 1] += '.';
    }
    if (testConfig.numbers) {
        words = words.map(word => (Math.random() < 0.1 ? Math.floor(Math.random() * 100).toString() : word));
    }

    return words.join(' ');
}

function initializeTest() {
    mainContainer.classList.remove('focus-mode');
    typingTestWrapper.classList.remove('hidden');
    resultsScreen.classList.add('hidden');
    liveStats.classList.add('hidden');
    textDisplayContainer.scrollTop = 0; // Reset scroll position

    isTestActive = false;
    currentIndex = 0;
    timeElapsed = 0;
    errors = 0;
    correctChars = 0;
    totalCharsTyped = 0;
    clearInterval(timer);
    clearInterval(liveUpdateTimer);

    textToType = generateWords();
    renderText();
    updateCaretPosition();
    textDisplayContainer.focus();
}

function renderText() {
    textDisplay.innerHTML = '';
    const words = textToType.split(' ');
    words.forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        for (const char of word) {
            const span = document.createElement('span');
            span.textContent = char;
            wordDiv.appendChild(span);
        }
        const spaceSpan = document.createElement('span');
        spaceSpan.textContent = ' ';
        wordDiv.appendChild(spaceSpan);
        textDisplay.appendChild(wordDiv);
    });
}

// --- SCROLLING & CURSOR FIX ---

function updateCaretPosition() {
    const allChars = textDisplay.querySelectorAll('span');
    let currentSpan = allChars[currentIndex];
    
    if (!currentSpan) { // Handle end of test
        if (allChars.length > 0) {
            const lastSpan = allChars[allChars.length - 1];
            caret.style.left = `${lastSpan.offsetLeft + lastSpan.offsetWidth}px`;
            caret.style.top = `${lastSpan.offsetTop}px`;
        }
        return;
    }

    // Position caret
    caret.style.left = `${currentSpan.offsetLeft}px`;
    caret.style.top = `${currentSpan.offsetTop}px`;
    caret.style.height = `${currentSpan.offsetHeight}px`;
    
    // Update active word highlighting
    const allWords = textDisplay.querySelectorAll('.word');
    allWords.forEach(word => word.classList.remove('active'));
    currentSpan.parentElement.classList.add('active');

    // NATIVE SCROLLING LOGIC
    const container = textDisplayContainer;
    if (currentSpan.offsetTop > container.scrollTop + container.clientHeight - (currentSpan.offsetHeight * 2)) {
        container.scrollTop = currentSpan.offsetTop - container.clientHeight + (currentSpan.offsetHeight * 2);
    } else if (currentSpan.offsetTop < container.scrollTop) {
        container.scrollTop = currentSpan.offsetTop - currentSpan.offsetHeight;
    }
}

// --- STATS AND TIMING ---

function startTimer() {
    if (isTestActive) return;
    
    isTestActive = true;
    const startTime = Date.now();
    
    liveStats.classList.remove('hidden');

    if (testConfig.mode === 'time') {
        setTimeout(showResults, testConfig.amount * 1000);
    }
    
    liveUpdateTimer = setInterval(() => {
        timeElapsed = (Date.now() - startTime) / 1000;
        updateLiveStats();
    }, 250);
}

// --- CALCULATION FIX ---
function updateLiveStats() {
    if (!isTestActive) return;
    const minutes = timeElapsed / 60;
    // Raw WPM: (All typed characters / 5) / time
    const wpm = minutes > 0 ? Math.round((totalCharsTyped / 5) / minutes) : 0;
    liveWpm.textContent = wpm;
}

function showResults() {
    clearInterval(liveUpdateTimer);
    if (!isTestActive) return; // Prevent multiple triggers
    isTestActive = false;
    
    const finalTime = timeElapsed;
    const minutes = finalTime / 60;
    // Final WPM and Accuracy
    const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;
    const accuracy = totalCharsTyped > 0 ? Math.round((correctChars / totalCharsTyped) * 100) : 100;

    resultsWpm.textContent = wpm;
    resultsAccuracy.textContent = `${accuracy}%`;
    resultsTime.textContent = `${Math.round(finalTime)}s`;

    typingTestWrapper.classList.add('hidden');
    liveStats.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
}

// --- EVENT HANDLERS ---

function handleKeyPress(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    
    const allChars = textDisplay.querySelectorAll('span');
    if (currentIndex >= textToType.length) return;

    if (!isTestActive && e.key.length === 1) startTimer();

    const expectedChar = textToType[currentIndex];

    // --- START: Replace this entire block ---
    if (e.key === 'Backspace') {
        if (currentIndex > 0) {
            currentIndex--;
            const prevChar = allChars[currentIndex];
            // Don't decrement totalCharsTyped on backspace for a truer WPM
            if (prevChar.classList.contains('correct')) correctChars--;
            else if (prevChar.classList.contains('incorrect')) errors--;
            prevChar.className = '';
        }
    } else if (e.key.length === 1) {
        totalCharsTyped++; // Increment on every valid character press

        // NEW LOGIC: Special handling if a space is expected
        if (expectedChar === ' ') {
            if (e.key === ' ') { // Correctly pressed space
                allChars[currentIndex].className = 'correct';
                correctChars++;
                currentIndex++;
            } else { // Incorrectly pressed another key instead of space
                allChars[currentIndex].classList.add('incorrect', 'space');
                errors++;
                // DO NOT increment currentIndex, trapping the user here
            }
        } else { // Original logic for all other characters
            if (e.key === expectedChar) {
                allChars[currentIndex].className = 'correct';
                correctChars++;
            } else {
                allChars[currentIndex].className = 'incorrect';
                errors++;
            }
            currentIndex++;
        }
    }
    // --- END: Replacement block ---

    updateCaretPosition();
    
    if (testConfig.mode === 'words' && currentIndex >= textToType.length) {
        showResults();
    }
}

function handleConfigChange(e) {
    const { configType, configValue, amount } = e.target.dataset;
    
    if (configType === 'mode') {
        document.querySelectorAll('[data-config-type="mode"]').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        testConfig.mode = configValue;
        testConfig.amount = parseInt(amount, 10);
    } else {
        e.target.classList.toggle('active');
        testConfig[configType] = !testConfig[configType];
    }
    
    initializeTest();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        initializeTest();
    }
});
textDisplayContainer.addEventListener('keydown', handleKeyPress);
configButtons.forEach(button => button.addEventListener('click', handleConfigChange));
resetButtonResults.addEventListener('click', initializeTest);
textDisplayContainer.addEventListener('click', () => textDisplayContainer.focus());

initializeTest();