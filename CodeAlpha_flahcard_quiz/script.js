// --- Initial Default Flashcards ---
const DEFAULT_CARDS = [
  {
    id: '1',
    question: 'What is the process by which plants make their food using sunlight?',
    answer: 'Photosynthesis. Chlorophyll absorbs sunlight and converts carbon dioxide and water into glucose and oxygen.',
    category: 'Science',
    masteryStatus: 'unstudied'
  },
  {
    id: '2',
    question: 'What does CSS stand for in web development?',
    answer: 'Cascading Style Sheets. It controls page layout, colors, fonts, and responsiveness.',
    category: 'Web Dev',
    masteryStatus: 'unstudied'
  },
  {
    id: '3',
    question: 'What is the chemical symbol for Gold on the periodic table?',
    answer: 'Au (derived from the Latin word "Aurum").',
    category: 'Science',
    masteryStatus: 'unstudied'
  },
  {
    id: '4',
    question: 'What is the largest planet in our Solar System?',
    answer: 'Jupiter. It is a gas giant with a mass more than two and a half times that of all other planets combined.',
    category: 'Astronomy',
    masteryStatus: 'unstudied'
  },
  {
    id: '5',
    question: 'In JavaScript, what is the difference between "==" and "==="?',
    answer: '"==" checks equality with type coercion, whereas "===" checks strict equality without converting types.',
    category: 'Web Dev',
    masteryStatus: 'unstudied'
  }
];

// --- Audio Synthesizer for Interactive Sound Effects ---
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  initContext() {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playFlip() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playNav() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playSuccess() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.08);
      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.setValueAtTime(783.99, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch (e) {}
  }

  playReview() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }
}

const audio = new SoundEffects();

// --- Application State ---
let cards = JSON.parse(localStorage.getItem('quiz_flashcards_data')) || DEFAULT_CARDS;
let isDark = localStorage.getItem('quiz_theme') !== 'light';
let isMuted = localStorage.getItem('quiz_audio') === 'true';
let viewMode = 'study'; // 'study' | 'manage'
let currentIndex = 0;
let isFlipped = false;
let selectedCategory = 'All';
let editingCardId = null;
let manageSearchTerm = '';
let manageCategoryFilter = 'All';

// Sync sound mute setting initially
audio.isMuted = isMuted;

// --- DOM Elements ---
const flashcard = document.getElementById('flashcard');
const questionText = document.getElementById('card-question-text');
const answerText = document.getElementById('card-answer-text');
const categoryBadge = document.getElementById('card-category-badge');
const progressBadge = document.getElementById('card-progress-badge');
const progressBarFill = document.getElementById('progress-bar-fill');
const masteredStats = document.getElementById('mastered-stats');
const cardCounterSubtitle = document.getElementById('card-counter-subtitle');
const manageCount = document.getElementById('manage-count');
const categoryFilterList = document.getElementById('category-filter-list');
const assessmentBar = document.getElementById('assessment-bar');
const masteryStatusIndicator = document.getElementById('card-mastery-status-indicator');

const studyView = document.getElementById('study-view');
const manageView = document.getElementById('manage-view');
const cardsGrid = document.getElementById('cards-grid');

const tabStudyBtn = document.getElementById('tab-study-btn');
const tabManageBtn = document.getElementById('tab-manage-btn');
const toggleFlipBtn = document.getElementById('toggle-flip-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const rateReviewBtn = document.getElementById('rate-review-btn');
const rateMasteredBtn = document.getElementById('rate-mastered-btn');

const modal = document.getElementById('card-modal');
const modalTitle = document.getElementById('modal-title');
const cardForm = document.getElementById('card-form');
const formQuestion = document.getElementById('form-question');
const formAnswer = document.getElementById('form-answer');
const formCategory = document.getElementById('form-category');
const searchInput = document.getElementById('search-input');
const manageCategorySelect = document.getElementById('manage-category-select');

// --- Helper Functions ---
function getActiveDeck() {
  if (selectedCategory === 'All') return cards;
  return cards.filter(c => (c.category || 'General') === selectedCategory);
}

function saveState() {
  localStorage.setItem('quiz_flashcards_data', JSON.stringify(cards));
  localStorage.setItem('quiz_theme', isDark ? 'dark' : 'light');
  localStorage.setItem('quiz_audio', isMuted);
}

function updateThemeUI() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (isDark) {
    document.documentElement.classList.add('dark');
    if (themeBtn) themeBtn.textContent = '🌙';
  } else {
    document.documentElement.classList.remove('dark');
    if (themeBtn) themeBtn.textContent = '☀️';
  }
}

// --- Main Render Function ---
function render() {
  saveState();
  updateThemeUI();

  const activeDeck = getActiveDeck();
  const total = cards.length;
  const totalMastered = cards.filter(c => c.masteryStatus === 'mastered').length;
  const deckMastered = activeDeck.filter(c => c.masteryStatus === 'mastered').length;

  cardCounterSubtitle.textContent = `${total} cards in collection • ${totalMastered} mastered`;
  manageCount.textContent = total;

  // Ensure current index is within range
  if (currentIndex >= activeDeck.length && activeDeck.length > 0) {
    currentIndex = activeDeck.length - 1;
  }

  // Render Category Filter Tabs
  const categories = ['All', ...new Set(cards.map(c => c.category || 'General'))];
  categoryFilterList.innerHTML = categories.map(cat => `
    <button onclick="selectCategory('${cat}')" class="px-3 py-1 rounded-lg text-xs font-bold transition-all ${
      selectedCategory === cat
        ? 'bg-indigo-600 text-white shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
    }">
      ${cat}
    </button>
  `).join('');

  // Update Manage Dropdown Categories
  manageCategorySelect.innerHTML = categories.map(cat => `
    <option value="${cat}" ${manageCategoryFilter === cat ? 'selected' : ''}>${cat === 'All' ? 'All Categories' : cat}</option>
  `).join('');

  if (activeDeck.length === 0) {
    questionText.textContent = 'No cards available in this category.';
    answerText.textContent = 'Add a new card or select another category.';
    progressBadge.textContent = '0 / 0';
    categoryBadge.textContent = selectedCategory;
    progressBarFill.style.width = '0%';
    masteredStats.textContent = '🏆 0 Mastered';
    masteryStatusIndicator.textContent = 'Empty Deck';
    masteryStatusIndicator.className = 'text-[11px] text-slate-500';
    return;
  }

  const currentCard = activeDeck[currentIndex];
  questionText.textContent = currentCard.question;
  answerText.textContent = currentCard.answer;
  categoryBadge.textContent = currentCard.category || 'General';
  progressBadge.textContent = `Card ${currentIndex + 1} of ${activeDeck.length}`;
  masteredStats.textContent = `🏆 ${deckMastered}/${activeDeck.length} Mastered`;

  const progressPercent = Math.round(((currentIndex + 1) / activeDeck.length) * 100);
  progressBarFill.style.width = `${progressPercent}%`;

  // Update Mastery Status Indicator Badge on card
  if (currentCard.masteryStatus === 'mastered') {
    masteryStatusIndicator.textContent = '✅ Mastered';
    masteryStatusIndicator.className = 'text-[11px] font-bold text-emerald-500 dark:text-emerald-400';
  } else if (currentCard.masteryStatus === 'need_review') {
    masteryStatusIndicator.textContent = '🔄 Needs Review';
    masteryStatusIndicator.className = 'text-[11px] font-bold text-amber-500 dark:text-amber-400';
  } else {
    masteryStatusIndicator.textContent = 'Unstudied';
    masteryStatusIndicator.className = 'text-[11px] text-slate-400 dark:text-slate-500';
  }

  // Update Card Flip State & Buttons
  if (isFlipped) {
    flashcard.style.transform = 'rotateY(180deg)';
    toggleFlipBtn.innerHTML = '🙈 Hide Answer';
    assessmentBar.classList.remove('hidden');
    assessmentBar.classList.add('flex');
  } else {
    flashcard.style.transform = 'rotateY(0deg)';
    toggleFlipBtn.innerHTML = '👁️ Show Answer';
    assessmentBar.classList.add('hidden');
    assessmentBar.classList.remove('flex');
  }

  renderManageView();
}

// --- Render Manage View ---
function renderManageView() {
  const filteredCards = cards.filter(card => {
    const matchesCategory = manageCategoryFilter === 'All' || (card.category || 'General') === manageCategoryFilter;
    const matchesSearch = card.question.toLowerCase().includes(manageSearchTerm.toLowerCase()) ||
                          card.answer.toLowerCase().includes(manageSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filteredCards.length === 0) {
    cardsGrid.innerHTML = `
      <div class="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        No flashcards found matching your search or category filter.
      </div>
    `;
    return;
  }

  cardsGrid.innerHTML = filteredCards.map((card, idx) => `
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            ${card.category || 'General'}
          </span>
          ${card.masteryStatus === 'mastered' ? '<span class="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">✅ Mastered</span>' : ''}
        </div>
        <p class="font-bold text-slate-900 dark:text-slate-100 mb-2">${card.question}</p>
        <p class="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 line-clamp-3">${card.answer}</p>
      </div>
      <div class="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button onclick="editCard('${card.id}')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400">Edit</button>
        <button onclick="deleteCard('${card.id}')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400">Delete</button>
      </div>
    </div>
  `).join('');
}

// --- Interactive Handlers ---
window.selectCategory = function(cat) {
  selectedCategory = cat;
  currentIndex = 0;
  isFlipped = false;
  render();
};

function flipCard() {
  audio.playFlip();
  isFlipped = !isFlipped;
  render();
}

function nextCard() {
  audio.playNav();
  const activeDeck = getActiveDeck();
  if (activeDeck.length === 0) return;
  isFlipped = false;
  currentIndex = (currentIndex + 1) % activeDeck.length;
  render();
}

function prevCard() {
  audio.playNav();
  const activeDeck = getActiveDeck();
  if (activeDeck.length === 0) return;
  isFlipped = false;
  currentIndex = (currentIndex - 1 + activeDeck.length) % activeDeck.length;
  render();
}

function rateCard(status) {
  const activeDeck = getActiveDeck();
  if (activeDeck.length === 0) return;

  const currentCard = activeDeck[currentIndex];
  // Find card in global cards array and update
  const globalCard = cards.find(c => c.id === currentCard.id);
  if (globalCard) {
    globalCard.masteryStatus = status;
  }

  if (status === 'mastered') {
    audio.playSuccess();
  } else {
    audio.playReview();
  }

  saveState();
  nextCard();
}

// --- Card CRUD Operations ---
window.editCard = function(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;
  editingCardId = id;
  modalTitle.textContent = 'Edit Flashcard';
  formQuestion.value = card.question;
  formAnswer.value = card.answer;
  formCategory.value = card.category || '';
  modal.classList.remove('hidden');
};

window.deleteCard = function(id) {
  if (confirm('Delete this flashcard?')) {
    cards = cards.filter(c => c.id !== id);
    saveState();
    render();
  }
};

// Modal Listeners
document.getElementById('open-add-modal-btn').onclick = () => openModal();
document.getElementById('manage-add-btn').onclick = () => openModal();
document.getElementById('close-modal-btn').onclick = () => closeModal();
document.getElementById('cancel-modal-btn').onclick = () => closeModal();

function openModal() {
  editingCardId = null;
  modalTitle.textContent = 'Add New Flashcard';
  cardForm.reset();
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

cardForm.onsubmit = (e) => {
  e.preventDefault();
  const q = formQuestion.value.trim();
  const a = formAnswer.value.trim();
  const cat = formCategory.value.trim() || 'General';

  if (!q || !a) return;

  if (editingCardId) {
    cards = cards.map(c => c.id === editingCardId ? { ...c, question: q, answer: a, category: cat } : c);
  } else {
    cards.unshift({
      id: Date.now().toString(),
      question: q,
      answer: a,
      category: cat,
      masteryStatus: 'unstudied'
    });
  }

  closeModal();
  saveState();
  render();
};

// Search & Filter Input Listeners in Manage Mode
searchInput.oninput = (e) => {
  manageSearchTerm = e.target.value;
  renderManageView();
};

manageCategorySelect.onchange = (e) => {
  manageCategoryFilter = e.target.value;
  renderManageView();
};

// Navigation View Tabs
tabStudyBtn.onclick = () => {
  viewMode = 'study';
  studyView.classList.remove('hidden');
  manageView.classList.add('hidden');
  tabStudyBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs';
  tabManageBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200';
};

tabManageBtn.onclick = () => {
  viewMode = 'manage';
  manageView.classList.remove('hidden');
  studyView.classList.add('hidden');
  tabManageBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs';
  tabStudyBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200';
  renderManageView();
};

// Controls & Buttons
flashcard.onclick = flipCard;
toggleFlipBtn.onclick = flipCard;
nextBtn.onclick = nextCard;
prevBtn.onclick = prevCard;

rateReviewBtn.onclick = () => rateCard('need_review');
rateMasteredBtn.onclick = () => rateCard('mastered');

shuffleBtn.onclick = () => {
  const activeDeck = getActiveDeck();
  if (activeDeck.length === 0) return;
  // Shuffle active cards
  const shuffled = [...activeDeck].sort(() => Math.random() - 0.5);
  // Reorder in main cards array
  const otherCards = cards.filter(c => selectedCategory !== 'All' && (c.category || 'General') !== selectedCategory);
  cards = [...shuffled, ...otherCards];
  currentIndex = 0;
  isFlipped = false;
  saveState();
  render();
};

document.getElementById('reset-default-btn').onclick = () => {
  if (confirm('Reset to default sample flashcards?')) {
    cards = JSON.parse(JSON.stringify(DEFAULT_CARDS));
    currentIndex = 0;
    isFlipped = false;
    saveState();
    render();
  }
};

document.getElementById('audio-toggle-btn').onclick = () => {
  isMuted = !isMuted;
  audio.isMuted = isMuted;
  document.getElementById('audio-toggle-btn').textContent = isMuted ? '🔇' : '🔊';
  saveState();
};

document.getElementById('theme-toggle-btn').onclick = () => {
  isDark = !isDark;
  saveState();
  updateThemeUI();
};

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') nextCard();
  if (e.key === 'ArrowLeft') prevCard();
  if (e.key === ' ') {
    e.preventDefault();
    flipCard();
  }
  if (e.key === '1' && isFlipped) rateCard('need_review');
  if (e.key === '2' && isFlipped) rateCard('mastered');
});

// Initializing First Render
render();
