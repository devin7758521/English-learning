/* ===== Utility Functions ===== */

const Utils = {
  /* ---- Storage ---- */
  storage: {
    get(key, def = null) {
      try { const v = localStorage.getItem('ielts_' + key); return v ? JSON.parse(v) : def; }
      catch { return def; }
    },
    set(key, val) {
      try { localStorage.setItem('ielts_' + key, JSON.stringify(val)); return true; }
      catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem('ielts_' + key); return true; }
      catch { return false; }
    },
    clear() {
      try {
        Object.keys(localStorage).filter(k => k.startsWith('ielts_')).forEach(k => localStorage.removeItem(k));
        return true;
      } catch { return false; }
    }
  },

  /* ---- TTS ---- */
  tts: {
    _voices: null,
    _ready: false,

    async init() {
      if (this._ready) return;
      // Chrome bug: getVoices() may return [] on first call
      const load = () => {
        const all = speechSynthesis.getVoices();
        if (all.length) {
          this._voices = all.filter(v => v.lang.startsWith('en'));
          this._ready = true;
        }
      };
      load();
      if (!this._ready) {
        await new Promise(resolve => {
          speechSynthesis.onvoiceschanged = () => {
            load();
            // Chrome sometimes fires onvoiceschanged before voices are usable
            setTimeout(load, 200);
            resolve();
          };
          // Force Chrome to fire the event
          speechSynthesis.getVoices();
        });
        // Final retry after async gap
        load();
      }
    },

    speak(text, rate = 1, callback) {
      // Chrome bug: cancel() then immediate speak() can mute audio;
      // use a micro-delay to separate them
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text || '');
        utter.lang = 'en-US';
        utter.rate = rate;
        utter.volume = 1;
        if (this._voices && this._voices.length > 0) {
          const preferred = this._voices.find(
            v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google UK')
          ) || this._voices[0];
          utter.voice = preferred;
        }
        if (callback) utter.onend = callback;
        // Chrome fallback: re-read voices in case they changed
        if (!this._voices || !this._voices.length) {
          this._voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        }
        speechSynthesis.speak(utter);
      }, 50);
    },

    stop() {
      window.speechSynthesis.cancel();
    },

    isPlaying() {
      return window.speechSynthesis.speaking;
    }
  },

  /* ---- Date & Time ---- */
  date: {
    today() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },
    greet() {
      const h = new Date().getHours();
      if (h < 6) return '夜深了，还在学习？';
      if (h < 12) return '早上好！☀️';
      if (h < 14) return '中午好！';
      if (h < 18) return '下午好！📖';
      return '晚上好！🌙';
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${y}.${m}.${d}`;
    },
    daysBetween(a, b) {
      const da = new Date(a), db = new Date(b);
      return Math.round((db - da) / 86400000);
    }
  },

  /* ---- Search & Filter ---- */
  searchSentences(query, sentences) {
    if (!query || !query.trim()) return sentences;
    const q = query.toLowerCase();
    return sentences.filter(s =>
      s.en.toLowerCase().includes(q) ||
      s.zh.toLowerCase().includes(q) ||
      s.vocab.some(v => v.word.toLowerCase().includes(q))
    );
  },

  filterByCategory(cat, sentences) {
    if (!cat || cat === 'all') return sentences;
    return sentences.filter(s => s.category === cat);
  },

  /* ---- Shuffle (Fisher-Yates) ---- */
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /* ---- Random ID ---- */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  /* ---- Toast ---- */
  toast(msg, duration = 2200) {
    const container = document.getElementById('toast');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, duration);
  },

  /* ---- Escape HTML ---- */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /* ---- Debounce ---- */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};
