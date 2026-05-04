/* ===== Dashboard Module ===== */

const Dashboard = {
  _charts: {},

  init() {
    this._renderStats();
    this._renderCategories();
    this._updateContinueBtn();
  },

  _renderStats() {
    const st = App.store._data;
    const today = Utils.date.today();
    const learned = st.totalLearned || 0;
    const pct = Math.min(100, Math.round((learned / 1000) * 100));

    document.getElementById('dashGreeting').textContent = Utils.date.greet();
    document.getElementById('dashDate').textContent = today;
    document.getElementById('statToday').textContent = st.todayCount || 0;
    document.getElementById('statGoal').textContent = st.dailyGoal || 20;
    document.getElementById('statStreak').textContent = st.streak || 0;
    document.getElementById('statLearned').textContent = learned;
    document.getElementById('statMastery').textContent = pct + '%';

    // Review due count
    const allSrs = App.store.getAllSrsStates();
    const dueCount = Object.keys(allSrs).filter(id => SRS.isDue(allSrs[id])).length;
    document.getElementById('statReviewDue').textContent = `待复习: ${dueCount}`;
  },

  _renderCategories() {
    const grid = document.getElementById('catGrid');
    const cats = SENTENCE_CATEGORIES;

    grid.innerHTML = cats.map(c => {
      const sentences = DATA.filter(s => s.category === c.id);
      const total = sentences.length;
      const allSrs = App.store.getAllSrsStates();
      const learned = sentences.filter(s => {
        const state = allSrs[s.id];
        return state && state.repetition > 0;
      }).length;
      const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

      return `
        <button class="cat-chip" onclick="App.navigate('card');CardMode.changeCategory('${c.id}')">
          <span class="dot" style="background:${c.color}"></span>
          <span>${c.label}</span>
          <span class="count">${learned}/${total}</span>
          <div class="progress-mini"><div class="fill" style="width:${pct}%;background:${c.color}"></div></div>
        </button>
      `;
    }).join('');
  },

  _updateContinueBtn() {
    const allSrs = App.store.getAllSrsStates();
    const dueCount = Object.keys(allSrs).filter(id => SRS.isDue(allSrs[id])).length;
    const btn = document.getElementById('continueBtn');
    if (dueCount > 0) {
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Continue Review (${dueCount})`;
    } else {
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Learn New Sentences`;
    }
  }
};
