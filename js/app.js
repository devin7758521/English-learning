/* ===== Core Application Engine ===== */

const App = {
  _pages: ['dashboard', 'card', 'fillblank', 'dictation', 'review', 'vocab', 'settings'],
  _currentPage: 'dashboard',
  _initialized: false,

  /* ---- Store (centralized state) ---- */
  store: {
    _data: null,

    load() {
      this._data = Utils.storage.get('store', {
        dailyGoal: 20,
        newReviewRatio: 1,
        ttsSpeed: 1,
        streak: 0,
        lastActiveDate: '',
        todayCount: 0,
        totalLearned: 0,
        history: {}, // date: count
        favorites: [] // sentence IDs
      });
      this._checkDailyReset();
      return this._data;
    },

    save() {
      Utils.storage.set('store', this._data);
    },

    _checkDailyReset() {
      const today = Utils.date.today();
      if (this._data.lastActiveDate !== today) {
        this._data.todayCount = 0;
        // Check streak
        if (this._data.lastActiveDate) {
          const diff = Utils.date.daysBetween(this._data.lastActiveDate, today);
          if (diff === 1) {
            this._data.streak += 1;
          } else if (diff > 1) {
            this._data.streak = 0;
          }
        } else {
          this._data.streak = 1;
        }
        this._data.lastActiveDate = today;
        this.save();
      }
    },

    recordStudy(count = 1) {
      const today = Utils.date.today();
      this._data.todayCount = (this._data.todayCount || 0) + count;
      this._data.totalLearned = (this._data.totalLearned || 0) + count;
      this._data.history[today] = (this._data.history[today] || 0) + count;
      this._data.streak = Math.max(this._data.streak, 1);
      this.save();
    },

    toggleFavorite(sentenceId) {
      const idx = this._data.favorites.indexOf(sentenceId);
      if (idx > -1) {
        this._data.favorites.splice(idx, 1);
        this.save();
        return false;
      } else {
        this._data.favorites.push(sentenceId);
        this.save();
        return true;
      }
    },

    isFavorite(sentenceId) {
      return this._data.favorites.includes(sentenceId);
    },

    getSrsState(sentenceId) {
      const all = Utils.storage.get('srs', {});
      return all[sentenceId] || null;
    },

    saveSrsState(sentenceId, srsState) {
      const all = Utils.storage.get('srs', {});
      all[sentenceId] = srsState;
      Utils.storage.set('srs', all);
    },

    getAllSrsStates() {
      return Utils.storage.get('srs', {});
    },

    reset() {
      Utils.storage.clear();
      this._data = null;
      this.load();
    }
  },

  /* ---- Navigation ---- */
  navigate(page) {
    if (page === this._currentPage) return;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show target
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
      // Scroll to top
      document.getElementById('mainContent').scrollTop = 0;
    }

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    this._currentPage = page;

    // Initialize page
    switch (page) {
      case 'dashboard': Dashboard.init(); break;
      case 'card': CardMode.init(); break;
      case 'fillblank': FillblankMode.init(); break;
      case 'dictation': DictationMode.init(); break;
      case 'review': ReviewMode.init(); break;
      case 'vocab': VocabMode.init(); break;
      case 'settings': Settings.init(); break;
    }
  },

  /* ---- Continue Learning ---- */
  continueLearning() {
    // Check if there are due reviews first
    const allSrs = this.store.getAllSrsStates();
    const dueIds = Object.keys(allSrs).filter(id => SRS.isDue(allSrs[id]));
    if (dueIds.length > 5) {
      this.navigate('review');
      Utils.toast(`${dueIds.length} sentences due for review`);
      return;
    }
    this.navigate('card');
  },

  /* ---- Init ---- */
  async init() {
    if (this._initialized) return;

    // Load store
    this.store.load();

    // Init TTS
    await Utils.tts.init();

    // Init dashboard
    Dashboard.init();

    this._initialized = true;
    console.log('IELTS 1000 initialized.');
  }
};

/* ===== Settings Module ===== */
const Settings = {
  init() {
    const st = App.store._data;
    document.getElementById('setDailyGoal').value = st.dailyGoal || 20;
    document.getElementById('setRatio').value = st.newReviewRatio || 1;
    document.getElementById('setSpeed').value = st.ttsSpeed || 1;
  },

  updateGoal(val) {
    const n = parseInt(val) || 20;
    App.store._data.dailyGoal = Math.max(5, Math.min(100, n));
    App.store.save();
    Utils.toast(`Daily goal set to ${App.store._data.dailyGoal}`);
  },

  updateRatio(val) {
    App.store._data.newReviewRatio = parseFloat(val);
    App.store.save();
  },

  updateSpeed(val) {
    App.store._data.ttsSpeed = parseFloat(val);
    App.store.save();
  },

  resetData() {
    if (confirm('This will erase all your learning progress. Continue?')) {
      App.store.reset();
      Utils.toast('Data reset complete');
      this.init();
      Dashboard.init();
    }
  }
};

/* ---- Start ---- */
document.addEventListener('DOMContentLoaded', () => App.init());
