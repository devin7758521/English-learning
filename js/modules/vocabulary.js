/* ===== Vocabulary (Favorites) Module ===== */

const VocabMode = {
  _allItems: [],
  _filtered: [],
  _filter: 'all',

  init() {
    this._build();
  },

  _build() {
    const favIds = App.store._data.favorites || [];
    this._allItems = [];

    favIds.forEach(id => {
      const s = DATA.find(d => d.id === id);
      if (s) {
        s.vocab.forEach(v => {
          this._allItems.push({
            word: v.word,
            meaning: v.meaning,
            sentence: s.en,
            sentenceId: s.id,
            category: s.category,
            savedAt: Date.now()
          });
        });
      }
    });

    this._buildFilters();
    this._filter = 'all';
    this._applyFilter();
  },

  _buildFilters() {
    const container = document.getElementById('vocabFilters');
    const cats = [{ id: 'all', label: 'All' }, ...SENTENCE_CATEGORIES];
    container.innerHTML = cats.map(c =>
      `<button class="filter-tag ${c.id === this._filter ? 'active' : ''}" onclick="VocabMode.setFilter('${c.id}')">${c.label}</button>`
    ).join('');
  },

  setFilter(cat) {
    this._filter = cat;
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.toggle('active', t.textContent === (cat === 'all' ? 'All' : SENTENCE_CATEGORIES.find(c => c.id === cat)?.label)));
    this._applyFilter();
  },

  filter() {
    this._applyFilter();
  },

  _applyFilter() {
    const query = document.getElementById('vocabSearch').value.toLowerCase().trim();
    const catFilter = this._filter;

    this._filtered = this._allItems.filter(item => {
      if (catFilter !== 'all' && item.category !== catFilter) return false;
      if (query && !item.word.toLowerCase().includes(query) && !item.meaning.toLowerCase().includes(query)) return false;
      return true;
    });

    this._renderList();
  },

  _renderList() {
    const container = document.getElementById('vocabList');
    const emptyEl = document.getElementById('vocabEmpty');

    if (this._allItems.length === 0) {
      container.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';

    if (this._filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="title">No matching vocabulary</div></div>';
      return;
    }

    // Group by word, pick first occurrence
    const seen = new Set();
    const unique = [];
    this._filtered.forEach(item => {
      const key = item.word.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    container.innerHTML = unique.map(item => `
      <div class="vocab-card" onclick="VocabMode.showSentence(${item.sentenceId})">
        <div class="word-row">
          <span class="w">${item.word}</span>
          <button style="font-size:12px;color:var(--error)" onclick="event.stopPropagation();VocabMode.remove('${item.word}', ${item.sentenceId})">Remove</button>
        </div>
        <div class="meaning">${item.meaning}</div>
        <div class="sentence-ref">${Utils.escapeHtml(item.sentence.substring(0, 80))}${item.sentence.length > 80 ? '...' : ''}</div>
      </div>
    `).join('');
  },

  showSentence(sentenceId) {
    const s = DATA.find(d => d.id === sentenceId);
    if (s) {
      document.getElementById('vocabSearch').value = '';
      Utils.toast(s.en.substring(0, 50) + '...');
    }
  },

  remove(word, sentenceId) {
    App.store._data.favorites = (App.store._data.favorites || []).filter(id => id !== sentenceId);
    App.store.save();
    this._build();
    Utils.toast(`Removed "${word}"`);
  }
};
