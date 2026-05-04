/* ===== Fill-in-the-Blank Mode ===== */

const FillblankMode = {
  _queue: [],
  _index: 0,
  _category: 'all',
  _answered: false,

  init() {
    this._buildSelect();
    this._loadQueue();
  },

  _buildSelect() {
    const sel = document.getElementById('fillCatSelect');
    sel.innerHTML = '<option value="all">All Categories</option>' +
      SENTENCE_CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
    sel.value = this._category;
  },

  changeCategory(cat) {
    this._category = cat;
    this._loadQueue();
  },

  _loadQueue() {
    let pool = this._category === 'all' ? [...DATA] : DATA.filter(s => s.category === this._category);
    pool = pool.filter(s => s.vocab.length > 0);
    Utils.shuffle(pool);
    this._queue = pool;
    this._index = 0;
    this._answered = false;
    this._render();
  },

  _render() {
    if (this._queue.length === 0) {
      document.getElementById('fillSentence').innerHTML = '<div class="empty-state"><div class="title">No sentences available</div></div>';
      return;
    }

    const s = this._queue[this._index];
    const total = this._queue.length;

    document.getElementById('fillCounter').textContent = `${this._index + 1} / ${total}`;
    document.getElementById('fillProgressFill').style.width = `${((this._index + 1) / total) * 100}%`;

    // Choose a blank word
    const blankWordIdx = s.blankWord !== undefined ? s.blankWord : Math.floor(Math.random() * s.vocab.length);
    const blankWord = s.vocab[blankWordIdx].word;

    // Build sentence with blank
    const parts = s.en.split(new RegExp(`\\b(${blankWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i'));
    const html = parts.map((p, i) => {
      if (p.toLowerCase() === blankWord.toLowerCase()) {
        return `<input class="blank-input" id="fillInput" type="text" placeholder="..." autocomplete="off">`;
      }
      return Utils.escapeHtml(p);
    }).join('');

    document.getElementById('fillSentence').innerHTML = html;
    document.getElementById('fillResult').classList.remove('show');
    document.getElementById('fillResult').innerHTML = '';

    this._blankWord = blankWord;
    this._answered = false;

    // Focus input after render
    setTimeout(() => {
      const inp = document.getElementById('fillInput');
      if (inp) inp.focus();
    }, 100);
  },

  hint() {
    const inp = document.getElementById('fillInput');
    if (!inp || this._answered || !this._blankWord) return;
    // Show first letter as hint
    const hint = this._blankWord[0] + '_'.repeat(this._blankWord.length - 1);
    inp.placeholder = hint;
    Utils.toast(`Hint: starts with "${this._blankWord[0]}" (${this._blankWord.length} letters)`);
  },

  check() {
    if (this._answered) {
      this._next();
      return;
    }
    if (this._queue.length === 0) return;

    const inp = document.getElementById('fillInput');
    if (!inp || !this._blankWord) return;

    const answer = inp.value.trim().toLowerCase();
    const correct = this._blankWord.toLowerCase();

    const resultDiv = document.getElementById('fillResult');

    if (answer === correct) {
      inp.classList.add('correct');
      inp.disabled = true;
      resultDiv.innerHTML = `<span style="color:var(--success);font-weight:600">✓ Correct!</span>`;
      resultDiv.classList.add('show');

      // Record SRS
      const s = this._queue[this._index];
      const existing = App.store.getSrsState(s.id);
      const newSrs = SRS.schedule({ srs: existing || null }, 2);
      App.store.saveSrsState(s.id, newSrs);
      App.store.recordStudy(1);
    } else {
      inp.classList.add('wrong');
      inp.disabled = true;
      resultDiv.innerHTML = `
        <span style="color:var(--error);font-weight:600">✗ Not quite.</span>
        <div style="margin-top:4px">Correct: <span class="correct-answer">${this._blankWord}</span></div>
        <div style="margin-top:2px;color:var(--text-secondary)">${Utils.escapeHtml(this._blankWord)} — ${this._queue[this._index].vocab.find(v => v.word.toLowerCase() === correct)?.meaning || ''}</div>
      `;
      resultDiv.classList.add('show');

      // Record as forgotten
      const s = this._queue[this._index];
      const existing = App.store.getSrsState(s.id);
      const newSrs = SRS.schedule({ srs: existing || null }, 0);
      App.store.saveSrsState(s.id, newSrs);
    }

    this._answered = true;
    document.querySelector('.btn-submit').textContent = 'Next →';
  },

  _next() {
    if (this._index < this._queue.length - 1) {
      this._index++;
      this._answered = false;
      document.querySelector('.btn-submit').textContent = '✓ Check';
      this._render();
    } else {
      Utils.toast('🎉 Section complete!');
      this._loadQueue();
      document.querySelector('.btn-submit').textContent = '✓ Check';
    }
  }
};
