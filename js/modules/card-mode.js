/* ===== Card Mode (Flashcard) ===== */

const CardMode = {
  _queue: [],
  _index: 0,
  _category: 'all',
  _flipped: false,
  _locked: false,

  init() {
    this._buildSelect();
    this._loadQueue();
  },

  _buildSelect() {
    const sel = document.getElementById('cardCatSelect');
    sel.innerHTML = '<option value="all">All Categories</option>' +
      SENTENCE_CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
    sel.value = this._category;
  },

  changeCategory(cat) {
    this._category = cat;
    this._loadQueue();
  },

  _loadQueue() {
    let pool = this._category === 'all'
      ? [...DATA]
      : DATA.filter(s => s.category === this._category);

    // Prioritize due reviews
    const allSrs = App.store.getAllSrsStates();
    const due = pool.filter(s => { const st = allSrs[s.id]; return st && SRS.isDue(st); });
    const new_ = pool.filter(s => !allSrs[s.id]);

    // Sort due by priority
    due.sort((a, b) => SRS.getPriority(allSrs[b.id]) - SRS.getPriority(allSrs[a.id]));
    Utils.shuffle(new_);

    this._queue = [...due, ...new_];
    this._index = 0;
    this._flipped = false;
    this._render();
  },

  _render() {
    if (this._queue.length === 0) {
      document.getElementById('cardContainer').innerHTML = `
        <div class="empty-state" style="height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="title">No sentences found</div>
          <div class="desc">Try a different category or come back later.</div>
        </div>`;
      return;
    }

    const idx = Math.min(this._index, this._queue.length - 1);
    const s = this._queue[idx];
    const total = this._queue.length;

    document.getElementById('cardCounter').textContent = `${idx + 1} / ${total}`;
    document.getElementById('cardProgressFill').style.width = `${((idx + 1) / total) * 100}%`;

    // Front: sentence with highlighted vocab
    let frontHtml = Utils.escapeHtml(s.en);
    s.vocab.forEach(v => {
      const re = new RegExp(`\\b(${v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      frontHtml = frontHtml.replace(re, '<span class="highlight">$1</span>');
    });
    document.getElementById('cardFront').innerHTML = frontHtml;

    // Back: translation + vocab
    document.getElementById('cardBack').innerHTML = Utils.escapeHtml(s.zh);

    const vocabHtml = s.vocab.map(v =>
      `<div class="vocab-item"><span class="word">${v.word}</span><span class="meaning">— ${v.meaning}</span></div>`
    ).join('');
    document.getElementById('cardVocab').innerHTML = vocabHtml;

    this._flipped = false;
    document.getElementById('cardInner').classList.remove('flipped');
    this._locked = false;
  },

  flip() {
    if (this._locked) return;
    this._flipped = !this._flipped;
    document.getElementById('cardInner').classList.toggle('flipped', this._flipped);
  },

  rate(quality) {
    if (this._queue.length === 0) return;

    const s = this._queue[this._index];
    const existing = App.store.getSrsState(s.id);
    const newSrs = SRS.schedule({ srs: existing || null }, quality);

    App.store.saveSrsState(s.id, newSrs);
    App.store.recordStudy(1);

    // Move to next
    if (this._index < this._queue.length - 1) {
      this._index++;
      this._render();
    } else {
      Utils.toast('🎉 Section complete!');
      this._loadQueue();
    }
  }
};
