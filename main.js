/**
 * Main application file.
 * Initializes the app and orchestrates the different modules.
 */

// Global State
let CURRENT_DFA = null;
let STATE_POSITIONS = {}; // Populated by the renderer
let ANIMATION_GENERATOR = null; // For string testing
let CONSTRUCTION_SEQUENCE = []; // For DFA building
let CURRENT_STEP = -1;
let AUTO_PLAY = true;
let STEP_TIMEOUT = null;
let ANIMATION_SPEED = 1000;

// Initialize the application on window load
function initializeApp() {
  populateCategories();
  setupEventHandlers();
  clearVisualization();
  showWelcomeMessage();
  loadSavedDFAs(); // Log saved DFAs to console
}

// Populate the category dropdown from the DFA_LIBRARY
function populateCategories() {
  const dfaCategory = document.getElementById('dfaCategory');
  dfaCategory.innerHTML = '<option value="">Choose a category...</option>';
  Object.keys(DFA_LIBRARY).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = DFA_LIBRARY[key].name;
    dfaCategory.appendChild(option);
  });
}

// Start the application
window.addEventListener('load', initializeApp);
