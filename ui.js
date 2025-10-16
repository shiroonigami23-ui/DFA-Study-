/**
 * This file contains event listeners and logic for UI controls like buttons and modals.
 */

function setupEventHandlers() {
  // Panel and category selection
  document.getElementById('panel-toggle').addEventListener('click', () => {
    document.body.classList.toggle('panel-collapsed');
  });
  document.getElementById('dfaCategory').addEventListener('change', handleCategoryChange);

  // Construction controls
  document.getElementById('prevStepBtn').addEventListener('click', previousConstructionStep);
  document.getElementById('nextStepBtn').addEventListener('click', nextConstructionStep);
  document.getElementById('restartStepsBtn').addEventListener('click', () => {
    if (window.CURRENT_DFA) loadDFA(window.CURRENT_DFA);
  });
  document.getElementById('autoPlayToggle').addEventListener('change', toggleAutoPlay);

  // Testing controls
  document.getElementById('testBtn').addEventListener('click', testString);
  document.getElementById('resetBtn').addEventListener('click', resetVisualization);
  document.getElementById('testInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') testString();
  });

  // Quick actions
  document.getElementById('randomTestBtn').addEventListener('click', generateRandomTest);
  document.getElementById('stepModeBtn').addEventListener('click', () => setAnimationSpeed(1000));
  document.getElementById('fullSpeedBtn').addEventListener('click', () => setAnimationSpeed(400));
  document.getElementById('slowSpeedBtn').addEventListener('click', () => setAnimationSpeed(2000));
  
  // Advanced features & Modal
  document.getElementById('exportBtn').addEventListener('click', exportDFA);
  document.getElementById('saveBtn').addEventListener('click', () => showSaveLoadModal('save'));
  document.getElementById('loadBtn').addEventListener('click', () => showSaveLoadModal('load'));
  document.querySelector('.close').addEventListener('click', closeSaveLoadModal);
  document.getElementById('confirmSaveLoad').addEventListener('click', confirmSaveLoad);
  document.getElementById('cancelSaveLoad').addEventListener('click', closeSaveLoadModal);
  
  // Zoom Controls
  setupZoomControls();
}

function toggleAutoPlay() {
  window.AUTO_PLAY = document.getElementById('autoPlayToggle').checked;
  if (window.AUTO_PLAY && window.CONSTRUCTION_SEQUENCE && window.CURRENT_STEP < window.CONSTRUCTION_SEQUENCE.length - 1) {
    nextConstructionStep();
  } else {
    clearTimeout(window.STEP_TIMEOUT);
  }
}

function resetVisualization() {
  clearTimeout(window.STEP_TIMEOUT);
  window.ANIMATION_GENERATOR = null;
  if (window.CURRENT_DFA) {
    // Re-run construction instantly to show the full DFA
    renderConstructionFrame(window.CONSTRUCTION_SEQUENCE.length - 1);
    showOutput('Visualization reset', '');
    updateGuide(`📋 ${window.CURRENT_DFA.name}: ${window.CURRENT_DFA.description || ''}`);
  }
}

function generateRandomTest() {
  if (!window.CURRENT_DFA || !window.CURRENT_DFA.alphabet) {
    showOutput('Please select a DFA first!', 'error');
    return;
  }
  const length = Math.floor(Math.random() * 8) + 3;
  let randomString = Array.from({ length }, () => window.CURRENT_DFA.alphabet[Math.floor(Math.random() * window.CURRENT_DFA.alphabet.length)]).join('');
  document.getElementById('testInput').value = randomString;
  testString();
}

function setAnimationSpeed(speed) {
  window.ANIMATION_SPEED = speed;
  const speedName = speed <= 400 ? 'Fast' : speed >= 2000 ? 'Slow' : 'Normal';
  showOutput(`Animation speed set to: ${speedName}`, 'info');
}

function showSaveLoadModal(mode) {
  const modal = document.getElementById('saveLoadModal');
  document.getElementById('modalTitle').textContent = mode === 'save' ? 'Save DFA' : 'Load DFA';
  document.getElementById('confirmSaveLoad').textContent = mode === 'save' ? 'Save' : 'Load';
  document.getElementById('dfaName').parentElement.style.display = mode === 'save' ? 'block' : 'none';
  
  const dfaDataTextarea = document.getElementById('dfaData');
  if (mode === 'save' && window.CURRENT_DFA) {
    dfaDataTextarea.value = JSON.stringify(window.CURRENT_DFA, null, 2);
  } else {
    dfaDataTextarea.value = '';
  }
  modal.style.display = 'block';
}

function closeSaveLoadModal() {
  document.getElementById('saveLoadModal').style.display = 'none';
}

function confirmSaveLoad() {
  const mode = document.getElementById('modalTitle').textContent.includes('Save') ? 'save' : 'load';
  const name = document.getElementById('dfaName').value.trim();
  const data = document.getElementById('dfaData').value.trim();

  if (mode === 'save') {
    if (!name) { showOutput('Please enter a name for the DFA', 'error'); return; }
    if (!window.CURRENT_DFA) { showOutput('No DFA to save', 'error'); return; }
    const savedDfas = JSON.parse(localStorage.getItem('savedDFAs') || '{}');
    savedDfas[name] = window.CURRENT_DFA;
    localStorage.setItem('savedDFAs', JSON.stringify(savedDfas));
    showOutput(`DFA saved as "${name}"`, 'success');
  } else {
    if (!data) { showOutput('Please enter DFA data', 'error'); return; }
    try {
      const loadedDFA = JSON.parse(data);
      if (!loadedDFA.states || !Array.isArray(loadedDFA.states)) throw new Error('Invalid DFA');
      loadDFA(loadedDFA);
      showOutput('DFA loaded successfully', 'success');
    } catch (e) {
      showOutput('Invalid DFA data format.', 'error');
      return;
    }
  }
  closeSaveLoadModal();
}

function loadSavedDFAs() {
  console.log('Available saved DFAs:', Object.keys(JSON.parse(localStorage.getItem('savedDFAs') || '{}')));
}

function exportDFA() {
  if (!window.CURRENT_DFA) { showOutput('No DFA to export', 'error'); return; }
  const dataStr = JSON.stringify(window.CURRENT_DFA, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(window.CURRENT_DFA.name || 'custom-dfa').replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showOutput('DFA exported', 'success');
}

function setupZoomControls() {
    let zoomLevel = 1;
    const slider = document.getElementById("zoomSlider");
    const container = document.querySelector('.canvas-wrapper');
    const svg = document.getElementById('dfaSVG');

    const setZoom = (newZoom) => {
        zoomLevel = Math.max(0.2, Math.min(4, newZoom));
        svg.style.transform = `scale(${zoomLevel})`;
        svg.style.transformOrigin = 'top left';
        slider.value = Math.round(zoomLevel * 100);
    };

    document.getElementById("zoomInBtn").addEventListener("click", () => setZoom(zoomLevel * 1.2));
    document.getElementById("zoomOutBtn").addEventListener("click", () => setZoom(zoomLevel / 1.2));
    document.getElementById("resetZoomBtn").addEventListener("click", () => setZoom(1));
    slider.addEventListener("input", () => setZoom(slider.value / 100));
}
