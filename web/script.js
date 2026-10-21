// pywebview bridge for Python API
const backend = {
    async choose_file() {
        if (window.pywebview && window.pywebview.api) {
            return await window.pywebview.api.choose_file();
        }
        return null;
    },
    async get_output_formats(category) {
        if (window.pywebview && window.pywebview.api) {
            return await window.pywebview.api.get_output_formats(category);
        }
        return [];
    },
    async convert_file(inputPath, outputExt, preserveFormatting, saveSpecial) {
        if (window.pywebview && window.pywebview.api) {
            return await window.pywebview.api.convert_file(inputPath, outputExt, preserveFormatting, saveSpecial);
        }
        return { success: false, error: "Backend API not ready" };
    }
};

const eel = {
    choose_file: () => () => backend.choose_file(),
    get_output_formats: (cat) => () => backend.get_output_formats(cat),
    convert_file: (...args) => () => backend.convert_file(...args)
};

let selectedFilePath = "";
let selectedCategory = "";
let selectedOutputFormat = "";
let preserveFormatting = "no";
let saveSpecial = false;

// DOM Elements
const panels = {
    step1: document.getElementById('step-1'),
    step2: document.getElementById('step-2'),
    stepText: document.getElementById('step-text-format'),
    stepImage: document.getElementById('step-image-format'),
    step3: document.getElementById('step-3'),
    step4: document.getElementById('step-4'),
    step5: document.getElementById('step-5')
};

const formatOptionsContainer = document.getElementById('format-options');
const fileNameDisplay = document.getElementById('file-name-display');
const selectedFileInfo = document.getElementById('selected-file-info');
const btnNextToText = document.getElementById('btn-next-to-text');
const btnNextTo3 = document.getElementById('btn-next-to-3');

function showPanel(panelId) {
    Object.values(panels).forEach(p => p.classList.add('hidden'));
    panels[panelId].classList.remove('hidden');
}

// Step 1: Browse File
document.getElementById('btn-browse').addEventListener('click', async () => {
    const fileInfo = await eel.choose_file()();
    if (fileInfo && fileInfo.path) {
        selectedFilePath = fileInfo.path;
        selectedCategory = fileInfo.category;
        fileNameDisplay.textContent = fileInfo.filename;
        selectedFileInfo.classList.remove('hidden');
    }
});

document.getElementById('btn-next-to-2').addEventListener('click', async () => {
    if (!selectedFilePath) return;
    
    // Get formats based on category
    const formats = await eel.get_output_formats(selectedCategory)();
    
    // Populate grid
    formatOptionsContainer.innerHTML = '';
    selectedOutputFormat = "";
    btnNextToText.classList.add('hidden');
    btnNextTo3.classList.add('hidden');

    formats.forEach(ext => {
        const btn = document.createElement('button');
        btn.className = 'glass-btn format-btn';
        btn.textContent = ext.toUpperCase();
        btn.addEventListener('click', () => {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedOutputFormat = ext;
            
            if (selectedCategory === "text") {
                btnNextToText.classList.remove('hidden');
                btnNextTo3.classList.add('hidden');
            } else if (selectedCategory === "image" && ["png", "webp", "gif", "tiff"].includes(selectedOutputFormat)) {
                btnNextToText.classList.remove('hidden'); // We reuse this button to go to the secondary option panel
                btnNextTo3.classList.add('hidden');
            } else {
                btnNextTo3.classList.remove('hidden');
                btnNextToText.classList.add('hidden');
            }
        });
        formatOptionsContainer.appendChild(btn);
    });

    showPanel('step2');
});

// Step 2 buttons
document.getElementById('btn-back-to-1').addEventListener('click', () => showPanel('step1'));

document.getElementById('btn-next-to-text').addEventListener('click', () => {
    if (selectedOutputFormat) {
        if (selectedCategory === "text") showPanel('stepText');
        else if (selectedCategory === "image") showPanel('stepImage');
    }
});

document.getElementById('btn-next-to-3').addEventListener('click', () => {
    if (selectedOutputFormat) showPanel('step3');
});

// Step Text Formatting buttons
document.querySelectorAll('#step-text-format .format-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#step-text-format .format-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        preserveFormatting = e.target.dataset.preserve;
        showPanel('step3');
    });
});

document.getElementById('btn-back-to-2-text').addEventListener('click', () => showPanel('step2'));

// Step Image Background buttons
document.querySelectorAll('#step-image-format .format-btn-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#step-image-format .format-btn-img').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        preserveFormatting = e.target.dataset.preserve;
        showPanel('step3');
    });
});

document.getElementById('btn-back-to-2-image').addEventListener('click', () => showPanel('step2'));

// Step 3 buttons
document.getElementById('btn-back-to-prev').addEventListener('click', () => {
    if (selectedCategory === "text") showPanel('stepText');
    else if (selectedCategory === "image" && ["png", "webp", "gif", "tiff"].includes(selectedOutputFormat)) showPanel('stepImage');
    else showPanel('step2');
});

document.getElementById('btn-save-same').addEventListener('click', () => {
    saveSpecial = false;
    startConversion();
});

document.getElementById('btn-save-special').addEventListener('click', () => {
    saveSpecial = true;
    startConversion();
});

// Start Conversion
async function startConversion() {
    showPanel('step4');
    
    try {
        const result = await eel.convert_file(
            selectedFilePath, 
            selectedOutputFormat, 
            preserveFormatting, 
            saveSpecial
        )();
        
        if (result.success) {
            document.getElementById('final-path').textContent = result.path;
            showPanel('step5');
        } else {
            alert("Error converting file:\n" + result.error);
            showPanel('step1');
        }
    } catch (err) {
        alert("An unexpected error occurred.");
        showPanel('step1');
    }
}

// Step 5 buttons
document.getElementById('btn-start-over').addEventListener('click', () => {
    selectedFilePath = "";
    selectedCategory = "";
    selectedOutputFormat = "";
    selectedFileInfo.classList.add('hidden');
    showPanel('step1');
});
