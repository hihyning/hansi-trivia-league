// Shared helpers for the phone and TV pages.
const HTL = (() => {
  let uid = 0;

  async function get(url) {
    const r = await fetch(url, { cache: 'no-store' });
    return r.json();
  }

  async function post(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function clock(sec) {
    sec = Math.ceil(sec);
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  // Parody of the NYC Trivia League mark, traced from their logo: a blue disc with the
  // question mark carved out, rounded block letters, orange outline with a soft orange glow.
  const BLUE = '#1f48a8', ORANGE = '#f0955a';
  const EMBLEM = 'M150 18 C154.3 18.7 161.7 21 166 24 C170.3 27 174.2 31.3 176 36 C177.8 40.7 178 47 177 52 C176 57 172.8 62.3 170 66 C167.2 69.7 163.7 71.3 160 74 C156.3 76.7 152 79.7 148 82 C144 84.3 139.7 86 136 88 C132.3 90 129.3 91.3 126 94 C122.7 96.7 119 101 116 104 C113 107 110.7 109 108 112 C105.3 115 101.8 118.7 100 122 C98.2 125.3 97.7 127.7 97 132 C96.3 136.3 95.5 143.7 96 148 C96.5 152.3 97.7 155.8 100 158 C102.3 160.2 101.7 160.5 110 161 C118.3 161.5 141.7 161.8 150 161 C158.3 160.2 157.3 158.8 160 156 C162.7 153.2 163.7 148.3 166 144 C168.3 139.7 170.7 133.5 174 130 C177.3 126.5 181.7 125.3 186 123 C190.3 120.7 195 118.5 200 116 C205 113.5 210.7 111.3 216 108 C221.3 104.7 227.3 99.3 232 96 C236.7 92.7 240.7 91.3 244 88 C247.3 84.7 249.7 81 252 76 C254.3 71 256.3 64.7 258 58 C259.7 51.3 260.7 44.3 262 36 C263.3 27.7 266 8 266 8 C266 8 272.3 25.7 276 34 C279.7 42.3 284.3 50 288 58 C291.7 66 295.3 73.7 298 82 C300.7 90.3 303.3 99.7 304 108 C304.7 116.3 303.3 124.7 302 132 C300.7 139.3 298.7 145.3 296 152 C293.3 158.7 290 165 286 172 C282 179 277.3 187.3 272 194 C266.7 200.7 260.7 206.3 254 212 C247.3 217.7 239.7 223.3 232 228 C224.3 232.7 216.3 237 208 240 C199.7 243 190 245.7 182 246 C174 246.3 164.3 244.3 160 242 C155.7 239.7 155.7 236.7 156 232 C156.3 227.3 161 219.7 162 214 C163 208.3 163 203 162 198 C161 193 158.3 188 156 184 C153.7 180 152.3 176.5 148 174 C143.7 171.5 136.7 169.7 130 169 C123.3 168.3 113.3 169.2 108 170 C102.7 170.8 101.3 172 98 174 C94.7 176 90.7 178.7 88 182 C85.3 185.3 84 190.3 82 194 C80 197.7 77.7 200.7 76 204 C74.3 207.3 72 214 72 214 C72 214 68.3 204.3 66 200 C63.7 195.7 60.7 192.3 58 188 C55.3 183.7 52.3 178.7 50 174 C47.7 169.3 45.7 165.7 44 160 C42.3 154.3 41 147 40 140 C39 133 38.5 124.7 38 118 C37.5 111.3 36.7 106 37 100 C37.3 94 38.7 87.7 40 82 C41.3 76.3 43.3 71 45 66 C46.7 61 48.2 56.7 50 52 C51.8 47.3 56 38 56 38 C56 38 58.8 52.3 60 58 C61.2 63.7 61.3 67.7 63 72 C64.7 76.3 67.2 81 70 84 C72.8 87 75.7 88.7 80 90 C84.3 91.3 90.7 92 96 92 C101.3 92 107.7 91.3 112 90 C116.3 88.7 119 86 122 84 C125 82 127.7 81 130 78 C132.3 75 134.3 70.7 136 66 C137.7 61.3 139.5 55 140 50 C140.5 45 139.7 40 139 36 C138.3 32 135.8 28.7 136 26 C136.2 23.3 137.7 21.3 140 20 C142.3 18.7 145.7 17.3 150 18Z';

  // Orange outline (grown from the shape itself) plus a soft orange glow behind it.
  function outline(id, r) {
    return `<filter id="${id}" x="-8%" y="-8%" width="116%" height="116%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/>
      <feFlood flood-color="${ORANGE}"/><feComposite in2="d" operator="in" result="ol"/>
      <feGaussianBlur in="ol" stdDeviation="${r * 1.3}" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="ol"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  }

  const LETTERS = `font-family="Montserrat, 'Avenir Next', 'Helvetica Neue', Arial, sans-serif" font-weight="600" fill="${BLUE}" letter-spacing="-5"`;
  const TAGLINE = `font-family="Quicksand, 'Arial Rounded MT Bold', sans-serif" font-weight="700" fill="#5566bd" letter-spacing="-.3"`;

  function logo(stacked = true) {
    const a = 'htlA' + (++uid), b = 'htlB' + uid;
    const defs = `<defs>${outline(a, 3.2)}${outline(b, 1.6)}</defs>`;
    if (stacked) {
      return `<svg viewBox="0 0 704 328" role="img" aria-label="Hansi's Trivia League">${defs}
        <path d="${EMBLEM}" fill="${BLUE}" filter="url(#${a})"/>
        <g ${LETTERS} font-size="88" filter="url(#${a})">
          <text x="310" y="86">HANSI'S</text>
          <text x="310" y="154">TRIVIA</text>
          <text x="310" y="222">LEAGUE</text>
        </g>
        <text x="342" y="298" text-anchor="middle" font-size="36" ${TAGLINE} filter="url(#${b})">hansi's most ideal trivia night</text>
      </svg>`;
    }
    return `<svg viewBox="0 0 900 150" role="img" aria-label="Hansi's Trivia League">${defs}
      <g transform="translate(6,4) scale(0.45)"><path d="${EMBLEM}" fill="${BLUE}" filter="url(#${a})"/></g>
      <text x="146" y="92" font-size="88" textLength="740" lengthAdjust="spacingAndGlyphs" ${LETTERS} filter="url(#${a})">HANSI'S TRIVIA LEAGUE</text>
      <text x="516" y="138" text-anchor="middle" font-size="36" ${TAGLINE} filter="url(#${b})">hansi's most ideal trivia night</text>
    </svg>`;
  }

  const LOCK_OPEN = `<svg class="lockico" viewBox="0 0 20 22"><path d="M5 10V6a5 5 0 0 1 9.6-2" fill="none" stroke="#2e9d3a" stroke-width="2.4" stroke-linecap="round"/><rect x="2" y="10" width="16" height="11" rx="2.5" fill="#2e9d3a"/></svg>`;
  const LOCK_SHUT = `<svg class="lockico" viewBox="0 0 20 22"><path d="M5 10V6a5 5 0 0 1 10 0v4" fill="none" stroke="#555" stroke-width="2.4"/><rect x="2" y="10" width="16" height="11" rx="2.5" fill="#555"/></svg>`;

  function confetti(count = 160) {
    const c = document.createElement('canvas');
    c.className = 'confetti';
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const W = c.width = innerWidth * devicePixelRatio, H = c.height = innerHeight * devicePixelRatio;
    const colors = ['#1c4aa6', '#f08a3c', '#ff5fa2', '#ffd23f', '#2ec4b6', '#9b5de5'];
    const parts = Array.from({ length: count }, (_, i) => {
      const left = i % 2 === 0;
      return {
        x: left ? 0 : W, y: H * 0.85,
        vx: (left ? 1 : -1) * (W * (0.004 + Math.random() * 0.012)),
        vy: -H * (0.012 + Math.random() * 0.014),
        r: (6 + Math.random() * 8) * devicePixelRatio, rot: Math.random() * 6, vr: Math.random() * 0.3 - 0.15,
        color: colors[i % colors.length],
      };
    });
    const g = H * 0.00045;
    let frames = 0;
    (function step() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y < H + 40) alive = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      }
      if (alive && ++frames < 400) requestAnimationFrame(step); else c.remove();
    })();
  }

  function leaderboardTable(st, meId) {
    const rows = st.leaderboard.map(r => `
      <tr class="${r.id === meId ? 'me' : ''}">
        <td>${esc(r.name)}</td>
        <td class="pts">${r.score} (${ordinal(r.rank)})</td>
      </tr>`).join('');
    return `<div class="card lb"><h3>Leaderboard</h3>
      <div class="count">(${st.leaderboard.length} playing)</div>
      <table><thead><tr><th>Team</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  return { get, post, esc, ordinal, clock, logo, confetti, leaderboardTable, LOCK_OPEN, LOCK_SHUT };
})();
