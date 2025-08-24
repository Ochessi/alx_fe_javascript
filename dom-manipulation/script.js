// script.js
(() => {
  // ====== DOM refs ======
  const quoteDisplay  = document.getElementById('quoteDisplay');
  const newQuoteBtn   = document.getElementById('newQuote');
  const controls      = document.getElementById('controls');
  const formContainer = document.getElementById('formContainer');
  const ioControls    = document.getElementById('ioControls');

  // ====== Storage keys ======
  const LS_QUOTES_KEY = 'quotes';
  const SS_LAST_QUOTE_KEY = 'lastViewedQuote';
  const SS_LAST_CATEGORY_KEY = 'lastSelectedCategory';

  // ====== Seed data ======
  const defaultQuotes = [
    { text: 'Stay hungry, stay foolish.', category: 'Inspiration' },
    { text: 'Talk is cheap. Show me the code.', category: 'Programming' },
    { text: 'Simplicity is the ultimate sophistication.', category: 'Design' },
    { text: 'The only way out is through.', category: 'Perseverance' },
    { text: 'First, solve the problem. Then, write the code.', category: 'Programming' },
  ];

  // ====== State ======
  let quotes = [];
  let categorySelect; // will be created dynamically

  // ====== LocalStorage helpers ======
  function loadQuotes() {
    try {
      const raw = localStorage.getItem(LS_QUOTES_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        quotes = sanitizeQuotes(parsed);
        return;
      }
    } catch {}
    quotes = defaultQuotes.slice();
  }

  function saveQuotes() {
    try {
      localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
    } catch {}
  }

  // ====== SessionStorage helpers (optional) ======
  function saveLastViewedQuote(q) {
    try { sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(q)); } catch {}
  }
  function loadLastViewedQuote() {
    try {
      const raw = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveLastSelectedCategory(cat) {
    try { sessionStorage.setItem(SS_LAST_CATEGORY_KEY, cat); } catch {}
  }
  function loadLastSelectedCategory() {
    try { return sessionStorage.getItem(SS_LAST_CATEGORY_KEY) || 'all'; } catch { return 'all'; }
  }

  // ====== Utilities ======
  function uniqueCategories() {
    return [...new Set(quotes.map(q => q.category.trim()))].filter(Boolean).sort((a,b)=>a.localeCompare(b));
  }
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function keyFor(q) {
    // used for de-duplication (case-insensitive text + category)
    return `${q.text.trim().toLowerCase()}||${q.category.trim().toLowerCase()}`;
  }
  function sanitizeQuotes(arr) {
    // normalize shape: {text: string, category: string}
    const out = [];
    const seen = new Set();
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      let { text, category } = item;
      if (typeof text !== 'string' || typeof category !== 'string') continue;
      text = text.trim();
      category = category.trim();
      if (!text || !category) continue;
      // (soft) limits
      if (text.length > 500) text = text.slice(0, 500);
      if (category.length > 100) category = category.slice(0, 100);
      const k = `${text.toLowerCase()}||${category.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ text, category });
    }
    return out;
  }

  // ====== Controls (category + show button) ======
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
  }

  function renderControls() {
    controls.innerHTML = '';

    const label = document.createElement('label');
    label.setAttribute('for', 'categoryFilter');
    label.textContent = 'Category: ';

    categorySelect = document.createElement('select');
    categorySelect.id = 'categoryFilter';

    populateCategories();
    label.appendChild(categorySelect);
    controls.appendChild(label);

    // Move existing button into the controls row
    newQuoteBtn.type = 'button';
    newQuoteBtn.setAttribute('aria-label', 'Show a new random quote in the selected category');
    controls.appendChild(newQuoteBtn);

    // Restore last selected category for this session (optional)
    const lastCat = loadLastSelectedCategory();
    if ([...categorySelect.options].some(o => o.value === lastCat)) {
      categorySelect.value = lastCat;
    }

    // Events
    categorySelect.addEventListener('change', () => {
      saveLastSelectedCategory(categorySelect.value);
      showRandomQuote();
    });
    newQuoteBtn.addEventListener('click', showRandomQuote);
  }

  // ====== Quote rendering ======
  function renderQuote(text, category) {
    quoteDisplay.innerHTML = '';

    const figure = document.createElement('figure');
    figure.className = 'quote-card';

    const block = document.createElement('blockquote');
    block.textContent = text;

    const cap = document.createElement('figcaption');
    cap.textContent = `— ${category}`;

    figure.append(block, cap);
    quoteDisplay.appendChild(figure);

    // Save last viewed in this session (optional)
    saveLastViewedQuote({ text, category });
  }

  // ====== showRandomQuote() ======
  function filterQuote(category) {
  if (!category || category === 'all') {
    return quotes;
  }
  return quotes.filter(q => q.category.trim() === category);
  }

  function showRandomQuote() {
  const selected = categorySelect?.value || 'all';
  const pool = filterQuote(selected);

  if (!pool.length) {
    quoteDisplay.textContent = 'No quotes in this category yet. Add one below!';
    return;
  }

  const { text, category } = pickRandom(pool);
  renderQuote(text, category);
  }

  // ====== Add Quote form ======
  function createAddQuoteForm() {
    formContainer.innerHTML = '';

    const form = document.createElement('form');
    form.id = 'addQuoteForm';
    form.autocomplete = 'off';

    const quoteInput = document.createElement('input');
    quoteInput.type = 'text';
    quoteInput.id = 'newQuoteText';
    quoteInput.placeholder = 'Enter a new quote';
    quoteInput.required = true;
    quoteInput.maxLength = 500;

    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.id = 'newQuoteCategory';
    categoryInput.placeholder = 'Enter quote category';
    categoryInput.required = true;
    categoryInput.setAttribute('list', 'categoryOptions');

    const datalist = document.createElement('datalist');
    datalist.id = 'categoryOptions';
    uniqueCategories().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      datalist.appendChild(opt);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.textContent = 'Add Quote';

    const msg = document.createElement('div');
    msg.id = 'status';
    msg.setAttribute('aria-live', 'polite');

    form.append(quoteInput, categoryInput, datalist, addBtn, msg);
    form.addEventListener('submit', addQuote);

    formContainer.appendChild(form);
  }

  function addQuote(e) {
    e.preventDefault();
    const text = document.getElementById('newQuoteText').value.trim();
    const category = document.getElementById('newQuoteCategory').value.trim();
    const status = document.getElementById('status');

    if (!text || !category) {
      status.textContent = 'Please fill in both fields.';
      return;
    }

    const newQ = { text, category };
    // prevent duplicates
    const exists = quotes.some(q => keyFor(q) === keyFor(newQ));
    if (exists) {
      status.textContent = 'That quote already exists in this category.';
      return;
    }

    quotes.push(newQ);
    saveQuotes();           // <-- Local Storage: persist on every change
    populateCategories();
    createAddQuoteForm();   // rebuild to refresh datalist
    categorySelect.value = category;
    renderQuote(text, category);
    status.textContent = 'Quote added!';
  }

  // ====== Import/Export UI & Logic ======
  function renderIOControls() {
    ioControls.innerHTML = '';

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.textContent = 'Export JSON';
    exportBtn.addEventListener('click', exportToJsonFile);

    // Import input + label (accessible)
    const importLabel = document.createElement('label');
    importLabel.setAttribute('for', 'importFile');
    importLabel.className = 'sr-only';
    importLabel.textContent = 'Import quotes JSON file';

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.id = 'importFile';
    importInput.accept = '.json';
    importInput.addEventListener('change', importFromJsonFile);

    // Optional: Reset to defaults (handy for testing)
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset to Defaults';
    resetBtn.addEventListener('click', () => {
      if (!confirm('This will replace your current quotes with the default set. Continue?')) return;
      quotes = defaultQuotes.slice();
      saveQuotes();
      populateCategories();
      createAddQuoteForm();
      showRandomQuote();
      alert('Reset complete.');
    });

    ioControls.append(exportBtn, importLabel, importInput, resetBtn);
  }

  function exportToJsonFile() {
    // Pretty-print so users can read/edit if they want
    const json = JSON.stringify(quotes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // timestamped filename
    const ts = new Date();
    const pad = n => String(n).padStart(2, '0');
    const name = `quotes-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Free the object URL
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function importFromJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(String(e.target.result));
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array of {text, category}.');

        const before = quotes.length;
        const merged = quotes.concat(parsed);
        const cleaned = sanitizeQuotes(merged);
        const added = cleaned.length - before;

        quotes = cleaned;
        saveQuotes();
        populateCategories();
        createAddQuoteForm();
        showRandomQuote();

        alert(`Import complete.\nNew quotes added: ${added}\nTotal now: ${quotes.length}`);
      } catch (err) {
        alert('Import failed: ' + (err?.message || 'Invalid JSON.'));
      } finally {
        // allow re-importing the same file by clearing value
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  // ====== Init ======
  document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    renderControls();
    renderIOControls();
    createAddQuoteForm();

    // Optional session restore: show last viewed if available
    const last = loadLastViewedQuote();
    if (last && last.text && last.category) {
      renderQuote(last.text, last.category);
    } else {
      showRandomQuote();
    }
  });

  // If you want to support inline HTML handlers (not necessary here), uncomment:
  // window.importFromJsonFile = importFromJsonFile;
})();

