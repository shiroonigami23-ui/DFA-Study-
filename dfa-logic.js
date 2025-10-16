/**
 * This file contains the core logic for DFA construction and string testing animations.
 */

function loadDFA(dfa) {
  window.CURRENT_DFA = JSON.parse(JSON.stringify(dfa)); // Deep copy
  window.CONSTRUCTION_SEQUENCE = buildAnimationSequence(window.CURRENT_DFA);
  window.CURRENT_STEP = -1;
  clearTimeout(window.STEP_TIMEOUT);
  window.ANIMATION_GENERATOR = null;

  clearVisualization();
  updateGuide(`📋 ${dfa.name}: ${dfa.description}. Press 'Next' to build.`);
  updateConstructionButtons();
  
  if (window.AUTO_PLAY) {
    nextConstructionStep();
  }
}

function buildAnimationSequence(dfa) {
  const sequence = [];
  if (!dfa || !dfa.states) return sequence;

  dfa.states.forEach(state => {
    let description = `Creating state ${state.id}`;
    if (state.initial) description += " (Initial)";
    if (state.accepting) description += " (Accepting)";
    sequence.push({ description, action: 'drawState', payload: state });
  });

  const transitionGroups = groupTransitions(dfa.transitions || []);
  Object.values(transitionGroups).forEach(group => {
    sequence.push({
      description: `Adding transition from ${group.from} to ${group.to} on '${group.symbols.join(',')}'`,
      action: 'drawTransition',
      payload: group
    });
  });
  return sequence;
}

function nextConstructionStep() {
  clearTimeout(window.STEP_TIMEOUT);
  if (window.CURRENT_STEP >= window.CONSTRUCTION_SEQUENCE.length - 1) {
    updateGuide('✅ Construction complete! Ready to test strings.');
    updateConstructionButtons();
    return;
  }
  window.CURRENT_STEP++;
  const step = window.CONSTRUCTION_SEQUENCE[window.CURRENT_STEP];
  updateGuide(`🔧 Step ${window.CURRENT_STEP + 1}/${window.CONSTRUCTION_SEQUENCE.length}: ${step.description}`);

  if (step.action === 'drawState') drawState(step.payload, false);
  else if (step.action === 'drawTransition') drawTransition(step.payload, false);
  
  updateConstructionButtons();
  if (window.AUTO_PLAY && window.CURRENT_STEP < window.CONSTRUCTION_SEQUENCE.length - 1) {
    window.STEP_TIMEOUT = setTimeout(nextConstructionStep, window.ANIMATION_SPEED / 1.5);
  }
}

function previousConstructionStep() {
  clearTimeout(window.STEP_TIMEOUT);
  if (window.CURRENT_STEP < 0) return;
  window.CURRENT_STEP--;

  clearVisualization();
  for (let i = 0; i <= window.CURRENT_STEP; i++) {
    const step = window.CONSTRUCTION_SEQUENCE[i];
    if (step.action === 'drawState') drawState(step.payload, false);
    else if (step.action === 'drawTransition') drawTransition(step.payload, false);
  }

  if (window.CURRENT_STEP < 0) {
    updateGuide(`📋 ${window.CURRENT_DFA.name}: ${window.CURRENT_DFA.description}. Press 'Next' to build.`);
  } else {
    updateGuide(`🔧 Step ${window.CURRENT_STEP + 1}/${window.CONSTRUCTION_SEQUENCE.length}: ${window.CONSTRUCTION_SEQUENCE[window.CURRENT_STEP].description}`);
  }
  updateConstructionButtons();
}

function* animateString(dfa, input) {
  const initialState = dfa.states.find(s => s.initial);
  if (!initialState) { yield { error: 'No initial state defined' }; return; }
  
  let currentStateId = initialState.id;
  yield { state: currentStateId, step: `Starting at state ${currentStateId}` };
  
  for (const symbol of input) {
    const transition = dfa.transitions.find(t => t.from === currentStateId && t.symbol === symbol);
    if (!transition) {
      yield { error: `No transition from ${currentStateId} on '${symbol}'`, state: currentStateId };
      return;
    }
    yield { transition: transition, step: `Reading '${symbol}': ${transition.from} → ${transition.to}`};
    currentStateId = transition.to;
    yield { state: currentStateId, step: `Now in state ${currentStateId}`};
  }
  
  const finalState = dfa.states.find(s => s.id === currentStateId);
  const accepted = finalState?.accepting;
  yield {
    state: currentStateId,
    result: accepted ? 'accepted' : 'rejected',
    step: accepted ? `✅ String accepted!` : `❌ String rejected!`
  };
}

function testString() {
  if (!window.CURRENT_DFA) { showOutput('Please select a DFA first!', 'error'); return; }
  
  clearTimeout(window.STEP_TIMEOUT);
  const input = document.getElementById('testInput').value.trim();
  
  if (window.CURRENT_DFA.alphabet) {
    for (const char of input) {
      if (!window.CURRENT_DFA.alphabet.includes(char)) {
        showOutput(`Invalid character '${char}'. Use only: ${window.CURRENT_DFA.alphabet.join(', ')}`, 'error');
        return;
      }
    }
  }
  
  window.ANIMATION_GENERATOR = animateString(window.CURRENT_DFA, input);
  visualizeDFA(window.CURRENT_DFA); // Ensure full DFA is drawn
  showOutput(`🎬 Testing string: "${input}"`, 'info');
  nextStringAnimationStep();
}

function nextStringAnimationStep() {
  if (window.STEP_TIMEOUT) clearTimeout(window.STEP_TIMEOUT);
  if (!window.ANIMATION_GENERATOR) return;
  
  const { value, done } = window.ANIMATION_GENERATOR.next();
  if (done || !value) { window.ANIMATION_GENERATOR = null; return; }
  
  visualizeDFA(window.CURRENT_DFA, { state: value.state, transition: value.transition });
  
  if (value.error) {
    showOutput(value.error, 'error');
    window.ANIMATION_GENERATOR = null;
  } else if (value.result) {
    showOutput(value.step, value.result === 'accepted' ? 'success' : 'error');
    document.getElementById('outputDisplay').classList.add('animate-result');
    setTimeout(() => document.getElementById('outputDisplay').classList.remove('animate-result'), 500);
    window.ANIMATION_GENERATOR = null;
  } else {
    updateGuide(value.step || '');
    window.STEP_TIMEOUT = setTimeout(nextStringAnimationStep, window.ANIMATION_SPEED);
  }
}
