/* ===== SM-2 Spaced Repetition Algorithm ===== */
/* Simplified version of the SuperMemo SM-2 algorithm */

const SRS = {
  defaults: {
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    nextReview: 0,
    lapses: 0
  },

  /* Rate: 0=Again, 1=Hard, 2=Good, 3=Easy */
  schedule(card, quality) {
    if (quality < 0 || quality > 3) quality = 2;

    let { interval, repetition, efactor, nextReview } = card.srs || { ...this.defaults };

    // SM-2 quality mapping: 0->0, 1->2, 2->4, 3->5
    const qMap = [0, 2, 4, 5];
    const q = qMap[quality];

    if (q < 3) {
      // Failed: reset
      repetition = 0;
      interval = 0;
      efactor = Math.max(1.3, efactor - 0.2);
    } else {
      // Passed
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetition++;
      // Slight efactor adjustment
      efactor = Math.max(1.3, efactor + (0.1 - (4 - q) * (0.08 + (4 - q) * 0.02)));
    }

    // Hard gives a smaller interval
    if (quality === 1 && interval > 1) {
      interval = Math.max(1, Math.round(interval * 0.6));
    }

    // Easy bonus
    if (quality === 3 && interval > 1) {
      interval = Math.round(interval * 1.3);
    }

    const now = Date.now();
    nextReview = now + interval * 86400000;

    const lapses = quality === 0 ? (card.srs?.lapses || 0) + 1 : (card.srs?.lapses || 0);

    return { interval, repetition, efactor, nextReview, lapses };
  },

  /* Get a score from 0-100 representing mastery level */
  getMastery(srs) {
    if (!srs || srs.repetition === 0) return 0;
    const maxInterval = 90; // After 90 days = fully mastered
    const progress = Math.min(1, srs.interval / maxInterval);
    return Math.round(progress * 100);
  },

  /* Check if a card is due for review */
  isDue(srs) {
    if (!srs || srs.nextReview === 0) return true;
    return Date.now() >= srs.nextReview;
  },

  /* Get how overdue (in days) */
  daysOverdue(srs) {
    if (!srs || srs.nextReview === 0) return Infinity;
    return Math.floor((Date.now() - srs.nextReview) / 86400000);
  },

  /* Get review priority score (higher = more urgent) */
  getPriority(srs) {
    if (!srs || srs.nextReview === 0) return 999;
    const overdue = this.daysOverdue(srs);
    if (overdue <= 0) return 0;
    return overdue + (srs.lapses || 0) * 5;
  }
};
