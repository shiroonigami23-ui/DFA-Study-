/**
 * This file handles all rendering logic related to the SVG canvas.
 */

// Draws the complete DFA instantly, used for string testing animations or resets.
function visualizeDFA(dfa, highlight = {}) {
  const svg = document.getElementById('dfaSVG');
  const defs = svg.querySelector('defs');
  svg.innerHTML = '';
  if (defs) svg.appendChild(defs);

  if (dfa && dfa.states) resizeViewBox(dfa.states);

  if (!dfa || !dfa.states || dfa.states.length === 0) {
    clearVisualization();
    return;
  }

  window.STATE_POSITIONS = {};
  dfa.states.forEach(state => {
    window.STATE_POSITIONS[state.id] = { x: state.x, y: state.y };
  });

  if (dfa.transitions) {
    const transitionGroups = groupTransitions(dfa.transitions);
    Object.values(transitionGroups).forEach(group => {
      const isHighlighted = highlight.transition && group.from === highlight.transition.from && group.to === highlight.transition.to && group.symbols.includes(highlight.transition.symbol);
      drawTransition(group, isHighlighted);
    });
  }

  dfa.states.forEach(state => {
    drawState(state, highlight.state === state.id);
  });
}

// Group transitions between the same two states to share an arrow and label.
function groupTransitions(transitions) {
  const groups = {};
  if (!transitions) return groups;
  transitions.forEach(t => {
    const key = `${t.from}->${t.to}`;
    if (!groups[key]) {
      groups[key] = { from: t.from, to: t.to, symbols: [] };
    }
    groups[key].symbols.push(t.symbol);
  });
  return groups;
}

// Draws a single state circle and its label.
function drawState(state, isHighlighted) {
  const svg = document.getElementById('dfaSVG');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', state.x);
  circle.setAttribute('cy', state.y);
  circle.setAttribute('r', 25);
  circle.setAttribute('class', `state-circle ${state.accepting ? 'final' : ''} ${isHighlighted ? 'active' : ''}`);
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
    svg.prepend(arrow);
  }

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', state.x);
  label.setAttribute('y', state.y);
  label.setAttribute('class', 'state-label');
  label.textContent = state.id;
  g.appendChild(label);
  svg.appendChild(g);
}

// Draws a transition arrow and its symbol label(s).
function drawTransition(transitionGroup, isHighlighted) {
  const fromPos = window.STATE_POSITIONS[transitionGroup.from];
  const toPos = window.STATE_POSITIONS[transitionGroup.to];
  const symbol = transitionGroup.symbols.join(',');

  if (!fromPos || !toPos) return;

  if (transitionGroup.from === transitionGroup.to) {
    drawSelfLoop(fromPos, symbol, isHighlighted);
  } else {
    const isBidirectional = !!document.querySelector(`[data-transition-key="${transitionGroup.to}->${transitionGroup.from}"]`);
    drawArrow(fromPos, toPos, symbol, isHighlighted, isBidirectional, transitionGroup);
  }
}

// Draws a curved or straight arrow for transitions between different states.
function drawArrow(from, to, symbol, isHighlighted, isBidirectional, group) {
  const svg = document.getElementById('dfaSVG');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.transitionKey = `${group.from}->${group.to}`;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / distance;
  const unitY = dy / distance;

  const startX = from.x + unitX * 25;
  const startY = from.y + unitY * 25;
  const endX = to.x - unitX * 25;
  const endY = to.y - unitY * 25;

  const curve = isBidirectional ? 25 : 0;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const controlX = midX - curve * unitY;
  const controlY = midY + curve * unitX;

  const pathD = `M${startX},${startY} Q${controlX},${controlY} ${endX},${endY}`;
  const labelX = controlX;
  const labelY = controlY + (curve === 0 ? -8 : (to.y < from.y || (to.y === from.y && to.x < from.x) ? -8 : 18));

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('class', `transition-path ${isHighlighted ? 'active' : ''}`);
  path.setAttribute('marker-end', `url(#arrowhead${isHighlighted ? '-active' : ''})`);
  g.appendChild(path);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', labelX);
  label.setAttribute('y', labelY);
  label.setAttribute('class', 'transition-label');
  label.textContent = symbol;
  g.appendChild(label);
  svg.prepend(g);
}

// Draws a self-looping transition arrow.
function drawSelfLoop(pos, symbol, isHighlighted) {
  const svg = document.getElementById('dfaSVG');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M${pos.x - 15} ${pos.y - 20} C${pos.x - 45} ${pos.y - 50}, ${pos.x + 45} ${pos.y - 50}, ${pos.x + 15} ${pos.y - 20}`);
  path.setAttribute('class', `transition-path ${isHighlighted ? 'active' : ''}`);
  path.setAttribute('marker-end', `url(#arrowhead${isHighlighted ? '-active' : ''})`);
  g.appendChild(path);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', pos.x);
  label.setAttribute('y', pos.y - 55);
  label.setAttribute('class', 'transition-label');
  label.textContent = symbol;
  g.appendChild(label);
  svg.prepend(g);
}

// Adjusts the SVG viewBox to fit all states.
function resizeViewBox(states) {
  const svg = document.getElementById('dfaSVG');
  if (!states || states.length === 0) {
    svg.removeAttribute('viewBox');
    return;
  }
  const xs = states.map(s => s.x);
  const ys = states.map(s => s.y);
  const minX = Math.min(...xs) - 80;
  const maxX = Math.max(...xs) + 80;
  const minY = Math.min(...ys) - 80;
  const maxY = Math.max(...ys) + 80;
  const width = maxX - minX;
  const height = maxY - minY;
  svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
    }
