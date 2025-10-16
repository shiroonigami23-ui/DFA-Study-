// Global variables
let CURRENT_DFA = null;
let STATE_POSITIONS = {};
let ANIMATION_GENERATOR = null;
let CONSTRUCTION_STEPS = null;
let CURRENT_STEP = -1;
let AUTO_PLAY = true;
let STEP_TIMEOUT = null;
let ANIMATION_SPEED = 1000;
let SELECTED_STATE = null;

// DOM elements
const dfaCategory = document.getElementById('dfaCategory');
const variationsContainer = document.getElementById('variationsContainer');
const variationsGrid = document.getElementById('variationsGrid');
const guideContent = document.getElementById('guideContent');
const outputDisplay = document.getElementById('outputDisplay');
const testInput = document.getElementById('testInput');
const dfaSVG = document.getElementById('dfaSVG');

// Initialize the application
function initializeApp() {
  populateCategories();
  setupEventHandlers();
  clearVisualization();
  showWelcomeMessage();
  loadSavedDFAs();
}

// Populate category dropdown
function populateCategories() {
  dfaCategory.innerHTML = '<option value="">Choose a category...</option>';
  Object.keys(DFA_LIBRARY).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = DFA_LIBRARY[key].name;
    dfaCategory.appendChild(option);
  });
}

// Setup event handlers
function setupEventHandlers() {
  dfaCategory.addEventListener('change', handleCategoryChange);
  
  // Construction controls
  document.getElementById('prevStepBtn').addEventListener('click', previousStep);
  document.getElementById('nextStepBtn').addEventListener('click', nextStep);
  document.getElementById('restartStepsBtn').addEventListener('click', restartSteps);
  document.getElementById('autoPlayToggle').addEventListener('change', toggleAutoPlay);
  
  // Testing controls
  document.getElementById('testBtn').addEventListener('click', testString);
  document.getElementById('resetBtn').addEventListener('click', resetVisualization);
  
  // Quick actions
  document.getElementById('randomTestBtn').addEventListener('click', generateRandomTest);
  document.getElementById('stepModeBtn').addEventListener('click', () => setAnimationSpeed(2000));
  document.getElementById('fullSpeedBtn').addEventListener('click', () => setAnimationSpeed(500));
  document.getElementById('slowSpeedBtn').addEventListener('click', () => setAnimationSpeed(3000));
  
  // Advanced features
  document.getElementById('exportBtn').addEventListener('click', exportDFA);
  document.getElementById('saveBtn').addEventListener('click', () => showSaveLoadModal('save'));
  document.getElementById('loadBtn').addEventListener('click', () => showSaveLoadModal('load'));
  
  // Modal controls
  document.querySelector('.close').addEventListener('click', closeSaveLoadModal);
  document.getElementById('confirmSaveLoad').addEventListener('click', confirmSaveLoad);
  document.getElementById('cancelSaveLoad').addEventListener('click', closeSaveLoadModal);
  
  // Keyboard shortcuts
  testInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') testString();
  });
}

// Handle category selection
function handleCategoryChange() {
  const category = dfaCategory.value;
  if (category) {
    showVariations(category);
  } else {
    hideVariations();
    clearVisualization();
    showWelcomeMessage();
  }
}

// Show variations for selected category
function showVariations(categoryKey) {
  const category = DFA_LIBRARY[categoryKey];
  variationsGrid.innerHTML = '';
  
  category.dfas.forEach((dfa) => {
    const card = document.createElement('div');
    card.className = 'variation-card';
    card.innerHTML = `
      <div class="variation-title">${dfa.name}</div>
      <div class="variation-desc">${dfa.description}</div>
    `;
    
    card.addEventListener('click', () => {
      document.querySelectorAll('.variation-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      loadDFA(dfa);
    });
    
    variationsGrid.appendChild(card);
  });
  
  variationsContainer.style.display = 'block';
}

// Hide variations panel
function hideVariations() {
  variationsContainer.style.display = 'none';
}

// Load and display DFA
function loadDFA(dfa) {
  CURRENT_DFA = JSON.parse(JSON.stringify(dfa)); // Deep copy
  CONSTRUCTION_STEPS = dfa.steps;
  CURRENT_STEP = -1;
  
  updateGuide(`📋 ${dfa.name}: ${dfa.description}`);
  visualizeDFA(dfa);
  enableControls();
  
  if (AUTO_PLAY && CONSTRUCTION_STEPS) {
    startConstructionAnimation();
  }
}

// Visualize DFA in SVG
function visualizeDFA(dfa, highlight = {}) {
  const svg = dfaSVG;
  
  const defs = svg.querySelector('defs');
  svg.innerHTML = '';
  if (defs) {
    svg.appendChild(defs);
  }
  
  if (dfa && dfa.states) { 
      try { resizeViewBox(dfa.states); } catch(e) { /* ignore */ } 
  }
  
  if (!dfa || !dfa.states || dfa.states.length === 0) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'state-label');
    text.style.fontSize = '18px';
    text.style.fill = '#a0aec0';
    text.textContent = 'No DFA to display';
    svg.appendChild(text);
    return;
  }
  
  STATE_POSITIONS = {};
  dfa.states.forEach(state => {
    STATE_POSITIONS[state.id] = { x: state.x, y: state.y };
  });
  
  if (dfa.transitions) {
    const transitionGroups = groupTransitions(dfa.transitions);
    Object.values(transitionGroups).forEach(group => {
        drawTransition(group, highlight.transition && group.from === highlight.transition.from && group.to === highlight.transition.to);
    });
  }
  
  dfa.states.forEach(state => {
    drawState(state, highlight.state === state.id);
  });
}

// Group transitions between the same two states
function groupTransitions(transitions) {
    const groups = {};
    transitions.forEach(t => {
        const key = `${t.from}->${t.to}`;
        if (!groups[key]) {
            groups[key] = { from: t.from, to: t.to, symbols: [] };
        }
        groups[key].symbols.push(t.symbol);
    });
    return groups;
}

// Draw a state
function drawState(state, isHighlighted) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', state.x);
  circle.setAttribute('cy', state.y);
  circle.setAttribute('r', 25);
  circle.setAttribute('class', 'state-circle' + (state.accepting ? ' final' : '') + (isHighlighted ? ' active' : ''));
  circle.setAttribute('data-state-id', state.id);
  g.appendChild(circle);
  
  if (state.accepting) {
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', state.x);
    innerCircle.setAttribute('cy', state.y);
    innerCircle.setAttribute('r', 20);
    innerCircle.setAttribute('fill', 'none');
    innerCircle.setAttribute('stroke', '#48bb78');
    innerCircle.setAttribute('stroke-width', '2');
    g.appendChild(innerCircle);
  }
  
  if (state.initial) {
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', `M${state.x - 60},${state.y} L${state.x - 30},${state.y}`);
    arrow.setAttribute('class', 'initial-arrow');
    arrow.setAttribute('marker-end', 'url(#arrowhead)');
    dfaSVG.prepend(arrow);
  }
  
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', state.x);
  label.setAttribute('y', state.y);
  label.setAttribute('class', 'state-label');
  label.textContent = state.id;
  g.appendChild(label);
  
  dfaSVG.appendChild(g);
}

// Draw a transition (now handles grouped symbols)
function drawTransition(transitionGroup, isHighlighted) {
  const fromPos = STATE_POSITIONS[transitionGroup.from];
  const toPos = STATE_POSITIONS[transitionGroup.to];
  const symbol = transitionGroup.symbols.join(',');

  if (!fromPos || !toPos) return;

  if (transitionGroup.from === transitionGroup.to) {
    drawSelfLoop(fromPos, symbol, isHighlighted);
  } else {
    // Check for bi-directional transitions
    const reverseKey = `${transitionGroup.to}->${transitionGroup.from}`;
    const reverseGroupExists = document.querySelector(`[data-transition-key="${reverseKey}"]`);

    drawArrow(fromPos, toPos, symbol, isHighlighted, !!reverseGroupExists);
  }
}

// Draw arrow between states
function drawArrow(from, to, symbol, isHighlighted, isBidirectional) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-transition-key', `${from.id}->${to.id}`);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / distance;
    const unitY = dy / distance;

    const startX = from.x + unitX * 25;
    const startY = from.y + unitY * 25;
    const endX = to.x - unitX * 25;
    const endY = to.y - unitY * 25;

    let pathD;
    let labelX, labelY;
    const curve = isBidirectional ? 25 : 0;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const controlX = midX - curve * unitY;
    const controlY = midY + curve * unitX;

    pathD = `M${startX},${startY} Q${controlX},${controlY} ${endX},${endY}`;
    labelX = controlX;
    labelY = controlY + (curve === 0 ? -8 : (to.y < from.y || (to.y === from.y && to.x < from.x) ? -8 : 18));
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('class', 'transition-path' + (isHighlighted ? ' active' : ''));
    path.setAttribute('marker-end', isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)');
    g.appendChild(path);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', labelX);
    label.setAttribute('y', labelY);
    label.setAttribute('class', 'transition-label');
    label.textContent = symbol;
    g.appendChild(label);
    dfaSVG.prepend(g);
}


// Draw self-loop
function drawSelfLoop(pos, symbol, isHighlighted) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 
    `M${pos.x - 15} ${pos.y - 20} 
     C${pos.x - 45} ${pos.y - 50}, ${pos.x + 45} ${pos.y - 50}, ${pos.x + 15} ${pos.y - 20}`);
  path.setAttribute('class', 'transition-path' + (isHighlighted ? ' active' : ''));
  path.setAttribute('marker-end', isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)');
  g.appendChild(path);
  
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', pos.x);
  label.setAttribute('y', pos.y - 55);
  label.setAttribute('class', 'transition-label');
  label.textContent = symbol;
  g.appendChild(label);
  dfaSVG.prepend(g);
}


// ... (The rest of your functions: animateString, testString, nextAnimationStep, etc.) ...
// Make sure to copy all the remaining functions from your original file here.

// Animation functions
function* animateString(dfa, input) {
  if (!dfa.states || dfa.states.length === 0) {
    yield { error: 'No states in DFA' };
    return;
  }
  
  const initialState = dfa.states.find(s => s.initial);
  if (!initialState) {
    yield { error: 'No initial state defined' };
    return;
  }
  
  let currentState = initialState.id;
  
  yield { state: currentState, step: `Starting at state ${currentState}` };
  
  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    const transition = dfa.transitions?.find(t => 
      t.from === currentState && t.symbol === symbol
    );
    
    if (!transition) {
      yield { 
        error: `No transition from ${currentState} on '${symbol}'`,
        state: currentState
      };
      return;
    }
    
    yield { 
      transition: transition,
      step: `Reading '${symbol}': ${transition.from} → ${transition.to}`
    };
    
    currentState = transition.to;
    yield { 
      state: currentState,
      step: `Now in state ${currentState}`
    };
  }
  
  const finalState = dfa.states.find(s => s.id === currentState);
  const accepted = finalState && finalState.accepting;
  
  yield {
    state: currentState,
    result: accepted ? 'accepted' : 'rejected',
    step: accepted ? 
      `✅ String accepted! (${currentState} is accepting)` :
      `❌ String rejected! (${currentState} is not accepting)`
  };
}

// Test string function
function testString() {
  if (!CURRENT_DFA) {
    showOutput('Please select a DFA first!', 'error');
    return;
  }
  
  const input = testInput.value.trim();
  
  if (CURRENT_DFA.alphabet) {
    for (const char of input) {
      if (!CURRENT_DFA.alphabet.includes(char)) {
        showOutput(`Invalid character '${char}'. Use only: ${CURRENT_DFA.alphabet.join(', ')}`, 'error');
        return;
      }
    }
  }
  
  ANIMATION_GENERATOR = animateString(CURRENT_DFA, input);
  showOutput(`🎬 Testing string: "${input}"`, 'info');
  nextAnimationStep();
}

// Animation step
function nextAnimationStep() {
  if (STEP_TIMEOUT) clearTimeout(STEP_TIMEOUT);
  if (!ANIMATION_GENERATOR) return;
  
  const { value, done } = ANIMATION_GENERATOR.next();
  if (done || !value) {
      ANIMATION_GENERATOR = null;
      return;
  };
  
  if (value.error) {
    showOutput(value.error, 'error');
    visualizeDFA(CURRENT_DFA, { state: value.state });
    ANIMATION_GENERATOR = null;
    return;
  }
  
  if (value.result) {
    showOutput(value.step, value.result === 'accepted' ? 'success' : 'error');
    outputDisplay.classList.add('animate-result');
    setTimeout(() => outputDisplay.classList.remove('animate-result'), 500);
    visualizeDFA(CURRENT_DFA, { state: value.state });
    ANIMATION_GENERATOR = null;
    return;
  }
  
  const highlight = {};
  if (value.state) highlight.state = value.state;
  if (value.transition) highlight.transition = value.transition;
  
  visualizeDFA(CURRENT_DFA, highlight);
  updateGuide(value.step || '');
  
  STEP_TIMEOUT = setTimeout(nextAnimationStep, ANIMATION_SPEED);
}

// Construction animation functions
function startConstructionAnimation() {
  CURRENT_STEP = 0;
  showConstructionStep();
}

function showConstructionStep() {
  if (!CONSTRUCTION_STEPS || CURRENT_STEP < 0 || CURRENT_STEP >= CONSTRUCTION_STEPS.length) {
    updateGuide('✅ Construction complete! Ready to test strings.');
    visualizeDFA(CURRENT_DFA);
    return;
  }
  
  const step = CONSTRUCTION_STEPS[CURRENT_STEP];
  updateGuide(`🔧 Step ${CURRENT_STEP + 1}/${CONSTRUCTION_STEPS.length}: ${step}`);
  
  if (AUTO_PLAY && CURRENT_STEP < CONSTRUCTION_STEPS.length - 1) {
    STEP_TIMEOUT = setTimeout(() => {
      CURRENT_STEP++;
      showConstructionStep();
    }, 2000);
  }
}

// Control functions
function previousStep() {
  if (CURRENT_STEP > 0) {
    CURRENT_STEP--;
    clearTimeout(STEP_TIMEOUT);
    showConstructionStep();
  }
}

function nextStep() {
  if (CONSTRUCTION_STEPS && CURRENT_STEP < CONSTRUCTION_STEPS.length - 1) {
    CURRENT_STEP++;
    clearTimeout(STEP_TIMEOUT);
    showConstructionStep();
  }
}

function restartSteps() {
  CURRENT_STEP = -1;
  clearTimeout(STEP_TIMEOUT);
  if (AUTO_PLAY) {
    startConstructionAnimation();
  } else {
    updateGuide('📋 Ready to start construction. Click Next Step to begin.');
  }
}

function toggleAutoPlay() {
  AUTO_PLAY = document.getElementById('autoPlayToggle').checked;
  if (AUTO_PLAY && CURRENT_STEP >= 0 && CONSTRUCTION_STEPS && CURRENT_STEP < CONSTRUCTION_STEPS.length - 1) {
    STEP_TIMEOUT = setTimeout(() => {
      CURRENT_STEP++;
      showConstructionStep();
    }, 2000);
  } else {
    clearTimeout(STEP_TIMEOUT);
  }
}

function showSaveLoadModal(mode) {
  const modal = document.getElementById('saveLoadModal');
  const title = document.getElementById('modalTitle');
  const confirmBtn = document.getElementById('confirmSaveLoad');
  const dfaNameInput = document.getElementById('dfaName');
  const dfaDataTextarea = document.getElementById('dfaData');
  
  if (mode === 'save') {
    title.textContent = 'Save DFA';
    confirmBtn.textContent = 'Save';
    dfaNameInput.style.display = 'block';
    dfaNameInput.previousElementSibling.style.display = 'block';
    if (CURRENT_DFA) {
      dfaDataTextarea.value = JSON.stringify(CURRENT_DFA, null, 2);
    }
  } else {
    title.textContent = 'Load DFA';
    confirmBtn.textContent = 'Load';
    dfaNameInput.style.display = 'none';
    dfaNameInput.previousElementSibling.style.display = 'none';
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
    if (!name) {
      alert('Please enter a name for the DFA');
      return;
    }
    
    if (!CURRENT_DFA) {
      alert('No DFA to save');
      return;
    }
    
    const savedDfas = JSON.parse(localStorage.getItem('savedDFAs') || '{}');
    savedDfas[name] = CURRENT_DFA;
    localStorage.setItem('savedDFAs', JSON.stringify(savedDfas));
    
    showOutput(`DFA saved as "${name}"`, 'success');
  } else {
    if (!data) {
      alert('Please enter DFA data');
      return;
    }
    
    try {
      const loadedDFA = JSON.parse(data);
      if (!loadedDFA.states || !Array.isArray(loadedDFA.states)) {
        throw new Error('Invalid DFA format');
      }
      loadDFA(loadedDFA);
      showOutput('DFA loaded successfully', 'success');
    } catch (error) {
      alert('Invalid DFA data format. Please check the JSON.');
      return;
    }
  }
  
  closeSaveLoadModal();
}

function loadSavedDFAs() {
  const savedDfas = JSON.parse(localStorage.getItem('savedDFAs') || '{}');
  // You could extend this to populate a "Saved" category in the dropdown
  console.log('Available saved DFAs:', Object.keys(savedDfas));
}

function exportDFA() {
  if (!CURRENT_DFA) {
    alert('No DFA to export');
    return;
  }
  
  const dataStr = JSON.stringify(CURRENT_DFA, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(CURRENT_DFA.name || 'custom-dfa').replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showOutput('DFA exported successfully', 'success');
}


// Utility functions
function enableControls() {
  document.getElementById('prevStepBtn').disabled = false;
  document.getElementById('nextStepBtn').disabled = false;
  document.getElementById('restartStepsBtn').disabled = false;
}

function updateGuide(text) {
  guideContent.innerHTML = text;
}

function showOutput(text, type = '') {
  outputDisplay.textContent = text;
  outputDisplay.className = 'output-display' + (type ? ` ${type}` : '');
}

function clearVisualization() {
  const svg = dfaSVG;
  const defs = svg.querySelector('defs');
  svg.innerHTML = '';
  if(defs) svg.appendChild(defs);
  
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '50%');
  text.setAttribute('y', '50%');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('class', 'state-label');
  text.style.fontSize = '18px';
  text.style.fill = '#a0aec0';
  text.textContent = 'Select a DFA to visualize';
  svg.appendChild(text);
  svg.removeAttribute('viewBox');
}

function showWelcomeMessage() {
  updateGuide('🎯 Welcome to the Advanced DFA Learning Studio! Select a category to explore different types of automata.');
  showOutput('Ready to explore the world of finite automata!', '');
}

function resetVisualization() {
  if (CURRENT_DFA) {
    ANIMATION_GENERATOR = null;
    clearTimeout(STEP_TIMEOUT);
    visualizeDFA(CURRENT_DFA);
    showOutput('Visualization reset', '');
    updateGuide(`📋 ${CURRENT_DFA.name}: ${CURRENT_DFA.description || ''}`);
  }
}

function generateRandomTest() {
  if (!CURRENT_DFA || !CURRENT_DFA.alphabet) {
    showOutput('Please select a DFA first!', 'error');
    return;
  }
  
  const length = Math.floor(Math.random() * 8) + 3;
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomChar = CURRENT_DFA.alphabet[Math.floor(Math.random() * CURRENT_DFA.alphabet.length)];
    randomString += randomChar;
  }
  
  testInput.value = randomString;
  testString();
}

function setAnimationSpeed(speed) {
  ANIMATION_SPEED = speed;
  const speedName = speed <= 500 ? 'Fast' : speed >= 2000 ? 'Step Mode' : 'Normal';
  showOutput(`Animation speed set to: ${speedName}`, 'info');
}

// === Zoom and Pan Controls ===
let zoomLevel = 1;
const ZOOM_STEP = 1.2;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetZoomBtn = document.getElementById("resetZoomBtn");
const zoomSlider = document.getElementById("zoomSlider");
const svgContainer = document.querySelector('.canvas-wrapper');

function setZoom(newZoom, centerX, centerY) {
    const prevZoom = zoomLevel;
    zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

    const scaleChange = zoomLevel / prevZoom;

    const newScrollLeft = Math.round((svgContainer.scrollLeft + centerX) * scaleChange - centerX);
    const newScrollTop = Math.round((svgContainer.scrollTop + centerY) * scaleChange - centerY);
    
    dfaSVG.style.width = `${100 * zoomLevel}%`;
    dfaSVG.style.height = `${100 * zoomLevel}%`;

    svgContainer.scrollLeft = newScrollLeft;
    svgContainer.scrollTop = newScrollTop;

    zoomSlider.value = Math.round(zoomLevel * 100);
}

zoomInBtn.addEventListener("click", () => {
    const rect = svgContainer.getBoundingClientRect();
    setZoom(zoomLevel * ZOOM_STEP, rect.width / 2, rect.height / 2);
});
zoomOutBtn.addEventListener("click", () => {
    const rect = svgContainer.getBoundingClientRect();
    setZoom(zoomLevel / ZOOM_STEP, rect.width / 2, rect.height / 2);
});
resetZoomBtn.addEventListener("click", () => {
    dfaSVG.style.width = '100%';
    dfaSVG.style.height = '100%';
    zoomLevel = 1;
    zoomSlider.value = 100;
});
zoomSlider.addEventListener("input", () => {
    const newZoom = zoomSlider.value / 100;
    const rect = svgContainer.getBoundingClientRect();
    setZoom(newZoom, rect.width / 2, rect.height / 2);
});

// Auto-resize viewBox
function resizeViewBox(states) {
  if (!states || states.length === 0) {
      dfaSVG.removeAttribute('viewBox');
      return;
  };
  let xs = states.map(s => s.x);
  let ys = states.map(s => s.y);

  let minX = Math.min(...xs) - 80;
  let maxX = Math.max(...xs) + 80;
  let minY = Math.min(...ys) - 80;
  let maxY = Math.max(...ys) + 80;

  let width = maxX - minX;
  let height = maxY - minY;

  dfaSVG.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
}


// Initialize app when page loads
window.addEventListener('load', initializeApp);
