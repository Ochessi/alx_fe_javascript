// ====== Quotes Data ======
let quotes = [];
let selectedCategory = "all";

// ====== Utility Functions ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  if (stored) {
    quotes = JSON.parse(stored);
  } else {
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Success is not in what you have, but who you are.", category: "Success" },
      { text: "Happiness depends upon ourselves.", category: "Happiness" }
    ];
    saveQuotes();
  }
}

// Random helper
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ====== Filtering ======
function filterQuote(category) {
  if (!category || category === "all") {
    return quotes;
  }
  return quotes.filter(q => q.category.trim() === category);
}

// ====== DOM Elements ======
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.createElement("select");
categorySelect.id = "categorySelect";
document.body.insertBefore(categorySelect, quoteDisplay);

// ====== Render Functions ======
function renderQuote(text, category) {
  quoteDisplay.textContent = `"${text}" — (${category})`;
}

function showRandomQuote() {
  const pool = filterQuote(selectedCategory);
  if (!pool.length) {
    quoteDisplay.textContent = "No quotes in this category yet. Add one below!";
    return;
  }
  const { text, category } = pickRandom(pool);
  renderQuote(text, category);
}

function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category.trim()))];
  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === selectedCategory) option.selected = true;
    categorySelect.appendChild(option);
  });
}

// ====== Add Quotes ======
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const catInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = catInput.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category!");
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();

  // ✅ Sync new quote to server
  postQuoteToServer(newQ);

  textInput.value = "";
  catInput.value = "";
  showRandomQuote();
}

// ====== Server Interaction ======
async function fetchQuotesFromServer() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await res.json();

    const serverQuotes = data.map((item, i) => ({
      text: item.title,
      category: `ServerCat${i % 3}`
    }));

    quotes = [...serverQuotes, ...quotes];
    saveQuotes();
    populateCategories();
    showRandomQuote();

    console.log("Quotes fetched from server and merged.");
  } catch (err) {
    console.error("Error fetching from server:", err);
  }
}

async function postQuoteToServer(quote) {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });
    const data = await res.json();
    console.log("Quote posted to server:", data);
  } catch (err) {
    console.error("Error posting to server:", err);
  }
}

// ====== Notifications ======
function showNotification(message, type = "info") {
  let note = document.getElementById("notification");
  if (!note) {
    note = document.createElement("div");
    note.id = "notification";
    note.style.position = "fixed";
    note.style.bottom = "10px";
    note.style.right = "10px";
    note.style.padding = "10px 15px";
    note.style.borderRadius = "8px";
    note.style.color = "#fff";
    note.style.fontSize = "14px";
    note.style.zIndex = "9999";
    document.body.appendChild(note);
  }

  note.textContent = message;

  if (type === "success") note.style.backgroundColor = "#28a745";
  else if (type === "error") note.style.backgroundColor = "#dc3545";
  else note.style.backgroundColor = "#007bff";

  note.style.display = "block";

  // Auto-hide after 3s
  setTimeout(() => {
    note.style.display = "none";
  }, 3000);
}

// ====== Sync Logic ======
async function syncQuotes() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await res.json();

    const serverQuotes = data.map((item, i) => ({
      text: item.title,
      category: `ServerCat${i % 3}`
    }));

    // Merge (server precedence)
    quotes = [...serverQuotes, ...quotes];
    saveQuotes();

    populateCategories();
    showRandomQuote();

    // ✅ UI Notification
    showNotification("Quotes synced with server!", "success");
  } catch (err) {
    console.error("❌ Error syncing quotes:", err);
    showNotification("Failed to sync with server!", "error");
  }
}

// ====== Event Listeners ======
newQuoteBtn.addEventListener("click", showRandomQuote);

categorySelect.addEventListener("change", e => {
  selectedCategory = e.target.value;
  showRandomQuote();
});

// ====== Initialize ======
window.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();
  showRandomQuote();
  syncQuotes(); // initial sync
  setInterval(syncQuotes, 60000); // sync every 60s
});
