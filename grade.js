// Answer checking for the souvenir quiz: the same rules the party game used (server.py).
const Grade = (() => {
  function norm(s) {
    return String(s ?? '')
      .normalize('NFKD').replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/['’‘`´]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim()
      .replace(/^(the|a|an) /, '');
  }

  // Edit distance counting a swap of two neighbouring letters as one typo.
  function osa(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }

  const allowance = n => (n <= 4 ? 0 : n <= 8 ? 1 : n <= 13 ? 2 : 3);
  const digits = s => (s.match(/\d+/g) || []).join(',');

  function isCorrect(given, spec) {
    const x = norm(given);
    if (!x) return false;
    if (spec.reject.some(r => norm(r) === x)) return false;
    for (const acc of spec.accept) {
      const y = norm(acc);
      if (x === y) return true;
      const xs = x.replace(/ /g, ''), ys = y.replace(/ /g, '');
      if (xs === ys) return true;
      if (digits(x) !== digits(y)) continue; // numbers must match exactly
      if (osa(xs, ys) <= allowance(ys.length)) return true;
    }
    return false;
  }

  // "Name any N": each box gets the index of the answer it matched, or null; each answer counts once.
  function matchUnordered(given, specs) {
    const used = new Set();
    return given.map(g => {
      const hit = specs.findIndex((spec, i) => !used.has(i) && isCorrect(g, spec));
      if (hit < 0) return null;
      used.add(hit);
      return hit;
    });
  }

  function parseNumber(s) {
    const n = parseFloat(String(s ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  return { isCorrect, matchUnordered, parseNumber };
})();
