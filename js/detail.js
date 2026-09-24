// Sidan för en enskild växt. Bygger ihop delarna från water/photos/growth.
function show(id) {
  cur = P.find(p => p.id == id);
  const p = cur;
  nav(p.name, true);
  const m = P.find(x => x.id == p.mother);
  const ch = P.filter(x => x.mother == p.id);
  const g = p.growth, hg = g.filter(x => x.h > 0);
  const lnk = x => `<a href="#" onclick="show('${x.id}');return false">${esc(x.name)}</a>`;

  $('#app').innerHTML = `
  <div class="sec"><small>${esc(p.variant)}, ${p.date}</small>
  ${m ? `<p>Stickling från ${lnk(m)}</p>` : ''}
  ${ch.length ? `<p>Sticklingar (${ch.length}): ${ch.map(lnk).join(', ')}</p>` : ''}
  ${p.notes ? `<p>${esc(p.notes)}</p>` : ''}
  <button onclick="formPlant('${p.id}')">Ta stickling</button><button class="alt" onclick="formPlant('','${p.id}')">Redigera</button></div>

  <div class="sec"><h2>Vatten ${status(p)}</h2>
  <button onclick="water()">Vattnad idag</button>
  <small>Var ${p.interval}:e dag. Senast: ${p.water.slice(-4).reverse().join(', ') || 'ingen loggad'}</small></div>

  <div class="sec"><h2>Foton</h2>
  <div class="grid">${p.photos.map((f, i) => `<div onclick="delPhoto(${i})"><img src="${f.img}"><small>${f.d}</small></div>`).join('')}</div>
  <label class="btn">Ta foto<input type="file" accept="image/*" capture="environment" hidden onchange="addPhoto(this)"></label>
  <label class="btn alt">Välj från album<input type="file" accept="image/*" hidden onchange="addPhoto(this)"></label></div>

  <div class="sec"><h2>Tillväxt</h2>${chart(g)}
  ${hg.length > 1 ? `<p>+${(hg[hg.length - 1].h - hg[0].h).toFixed(1)} cm sedan ${hg[0].d}</p>` : ''}
  <div class="row"><input id="gh" type="number" step="0.1" placeholder="Höjd (cm)"><input id="gl" type="number" placeholder="Antal blad"></div>
  <button onclick="grow()">Spara mätning</button>
  ${g.slice(-5).reverse().map(x => `<small>${x.d}: ${x.h || '-'} cm, ${x.l || '-'} blad</small>`).join('')}</div>

  <button class="del" onclick="delPlant()">Ta bort växt</button>`;
}

async function delPlant() {
  if (!confirm('Ta bort ' + cur.name + '? Det går inte att ångra.')) return;
  for (const c of P.filter(x => x.mother == cur.id)) { c.mother = ''; await save(c); }
  await rm(cur.id);
  P = await all();
  home();
}
