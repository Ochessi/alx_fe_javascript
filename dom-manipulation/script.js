// script.js
(() => {
  // ====== Elements from the DOM ======
  const quoteDisplay = document.getElementById('quoteDisplay');
  const newQuoteBtn  = document.getElementById('newQuote');
  const controls     = document.getElementById('controls');
  const formContainer = document.getElementById('formContainer');

  // ====== Data (seed quotes) ======
  const defaultQuotes = [
    { text: 'Stay hungry, stay foolish.', category: 'Inspiration' },
    { text: 'Talk is cheap. Show me the code.', category: 'Programming' },
    { text: 'Simplicity is the ultimate sophistication.', category: 'Design' },
    { text: 'The only way out is through.', category: 'Perseverance' },
    { text: 'First, solve the problem. Then, write the code.', category: 'Programming' },
  ];

  let quotes = [];

  // ====== Persistence ======
  function loadQuotes() {
    try {
      const saved = localStorage.getItem('quotes');
      quotes = saved ? JSON.parse(saved) : defaultQuotes;
    } catch {
      quotes = defaultQuotes;
    }
  }
  function saveQuotes() {
    try { localStorage.setItem('quotes', JSON.stringify(quotes)); } catch {}
  }

  // ====== Helpers ======
  function uniqueCategories() {
    return [...new Set(quotes.map(q => q.category.trim()))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ====== UI: Controls (Category Filter + Show Button) ======
  let categorySelect;

  function refreshCategorySelect() {
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

    // Category label + select
    const label = document.createElement('label');
    label.setAttribute('for', 'categoryFilter');
    label.textContent = 'Category: ';

    categorySelect = document.createElement('select');
    categorySelect.id = 'categoryFilter';
    refreshCategorySelect();

    label.appendChild(categorySelect);
    controls.appendChild(label);

    // Move the existing button into controls for a better layout
    newQuoteBtn.type = 'button';
    newQuoteBtn.setAttribute('aria-label', 'Show a new random quote in the selected category');
    controls.appendChild(newQuoteBtn);

    // Events
    categorySelect.addEventListener('change', showRandomQuote);
    newQuoteBtn.addEventListener('click', showRandomQuote);
  }

  // ====== UI: Quote Rendering ======
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
  }

  // ====== Core: showRandomQuote() ======
  function showRandomQuote() {
    const selected = categorySelect?.value || 'all';
    const pool = selected === 'all'
      ? quotes
      : quotes.filter(q => q.category.trim() === selected);

    if (!pool.length) {
      quoteDisplay.textContent = 'No quotes in this category yet. Add one below!';
      return;
    }

    const { text, category } = pickRandom(pool);
    renderQuote(text, category);
  }

  // ====== UI: createAddQuoteForm() ======
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
    quoteInput.maxLength = 280;

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

  // ====== Core: addQuote() ======
  function addQuote(e) {
    e.preventDefault();
    const text = document.getElementById('newQuoteText').value.trim();
    const category = document.getElementById('newQuoteCategory').value.trim();
    const status = document.getElementById('status');

    if (!text || !category) {
      status.textContent = 'Please fill in both fields.';
      return;
    }

    quotes.push({ text, category });
    saveQuotes();

    // Update UI pieces that depend on data
    refreshCategorySelect();
    createAddQuoteForm(); // rebuild form to refresh datalist

    // Switch to the added/used category if it exists
    if (uniqueCategories().includes(category)) {
      categorySelect.value = category;
    }

    // Show the newly added quote
    renderQuote(text, category);
    status.textContent = 'Quote added!';
  }

  // ====== Init ======
  document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    renderControls();
    createAddQuoteForm();
    showRandomQuote();
  });

  // Expose required functions globally ONLY if you need to call them inline in HTML.
  // window.showRandomQuote = showRandomQuote;
  // window.createAddQuoteForm = createAddQuoteForm;
  // window.addQuote = addQuote;
})();
