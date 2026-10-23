(() => {
  const D = window.TRIVIA, P = D.party;
  const $ = s => document.querySelector(s);
  const { esc } = HTL;
  const app = $('#app');

  $('#brand').innerHTML = HTL.logo(false);

  // ---------- shared bits
  const maker = r => r.units.find(u => u.type === 'choice')?.answers[0].a || '';
  const pctOf = (key, i = 0) => (P && P.pct[key] ? P.pct[key][i] : null);
  const partyLine = (key, i) => {
    const p = pctOf(key, i);
    return p == null ? '' : ` <span class="party">(${p}% at the party)</span>`;
  };
  const also = spec => {
    const alts = spec.accept.slice(1);
    return alts.length ? `<div class="also">Also accepted: ${alts.map(esc).join(', ')}</div>` : '';
  };
  const noteBox = n => (n ? `<div class="note">💡 ${esc(n)}</div>` : '');
  const clipBtn = u => (u.youtube
    ? `<button class="clipbtn" data-clip="${esc(u.youtube)}" data-start="${u.start || 0}">🎵 Play the 20-second clip</button>` : '');
  const roundBlurb = r => ({
    regular: '8 questions · 1 point each',
    list: r.unordered ? 'List Round · 1 point per answer · any order!' : 'List Round · 1 point per answer · order matters!',
    picture: 'Picture Round · 10 pictures · 1 point each',
    music: 'Music Round · name the artist · 1 point each',
  }[r.type] || '');
  const finaleCard = () => {
    const f = D.finale || {};
    return `<div class="card center final">
      <div class="cake">🎂</div>
      <div class="hb">${esc(f.title || 'Happy birthday Hansi!!')}</div>
      <p class="fmsg">${esc(f.message || '')}</p>
      <p class="fsign">${esc(f.signoff || '')}</p></div>`;
  };
  const standings = (extra) => {
    if (!P) return '';
    let rows = P.leaderboard.map(r => ({ ...r }));
    if (extra) {
      rows.push({ name: extra.name, score: extra.score, you: true });
      rows.sort((a, b) => b.score - a.score || (a.you ? 1 : -1));
    }
    return `<div class="card lb"><h3>Final Leaderboard · ${esc(D.date)}</h3>
      <div class="count">(${P.players} played at the party)</div>
      <table><thead><tr><th>Team</th><th>Points</th></tr></thead><tbody>${rows.map(r => `
        <tr class="${r.you || (!extra && r.name.toLowerCase() === 'hansi') ? 'me' : ''}">
          <td>${!r.you && r.rank === 1 ? '🏆 ' : ''}${esc(r.name)}</td>
          <td class="pts">${r.score}${r.rank ? ` (${HTL.ordinal(r.rank)})` : ''}</td></tr>`).join('')}
      </tbody></table></div>`;
  };

  // ---------- music clips (shared by the quiz and the answer key)
  let yt = null, ytReady = false;
  window.onYouTubeIframeAPIReady = () => {
    yt = new YT.Player('yt', {
      width: 320, height: 180,
      playerVars: { controls: 0, playsinline: 1, rel: 0 },
      events: { onReady: () => { ytReady = true; } },
    });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-clip]');
    if (b) {
      if (!ytReady) { b.textContent = 'Loading… tap again'; return; }
      const start = +b.dataset.start || 0;
      yt.loadVideoById({ videoId: b.dataset.clip, startSeconds: start, endSeconds: start + 20 });
      document.querySelectorAll('.clipbtn.playing').forEach(x => x.classList.remove('playing'));
      b.classList.add('playing');
      b.textContent = '🎵 Playing… (tap to replay)';
      clearTimeout(b._t);
      b._t = setTimeout(() => { b.classList.remove('playing'); b.textContent = '🎵 Play the 20-second clip'; }, 20500);
    }
    const z = e.target.closest('img[data-zoom]');
    if (z) {
      const box = document.createElement('div');
      box.className = 'zoom';
      box.innerHTML = `<img src="${esc(z.dataset.zoom)}" alt="">`;
      box.onclick = () => box.remove();
      document.body.appendChild(box);
    }
  });

  // ---------- routing
  function route() {
    const [page, arg] = location.hash.replace(/^#\/?/, '').split('/');
    $('#bar').hidden = true;
    if (yt && ytReady) yt.stopVideo();
    document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.page === (page || 'home')));
    if (page === 'play') play();
    else if (page === 'key') answerKey(arg);
    else home();
    if (!(page === 'key' && arg)) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- home
  function home() {
    app.innerHTML = `
      <h2 class="welcome">${D.welcome}</h2>
      <div class="teambar">Hansi's 23rd Birthday Trivia · ${esc(D.date)}</div>
      ${finaleCard()}
      <div class="cta">
        <a class="btn-go" href="#/play">▶ Play the quiz yourself</a>
        <a class="btn-go alt" href="#/key">📖 See every answer</a>
      </div>
      ${standings()}
      <div class="card"><h3 class="sect">The rounds</h3>
        ${D.rounds.map((r, ri) => `<a class="roundrow" href="#/key/${ri}">
          <span class="rn">${ri + 1}</span>
          <span class="rt"><b>${esc(r.title)}</b><small>${roundBlurb(r)} · made by ${esc(maker(r))}</small></span>
          <span class="chev">›</span></a>`).join('')}
        ${D.tiebreaker ? `<a class="roundrow" href="#/key/tb"><span class="rn">★</span>
          <span class="rt"><b>Bonus Tiebreaker</b><small>Closest number wins</small></span><span class="chev">›</span></a>` : ''}
      </div>`;
  }

  // ---------- answer key
  function answerKey(arg) {
    const n = D.rounds.length;
    app.innerHTML = `<h2 class="welcome">Answer Key</h2>
      <p class="sub intro-p">Every question, answer and note from the night${P ? `, with how many of the ${P.players} players got each one right` : ''}.</p>
      ${D.rounds.map((r, ri) => `<section id="round-${ri}">
        <div class="card roundhead">
          <div class="kicker">Round ${ri + 1} of ${n}</div>
          <div class="big">${esc(r.title)}</div>
          <div class="sub">${roundBlurb(r)}</div>
          ${r.blurb ? `<div class="sub note-i">${esc(r.blurb)}</div>` : ''}
          <div class="madeby">Made by ${esc(maker(r))}</div>
        </div>
        ${r.units.map(keyUnit).join('')}</section>`).join('')}
      ${D.tiebreaker ? `<section id="round-tb">${tiebreakerKey()}</section>` : ''}`;
    if (arg) document.getElementById('round-' + arg)?.scrollIntoView({ block: 'start' });
  }

  function keyUnit(u) {
    const head = `<div class="card"><div class="card-head">${HTL.LOCK_SHUT}<span>${esc(u.label)}</span></div>
      <div class="prompt">${esc(u.prompt)}</div>`;
    const notes = u.notes || [];
    if (u.unordered) {
      return `${head}<ol class="keylist">${u.answers.map((a, i) => `<li><em>${esc(a.a)}</em>${partyLine(u.key, i)}
        ${also(a)}${noteBox(notes[i])}</li>`).join('')}</ol></div>`;
    }
    if (u.type === 'list') {
      return `${head}${u.items.map((it, i) => `<div class="lrow"><span class="num">${i + 1}</span><div class="body">
        <div class="item-label">${esc(it.label)}</div>
        <div class="answer">Answer: <em>${esc(u.answers[i].a)}</em>${partyLine(u.key, i)}</div>${also(u.answers[i])}${noteBox(notes[i])}
        </div></div>`).join('')}</div>`;
    }
    if (u.type === 'picture') {
      return `${head}${noteBox(u.note)}<div class="pgrid">${u.items.map((it, i) => `<figure>
        <img src="${esc(it.image)}" alt="Picture ${i + 1}" data-zoom="${esc(it.image)}" loading="lazy">
        <div class="answer"><span class="pnum">${i + 1}</span> <em>${esc(u.answers[i].a)}</em>${partyLine(u.key, i)}</div>
        ${also(u.answers[i])}</figure>`).join('')}</div></div>`;
    }
    const fun = u.type === 'choice' ? '<div class="also">Just for fun, no points</div>' : '';
    return `${head}${clipBtn(u)}
      <div class="answer">Answer: <em>${esc(u.answers[0].a)}</em>${partyLine(u.key, 0)}</div>
      ${u.type === 'choice' ? fun : also(u.answers[0])}${noteBox(notes[0])}</div>`;
  }

  function tiebreakerKey(yourGuess) {
    const t = D.tiebreaker;
    const rows = P && P.tiebreaker.length ? `<table class="guesses">${P.tiebreaker.map((g, i) => `<tr class="${i === 0 ? 'win' : ''}">
      <td>${i === 0 ? '🎯 ' : ''}${esc(g.name)}</td><td class="pts">${esc(g.guess || '—')}${g.diff != null ? ` <span class="sub">(off by ${+g.diff.toFixed(2)})</span>` : ''}</td></tr>`).join('')}</table>` : '';
    return `<div class="card"><div class="card-head">${HTL.LOCK_SHUT}<span>${esc(t.label)}</span></div>
      <div class="prompt">${esc(t.prompt)}</div>
      ${yourGuess ?? ''}
      <div class="answer">Answer: <em>${esc(String(t.value))}</em></div>
      ${rows ? `<div class="sect-sm">The party's guesses</div>${rows}` : ''}</div>`;
  }

  // ---------- play the quiz
  const STORE = 'htl_souvenir_quiz';
  const steps = [];
  D.rounds.forEach((r, ri) => {
    steps.push({ kind: 'intro', ri });
    r.units.forEach(u => steps.push({ kind: 'q', ri, u }));
  });
  if (D.tiebreaker) steps.push({ kind: 'q', ri: null, u: D.tiebreaker });
  steps.push({ kind: 'final' });
  const scored = u => u.type !== 'choice' && u.type !== 'tiebreaker';
  const MAX = steps.filter(s => s.kind === 'q' && scored(s.u)).reduce((n, s) => n + s.u.items.length, 0);

  let Q = load();
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || fresh(); } catch { return fresh(); }
  }
  function fresh() { return { pos: 0, ans: {}, done: {}, drafts: {} }; }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(Q)); } catch { /* private mode: progress just isn't kept */ } }

  function marks(u) {
    const a = Q.ans[u.key] || [];
    if (u.unordered) return Grade.matchUnordered(a.slice(0, u.items.length), u.answers).map(h => h !== null);
    return u.answers.map((spec, i) => Grade.isCorrect(a[i] || '', spec));
  }
  function score() {
    return steps.reduce((s, st) => s + (st.kind === 'q' && scored(st.u) && Q.done[st.u.key] ? marks(st.u).filter(Boolean).length : 0), 0);
  }

  function setBar(html) {
    $('#bar-actions').innerHTML = html;
    $('#bar').hidden = !html;
  }

  function play() {
    const st = steps[Q.pos] || steps[0];
    const header = `<h2 class="welcome">${D.welcome}</h2>
      <div class="teambar playbar"><span>Playing solo · <b>${score()}</b> / ${MAX} points</span>
        <button class="linkbtn" id="restart">Start over</button></div>`;
    let body = '';
    if (st.kind === 'intro') body = introCard(st.ri);
    else if (st.kind === 'final') body = finalView();
    else body = Q.done[st.u.key] ? revealCard(st) : questionCard(st);
    app.innerHTML = header + body;
    $('#restart').onclick = () => {
      if (!confirmInline()) return;
      Q = fresh(); save(); play(); window.scrollTo(0, 0);
    };
    if (st.kind === 'intro') setBar(`<button class="btn-submit" id="next">Start round ▶</button>`);
    else if (st.kind === 'final') setBar('');
    else if (Q.done[st.u.key]) setBar(`<button class="btn-submit" id="next">${steps[Q.pos + 1]?.kind === 'final' ? 'See your results ▶' : 'Next ▶'}</button>`);
    else setBar(`<button class="btn-submit" id="submit">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
        Submit</button><span class="status" id="status">Check your answer</span>`);
    $('#next') && ($('#next').onclick = next);
    $('#submit') && ($('#submit').onclick = submit);
    if (st.kind === 'q' && !Q.done[st.u.key]) wireInputs(st.u);
  }

  // "Start over" uses a second tap instead of a pop-up, which some browsers block.
  let armed = 0;
  function confirmInline() {
    const b = $('#restart');
    if (Date.now() - armed < 4000) return true;
    armed = Date.now();
    b.textContent = 'Tap again to erase progress';
    setTimeout(() => { if ($('#restart')) $('#restart').textContent = 'Start over'; }, 4000);
    return false;
  }

  function next() {
    Q.pos = Math.min(Q.pos + 1, steps.length - 1);
    save(); play(); window.scrollTo(0, 0);
  }

  function introCard(ri) {
    const r = D.rounds[ri];
    return `<div class="card center intro">
      <div class="kicker">Round ${ri + 1} of ${D.rounds.length}</div>
      <div class="big">${esc(r.title)}</div>
      <div class="sub">${roundBlurb(r)}</div>
      ${r.blurb ? `<div class="sub note-i">${esc(r.blurb)}</div>` : ''}
      <div class="sub" style="margin-top:10px">Get ready! 👀</div></div>`;
  }

  function questionCard(st) {
    const u = st.u, saved = Q.drafts[u.key] || [];
    const val = i => esc(saved[i] || '');
    let inputs;
    if (u.type === 'list') {
      inputs = u.items.map((it, i) => `<div class="lrow"><span class="num">${i + 1}</span><div class="body">
        ${it.label ? `<div class="item-label">${esc(it.label)}</div>` : ''}
        <input class="ans" data-i="${i}" value="${val(i)}" autocomplete="off" enterkeyhint="next"></div></div>`).join('');
    } else if (u.type === 'picture') {
      inputs = `<div class="pgrid">${u.items.map((it, i) => `<figure>
        <img src="${esc(it.image)}" alt="Picture ${i + 1}" data-zoom="${esc(it.image)}">
        <label class="plabel"><span class="pnum">${i + 1}</span>
        <input class="ans" data-i="${i}" value="${val(i)}" autocomplete="off" enterkeyhint="next"></label></figure>`).join('')}</div>`;
    } else if (u.type === 'choice') {
      inputs = `<div class="choices">${u.choices.map((c, i) => `<button class="choice${saved[0] === c ? ' sel' : ''}" data-v="${esc(c)}">
        <span class="letter">${'ABCDEFGH'[i]}</span>${esc(c)}</button>`).join('')}</div>`;
    } else {
      const numeric = u.type === 'tiebreaker' ? 'inputmode="decimal"' : '';
      inputs = `${clipBtn(u)}<input class="ans" data-i="0" value="${val(0)}" ${numeric} autocomplete="off" enterkeyhint="send"
        placeholder="${u.type === 'music' ? 'Artist name' : 'Your answer'}">`;
    }
    return `<div class="card">${cardHead(false, u)}
      <div class="prompt">${esc(u.prompt)}</div>${inputs}</div>`;
  }

  function cardHead(locked, u) {
    return `<div class="card-head">${locked ? HTL.LOCK_SHUT : HTL.LOCK_OPEN}<span>${esc(u.label)}</span>
      <span class="badge" id="badge"></span></div>`;
  }

  function currentAnswers() {
    if ($('#app .choices')) {
      const sel = $('#app .choice.sel');
      return [sel ? sel.dataset.v : ''];
    }
    return [...document.querySelectorAll('#app input.ans')].map(i => i.value.trim());
  }

  function wireInputs(u) {
    const all = [...document.querySelectorAll('#app input.ans')];
    const keep = () => { Q.drafts[u.key] = currentAnswers(); save(); };
    all.forEach((inp, i) => {
      inp.addEventListener('input', keep);
      inp.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (i < all.length - 1) all[i + 1].focus(); else submit();
      });
    });
    document.querySelectorAll('#app .choice').forEach(btn => btn.onclick = () => {
      document.querySelectorAll('#app .choice').forEach(b => b.classList.toggle('sel', b === btn));
      keep();
    });
  }

  function submit() {
    const st = steps[Q.pos], u = st.u, answers = currentAnswers();
    if (!answers.some(Boolean)) { $('#status').textContent = 'Type an answer first!'; return; }
    Q.ans[u.key] = answers;
    Q.done[u.key] = true;
    save();
    play();
    window.scrollTo(0, 0);
    const right = u.type === 'tiebreaker' ? 0 : marks(u).filter(Boolean).length;
    if (right) HTL.confetti(right > 1 ? 180 : 110);
  }

  function revealCard(st) {
    const u = st.u, mine = Q.ans[u.key] || [], notes = u.notes || [];
    if (u.type === 'tiebreaker') {
      const n = Grade.parseNumber(mine[0]);
      const yours = `<div class="res ${n === u.value ? 'ok' : 'no'}">${esc(mine[0] || '—')}</div>
        ${n != null ? `<div class="also">You were off by ${+Math.abs(n - u.value).toFixed(2)}</div>` : ''}`;
      return tiebreakerKey(yours);
    }
    const mk = marks(u), right = mk.filter(Boolean).length;
    const row = (i, answerLine = true) => {
      const a = mine[i], cls = !a ? 'res empty' : mk[i] ? 'res ok' : 'res no';
      return `<div class="${cls}">${a ? esc(a) : 'No answer'}</div>
        ${answerLine ? `<div class="answer">Answer: <em>${esc(u.answers[i].a)}</em>${partyLine(u.key, i)}</div>` : ''}`;
    };
    let body;
    if (u.unordered) {
      body = u.items.map((_, i) => `<div class="lrow"><span class="num">${i + 1}</span><div class="body">${row(i, false)}</div></div>`).join('')
        + `<div class="answer allans"><b>All accepted answers:</b><ol>${u.answers.map((a, i) =>
          `<li><em>${esc(a.a)}</em>${partyLine(u.key, i)}${noteBox(notes[i])}</li>`).join('')}</ol></div>`;
    } else if (u.type === 'list') {
      body = u.items.map((it, i) => `<div class="lrow"><span class="num">${i + 1}</span><div class="body">
        <div class="item-label">${esc(it.label)}</div>${row(i)}${noteBox(notes[i])}</div></div>`).join('');
    } else if (u.type === 'picture') {
      body = noteBox(u.note) + `<div class="pgrid">${u.items.map((it, i) => `<figure>
        <img src="${esc(it.image)}" alt="Picture ${i + 1}" data-zoom="${esc(it.image)}">
        <div class="plabel"><span class="pnum">${i + 1}</span><div style="flex:1">${row(i)}</div></div></figure>`).join('')}</div>`;
    } else {
      body = clipBtn(u) + row(0) + (u.type === 'choice' ? '<div class="also">Just for fun, no points</div>' : '') + noteBox(notes[0]);
    }
    return `<div class="card">${cardHead(true, u).replace('></span></div>', `>${right} ✓ &nbsp;✗ ${mk.length - right}</span></div>`)}
      <div class="prompt">${esc(u.prompt)}</div>${body}</div>`;
  }

  function finalView() {
    const s = score();
    setTimeout(() => HTL.confetti(260), 150);
    return `${finaleCard()}
      <div class="card center"><div class="kicker">Your score</div>
        <div class="final-score">${s} <span>/ ${MAX}</span></div>
        ${P ? `<div class="sub">At the party, the winner scored ${P.leaderboard[0].score}.</div>` : ''}
        <div class="cta"><a class="btn-go alt" href="#/key">📖 See every answer</a></div>
      </div>
      ${standings({ name: 'You (just now)', score: s })}`;
  }

  route();
})();
