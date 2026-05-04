/* ===== Review Mode ===== */

const ReviewMode = {
  _queue: [],

  init() {
    this._loadReviews();
  },

  _loadReviews() {
    const allSrs = App.store.getAllSrsStates();
    const dueIds = Object.keys(allSrs).filter(id => SRS.isDue(allSrs[id]));

    // Sort by priority
    dueIds.sort((a, b) => SRS.getPriority(allSrs[b]) - SRS.getPriority(allSrs[a]));

    this._queue = dueIds
      .map(id => ({ id, srs: allSrs[id], data: DATA.find(s => s.id === id) }))
      .filter(item => item.data);

    this._render();
  },

  _render() {
    const overdue = this._queue.filter(i => SRS.daysOverdue(i.srs) > 0).length;
    const total = this._queue.length;

    document.getElementById('reviewTotal').textContent = total;
    document.getElementById('reviewOverdue').textContent = overdue;

    // Today's new errors
    const today = Utils.date.today();
    const todayAdd = this._queue.filter(i => {
      const d = new Date(i.srs.nextReview || 0);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === today;
    }).length;
    document.getElementById('reviewTodayAdd').textContent = todayAdd;

    if (total === 0) {
      document.getElementById('reviewList').innerHTML = '';
      document.getElementById('reviewEmpty').style.display = 'block';
      return;
    }

    document.getElementById('reviewEmpty').style.display = 'none';

    const list = document.getElementById('reviewList');
    list.innerHTML = this._queue.map((item, i) => {
      const days = SRS.daysOverdue(item.srs);
      const mastery = SRS.getMastery(item.srs);
      return `
        <div class="review-item" onclick="ReviewMode.startReview(${i})">
          <div class="en">${Utils.escapeHtml(item.data.en.substring(0, 60))}...</div>
          <div class="zh">${Utils.escapeHtml(item.data.zh)}</div>
          <div class="meta">
            <span class="tag">Mastery: ${mastery}%</span>
            ${days > 0 ? `<span class="tag" style="color:var(--error)">Overdue: ${days}d</span>` :
              `<span class="tag" style="color:var(--success)">Due today</span>`}
            <span class="tag">Lapses: ${item.srs.lapses || 0}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  startReview(idx) {
    const item = this._queue[idx];
    if (!item) return;

    const s = item.data;
    const container = document.getElementById('reviewList');

    container.innerHTML = `
      <div class="card-container" style="height:auto;min-height:300px;cursor:default">
        <div style="background:var(--bg-card);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow-lg);border:1px solid var(--border)">
          <div style="font-size:14px;line-height:1.8;margin-bottom:16px">${Utils.escapeHtml(s.en)}</div>
          <div style="font-size:14px;line-height:1.7;color:var(--text-secondary);margin-bottom:12px">${Utils.escapeHtml(s.zh)}</div>
          <div style="margin-bottom:12px">
            ${s.vocab.map(v => `<div class="vocab-item"><span class="word">${v.word}</span><span class="meaning">— ${v.meaning}</span></div>`).join('')}
          </div>
          <div class="rating-bar">
            <button class="rating-btn a0" onclick="ReviewMode.rateReview(${idx}, 0)">🔄 Again</button>
            <button class="rating-btn a1" onclick="ReviewMode.rateReview(${idx}, 1)">🤔 Hard</button>
            <button class="rating-btn a2" onclick="ReviewMode.rateReview(${idx}, 2)">👍 Good</button>
            <button class="rating-btn a3" onclick="ReviewMode.rateReview(${idx}, 3)">⭐ Easy</button>
          </div>
        </div>
      </div>
    `;
  },

  rateReview(idx, quality) {
    const item = this._queue[idx];
    if (!item) return;

    const newSrs = SRS.schedule({ srs: item.srs }, quality);
    App.store.saveSrsState(item.id, newSrs);
    App.store.recordStudy(1);

    Utils.toast(quality > 0 ? '✅ Recorded!' : '🔄 Will review again soon');

    // Reload reviews
    this._loadReviews();
  },

  startBatchReview() {
    if (this._queue.length === 0) {
      Utils.toast('No reviews due!');
      return;
    }
    this.startReview(0);
  }
};
