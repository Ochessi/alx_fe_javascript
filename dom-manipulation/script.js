// ====== State ======
let quotes = [];
let categorySelect;
let selectedCategory = 'all'; // Track the currently selected category
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');

// ====== Storage Helpers ======
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem('quotes');
  if (stored) {
    quotes = JSON.parse(stored);
  } else {
    // Initial demo quotes
    quotes = [
      { text: "The best way to predict the future is to create it.", category: "Motivation" },
      { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
      { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
    ];
    saveQuotes();
  }
}

// Save last viewed quote in session storage
function saveLastQuote(quote) {
  sessionStorage.setItem('lastQuote', JSON.stringify(quote));
}

function getLastQuote() {
  const stored = sessionStorage.getItem('lastQuote');
  return stored ? JSON.parse(stored) : null;
}

// ====== Utility Functions ======
function uniqueCategories() {
  return [...new Set(quotes.map(q => q.category.trim()))];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ====== Category Management ======
function populateCategories() {
  const cats = uniqueCategories();
  categorySelect.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = `All (${quotes.length})`;
  categorySelect.appendChild(allOpt);

  cats.forEach(cat => {
    const count = quotes.filter(q => q.category.trim() === cat).length;
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${cat} (${count})`;
    categorySelect.appendChild(opt);
  });

  // Restore selection
  categorySelect.value = selectedCategory;
}

// ====== Quote Filtering ======
function filterQuote(category) {
  if (!category || category === 'all') {
    return quotes;
  }
  return quotes.filter(q => q.category.trim() === category);
}

// ====== Rendering Quotes ======
function renderQuote(text, category) {
  quoteDisplay.textContent = `"${text}" — ${category}`;
  saveLastQuote({ text, category });
}

function showRandomQuote() {
  const pool = filterQuote(selectedCategory);

  if (!pool.length) {
    quoteDisplay.textContent = 'No quotes in this category yet. Add one below!';
    return;
  }

  const { text, category } = pickRandom(pool);
  renderQuote(text, category);
}

// ====== Adding Quotes ======
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const catInput = document.getElementById('newQuoteCategory');

  const text = textInput.value.trim();
  const category = catInput.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category!");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  textInput.value = '';
  catInput.value = '';
  showRandomQuote();
}

// ====== JSON Import/Export ======
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
}

// ====== Server Sync ======
async function fetchQuotesFromServer() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    const data = await res.json();

    // Map server data to quotes format
    const serverQuotes = data.map((item, i) => ({
      text: item.title,
      category: `ServerCat${i % 3}`
    }));

    // Conflict resolution: server data takes precedence
    quotes = [...serverQuotes, ...quotes];

    saveQuotes();
    populateCategories();
    showRandomQuote();

    console.log('Quotes fetched from server and merged.');
  } catch (err) {
    console.error('Error fetching from server:', err);
  }
}

// ====== UI Setup ======
function renderControls() {
  const controls = document.createElement('div');

  categorySelect = document.createElement('select');
  categorySelect.addEventListener('change', () => {
    selectedCategory = categorySelect.value;
    showRandomQuote();
  });

  const exportBtn = document.createElement('button');
  exportBtn.textContent = "Export Quotes";
  exportBtn.onclick = exportToJsonFile;

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json';
  importInput.onchange = importFromJsonFile;

  controls.appendChild(categorySelect);
  controls.appendChild(exportBtn);
  controls.appendChild(importInput);

  document.body.insertBefore(controls, quoteDisplay);
}

// ====== Initialization ======
window.addEventListener('DOMContentLoaded', () => {
  loadQuotes();
  renderControls();
  populateCategories();

  const last = getLastQuote();
  if (last) {
    renderQuote(last.text, last.category);
  } else {
    showRandomQuote();
  }

  newQuoteBtn.addEventListener('click', showRandomQuote);

  // Initial fetch + periodic sync
  fetchQuotesFromServer();
  setInterval(fetchQuotesFromServer, 60000);
});
