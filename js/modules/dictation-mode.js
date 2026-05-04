/* ===== Dictation Mode ===== */

const DictationMode = {
  _queue: [],
  _index: 0,
  _category: 'all',
  _speed: 1,
  _answered: false,

  init() {
    this._speed = App.store._data.ttsSpeed || 1;
    document.getElementById('dictSpeedBtn').textContent = this._speed + 'x';
    this._buildSelect();
    this._loadQueue();
  },

  _buildSelect() {
    const sel = document.getElementById('dictCatSelect');
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
    Utils.shuffle(pool);
    this._queue = pool;
    this._index = 0;
    this._answered = false;
    this._render();
  },

  _render() {
    if (this._queue.length === 0) {
      document.getElementById('dictCurrentEn').textContent = 'No sentences available';
      return;
    }

    const s = this._queue[this._index];
    const total = this._queue.length;

    document.getElementById('dictCounter').textContent = `${this._index + 1} / ${total}`;
    document.getElementById('dictProgressFill').style.width = `${((this._index + 1) / total) * 100}%`;
    document.getElementById('dictCurrentEn').textContent = 'Click ▶ to listen';
    document.getElementById('dictInput').value = '';
    document.getElementById('dictInput').disabled = false;
    document.getElementById('dictInput').placeholder = 'Listen and type what you hear...';
    document.getElementById('dictCompare').classList.remove('show');
    document.getElementById('dictCompare').innerHTML = '';
    this._answered = false;

    document.querySelector('#page-dictation .btn-check-dict').textContent = '✓ Check';
    document.querySelector('#page-dictation .btn-check-dict').onclick = () => this.check();
    document.getElementById('dictPlayBtn').classList.remove('playing');
    document.getElementById('dictPlayBtn').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  },

  async play() {
    if (this._queue.length === 0) return;
    const s = this._queue[this._index];

    // Ensure TTS is ready (first click sometimes needs a warm-up on some browsers)
    if (!Utils.tts._ready) await Utils.tts.init();

    Utils.tts.stop();

    const btn = document.getElementById('dictPlayBtn');
    btn.classList.add('playing');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

    Utils.tts.speak(s.en, this._speed, () => {
      btn.classList.remove('playing');
      btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
    });

    document.getElementById('dictCurrentEn').textContent = s.en.substring(0, 40) + '...';
  },

  toggleSpeed() {
    const speeds = [0.7, 1, 1.3];
    const idx = speeds.indexOf(this._speed);
    this._speed = speeds[(idx + 1) % speeds.length];
    document.getElementById('dictSpeedBtn').textContent = this._speed + 'x';
  },

  check() {
    if (this._answered) return this._next();
    if (this._queue.length === 0) return;

    const s = this._queue[this._index];
    const input = document.getElementById('dictInput').value.trim();
    const compareDiv = document.getElementById('dictCompare');

    if (!input) {
      Utils.toast('Please type something first.');
      return;
    }

    // Compare word by word
    const expectedWords = s.en.split(/\s+/);
    const inputWords = input.split(/\s+/);
    const expectedNorm = expectedWords.map(w => w.replace(/[^a-zA-Z'-]/g, '').toLowerCase());
    const inputNorm = inputWords.map(w => w.replace(/[^a-zA-Z'-]/g, '').toLowerCase());

    let html = '<div style="display:flex;flex-wrap:wrap;gap:4px">';
    let correctCount = 0;

    expectedWords.forEach((w, i) => {
      const cls = i < inputNorm.length && inputNorm[i] === expectedNorm[i] ? 'correct' : 'wrong';
      if (cls === 'correct') correctCount++;
      html += `<span class="word-token ${cls}">${Utils.escapeHtml(w)}</span>`;
    });

    // Mark missing words
    if (inputNorm.length < expectedWords.length) {
      html += `<span style="color:var(--text-tertiary);font-size:12px;margin-left:4px">(${expectedWords.length - inputNorm.length} missing)</span>`;
    }

    html += '</div>';

    const accuracy = Math.round((correctCount / expectedWords.length) * 100);
    html += `<div style="margin-top:8px;font-weight:600;color:${accuracy >= 80 ? 'var(--success)' : 'var(--warning)'}">
      Accuracy: ${accuracy}%
    </div>`;

    compareDiv.innerHTML = html;
    compareDiv.classList.add('show');

    // Record SRS based on accuracy
    const quality = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
    const existing = App.store.getSrsState(s.id);
    const newSrs = SRS.schedule({ srs: existing || null }, quality);
    App.store.saveSrsState(s.id, newSrs);
    App.store.recordStudy(1);

    this._answered = true;
    document.querySelector('#page-dictation .btn-check-dict').textContent = 'Next →';
    document.getElementById('dictInput').disabled = true;
  },

  showAnswer() {
    if (this._queue.length === 0) return;
    const s = this._queue[this._index];
    document.getElementById('dictInput').value = s.en;
    document.getElementById('dictInput').disabled = true;
    Utils.toast('Answer revealed');
  },

  _next() {
    if (this._index < this._queue.length - 1) {
      this._index++;
      this._render();
    } else {
      Utils.toast('🎉 Dictation complete!');
      this._loadQueue();
    }
  }
};
