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

    _loadVoices() {
      const all = speechSynthesis.getVoices();
      if (all.length) {
        this._voices = all.filter(v => v.lang.startsWith('en'));
        this._ready = true;
      }
    },

    async init() {
      if (this._ready) return;

      this._loadVoices();

      if (!this._ready) {
        // Chrome: getVoices() returns [] on first call; voices load asynchronously.
        // onvoiceschanged may fire quickly or never (if already loaded in a previous page).
        // Use a race between the event and a timeout so we never hang.
        let fired = false;
        const onChanged = () => {
          if (fired) return;
          fired = true;
          speechSynthesis.onvoiceschanged = null;
          this._loadVoices();
          // Chrome sometimes fires before voices are actually usable
          setTimeout(() => this._loadVoices(), 200);
        };

        speechSynthesis.onvoiceschanged = onChanged;
        // Force Chrome to trigger the event
        speechSynthesis.getVoices();

        // Race: either voices load within 3s, or we proceed anyway
        await Promise.race([
          new Promise(resolve => {
            const check = () => {
              if (this._ready) { resolve(); return; }
              setTimeout(check, 100);
            };
            check();
          }),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);

        speechSynthesis.onvoiceschanged = null;
        // Final attempt
        this._loadVoices();
        // Even if voices aren't loaded, mark ready so we don't block
        if (!this._ready) {
          console.warn('TTS: no English voices found, will use default');
          this._ready = true;
        }
      }
    },

    speak(text, rate = 1, callback) {
      // Chrome bugs: (1) speechSynthesis can get stuck in "paused" state,
      // (2) cancel() + immediate speak() can mute audio.
      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();

      const doSpeak = () => {
        const utter = new SpeechSynthesisUtterance(text || '');
        utter.lang = 'en-US';
        utter.rate = rate;
        utter.volume = 1;

        // Refresh voices each time — Chrome may change them across tabs/sessions
        const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        if (voices.length) {
          // Try Windows voices first (David, Zira, Mark), then macOS (Samantha, Karen), then Google
          const preferred = voices.find(
            v => v.name.includes('Microsoft David') || v.name.includes('David')
          ) || voices.find(
            v => v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Karen')
          ) || voices.find(
            v => v.name.includes('Google') || v.name.includes('Mark')
          ) || voices[0];
          utter.voice = preferred;
        }

        if (callback) {
          utter.onend = callback;
          // Chrome sometimes drops onend — fallback with a timeout
          const wordCount = (text || '').split(/\s+/).length;
          const fallbackMs = Math.max(3000, wordCount * 400 / rate);
          setTimeout(() => {
            if (synth.speaking || synth.pending) return;
            if (callback) { callback(); callback = null; }
          }, fallbackMs);
        }

        synth.speak(utter);
      };

      // 80ms delay gives Chrome enough time to flush the cancel
      setTimeout(doSpeak, 80);
    },

    stop() {
      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();
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
