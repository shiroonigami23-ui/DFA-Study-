/**
 * This file handles UI updates for elements outside the SVG canvas.
 */

function handleCategoryChange() {
  const category = document.getElementById('dfaCategory').value;
  if (category) {
    showVariations(category);
  } else {
    hideVariations();
    clearVisualization();
    showWelcomeMessage();
  }
}

function showVariations(categoryKey) {
  const category = DFA_LIBRARY[categoryKey];
  const variationsGrid = document.getElementById('variationsGrid');
  variationsGrid.innerHTML = '';

  category.dfas.forEach((dfa) => {
    const card = document.createElement('div');
    card.className = 'variation-card';
    card.innerHTML = `
      <div class="variation-title">${dfa.name}</div>
      <div class="variation-desc">${dfa.description}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.variation-card.active').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      loadDFA(dfa);
    });
    variationsGrid.appendChild(card);
  });
  document.getElementById('variationsContainer').style.display = 'block';
}

function hideVariations() {
  document.getElementById('variationsContainer').style.display = 'none';
}

function updateGuide(text) {
  document.getElementById('guideContent').innerHTML = text;
}

function showOutput(text, type = '') {
  const outputDisplay = document.getElementById('outputDisplay');
  outputDisplay.textContent = text;
  outputDisplay.className = 'output-display' + (type ? ` ${type}` : '');
}

function clearVisualization() {
  const svg = document.getElementById('dfaSVG');
  const defs = svg.querySelector('defs');
  svg.innerHTML = '';
  if (defs) svg.appendChild(defs);

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
  updateGuide('🎯 Welcome! Select a category to explore different automata.');
  showOutput('Ready to explore the world of finite automata!', '');
}

function updateConstructionButtons() {
  document.getElementById('prevStepBtn').disabled = window.CURRENT_STEP < 0;
  document.getElementById('nextStepBtn').disabled = window.CURRENT_STEP >= window.CONSTRUCTION_SEQUENCE.length - 1;
  document.getElementById('restartStepsBtn').disabled = !window.CURRENT_DFA;
}
