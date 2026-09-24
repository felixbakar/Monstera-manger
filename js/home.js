// Startsidan i samma stil som originalet
let q = '', flt = 'alla';

function pcard(p) {
  const im = p.photos.length
    ? `<img src="${p.photos[p.photos.length - 1].img}">`
    : '<div class="ph">🌱</div>';
  const m = P.find(x => x.id == p.mother);
  const n = P.filter(x => x.mother == p.id).length;
  const rel = m ? `<small>🌱 Stickling av ${esc(m.name)}</small>` : n ? `<small>✂️ ${n} sticklingar</small>` : '';
  return `<div class="pcard" onclick="show('${p.id}')">${im}<div>
    <b>${esc(p.name)}</b><small>${esc(p.variant)}</small>${rel}
    <span class="day">Dag ${days(p.date)}</span><small>📸 ${p.photos.length} bilder</small>${status(p)}</div></div>`;
}

function list() {
  const s = q.toLowerCase();
  const v = P.filter(p =>
    (p.name + ' ' + p.variant).toLowerCase().includes(s) &&
    (flt == 'alla' || (flt == 'mor' && !p.mother) || (flt == 'stick' && p.mother) ||
     (flt == 'vatten' && p.interval - days(last(p)) <= 0)));
  if (!v.length) return '<p class="empty">Inga växter hittades.</p>';
  const g = {};
  v.forEach(p => (g[p.variant || 'Övriga'] ||= []).push(p));
  return Object.keys(g).map(k => `<div class="grp"><div class="gh"><span>🪴</span><h2>${esc(k)}</h2>
    <span class="pill">${g[k].length} plantor</span></div><div class="rail">${g[k].map(pcard).join('')}</div></div>`).join('');
}

function refresh() {
  q = $('#sq').value;
  flt = $('#sf').value;
  $('#list').innerHTML = list();
}

function home() {
  cur = null;
  nav('', false);
  const ph = P.reduce((a, p) => a + p.photos.length, 0);
  const lv = Math.max(0, ...P.flatMap(p => p.growth.map(g => g.l || 0)));
  const st = P.filter(p => p.mother).length;
  const stat = (i, l, n) => `<div class="stat"><small>${i} ${l}</small><b>${n}</b></div>`;
  const opt = (v, t) => `<option value="${v}" ${flt == v ? 'selected' : ''}>${t}</option>`;
  $('#app').innerHTML = `
  <div class="hero"><div class="eyebrow"><span class="ico">🌿</span>Monstera Manager</div>
    <h1>Din växtsamling</h1><p>Dokumentera · följ · jämför · väx</p><hr>
    <div class="cnt"><b>${P.length}</b> plantor <i></i> <b>${ph}</b> bilder</div></div>
  <div class="stats">${stat('🌱', 'Plantor', P.length)}${stat('📸', 'Bilder', ph)}${stat('🍃', 'Flest blad', lv)}${stat('✂️', 'Sticklingar', st)}</div>
  <div class="find"><h2>Hitta en planta</h2><small>Sök eller filtrera ditt register</small>
    <input id="sq" placeholder="🔎 Sök på namn eller sort..." oninput="refresh()" value="${esc(q)}">
    <select id="sf" onchange="refresh()">${opt('alla', 'Alla plantor')}${opt('mor', 'Moderplantor')}${opt('stick', 'Sticklingar')}${opt('vatten', 'Behöver vatten')}</select></div>
  <div class="eyebrow">Ditt register</div><h2 class="big">Mina plantor</h2>
  <div id="list">${list()}</div>
  <button class="add" onclick="formPlant()">+ Lägg till planta</button>
  <details class="more"><summary>Mer<small>Verktyg och backup</small></summary>
    <button class="alt" onclick="exp()">Spara backup</button>
    <label class="btn alt">Läs in backup<input type="file" accept=".json" hidden onchange="imp(this)"></label></details>`;
}
