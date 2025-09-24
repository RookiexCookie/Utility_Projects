document.addEventListener('DOMContentLoaded', () => {
    // Keep a reference to the parent <pre> tag, which is stable
    const preBlock = document.getElementById('code-block').parentElement;
    let codeBlock = document.getElementById('code-block'); // This variable will be updated

    // All other DOM element selections
    const languageSelector = document.getElementById('languageSelector');
    const codeInput = document.getElementById('codeInput');
    const themeSelector = document.getElementById('themeSelector');
    const fontSelector = document.getElementById('fontSelector');
    const bgColorInput = document.getElementById('bgColor');
    const paddingRange = document.getElementById('paddingRange');
    const paddingValue = document.getElementById('paddingValue');
    const windowToggle = document.getElementById('windowToggle');
    const exportBtn = document.getElementById('exportBtn');
    const previewContainer = document.getElementById('preview-container');
    const previewBackground = document.getElementById('preview-background');
    const windowFrame = document.getElementById('window-frame');
    const hljsThemeLink = document.getElementById('hljs-theme');
    
    const initialCode = `fn main() {\n    let message = "Hello, Rust World!";\n    println!("{}", message);\n}`;

    // --- UPDATED AND EXPANDED THEMES OBJECT ---
    const themes = {
        // --- Dark Themes ---
        'a11y-dark': 'A11y Dark',
        'atom-one-dark': 'Atom One Dark',
        'github-dark': 'GitHub Dark',
        'monokai': 'Monokai',
        'nord': 'Nord',
        'night-owl': 'Night Owl',
        'solarized-dark': 'Solarized Dark',
        'tokyo-night-dark': 'Tokyo Night Dark',
        'vs2015': 'Visual Studio Dark',
        'base16/gruvbox-dark-hard': 'Gruvbox Dark',

        // --- Light Themes ---
        'a11y-light': 'A11y Light',
        'atom-one-light': 'Atom One Light',
        'github': 'GitHub Light',
        'solarized-light': 'Solarized Light',
        'stackoverflow-light': 'StackOverflow Light',
        'vs': 'Visual Studio Light',
        'base16/solarized-light': 'Base16 Solarized'
    };


    function initialize() {
        // Populate theme selector from the new object
        for (const [id, name] of Object.entries(themes)) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            themeSelector.appendChild(option);
        }
        languageSelector.value = 'rust';
        codeInput.value = initialCode;
        updateCode();
        updatePadding();
        updateBackgroundColor();
        updateFont();
        updateWindowFrame();
    }

    function updateCode() {
        const language = languageSelector.value;
        const codeText = codeInput.value;
        const newCodeBlock = document.createElement('code');
        newCodeBlock.id = 'code-block';
        newCodeBlock.className = `language-${language}`;
        newCodeBlock.textContent = codeText;
        newCodeBlock.style.fontFamily = fontSelector.value;
        newCodeBlock.style.padding = `${paddingRange.value}px`;
        hljs.highlightElement(newCodeBlock);
        preBlock.innerHTML = '';
        preBlock.appendChild(newCodeBlock);
        codeBlock = newCodeBlock;
    }
    
    function updateTheme() {
        const themeId = themeSelector.value;
        const themeUrl = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${themeId}.min.css`;
        hljsThemeLink.href = themeUrl;
    }
    
    function updateFont() {
        if (codeBlock) codeBlock.style.fontFamily = fontSelector.value;
    }

    function updateBackgroundColor() {
        previewBackground.style.backgroundColor = bgColorInput.value;
    }

    function updatePadding() {
        const padding = `${paddingRange.value}px`;
        if (codeBlock) codeBlock.style.padding = padding;
        paddingValue.textContent = paddingRange.value;
    }
    
    function updateWindowFrame() {
        if (windowToggle.checked) {
            windowFrame.style.display = 'flex';
        } else {
            windowFrame.style.display = 'none';
        }
    }
    
    // --- EVENT LISTENERS ---
    codeInput.addEventListener('input', updateCode);
    languageSelector.addEventListener('change', updateCode);
    themeSelector.addEventListener('change', updateTheme);
    fontSelector.addEventListener('change', updateFont);
    bgColorInput.addEventListener('input', updateBackgroundColor);
    paddingRange.addEventListener('input', updatePadding);
    windowToggle.addEventListener('change', updateWindowFrame);

    exportBtn.addEventListener('click', () => {
        html2canvas(previewContainer, {
            backgroundColor: null,
            allowTaint: true,
            useCORS: true,
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'carbonize-snippet.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    initialize();
});