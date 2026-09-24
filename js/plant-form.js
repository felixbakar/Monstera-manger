// Formulär för ny växt, stickling och redigering
// formPlant()          = ny växt
// formPlant(modersId)  = ny stickling från den växten
// formPlant('', id)    = redigera växten
function formPlant(mid, eid) {
  const e = P.find(x => x.id == eid) || {};
  const mo = e.mother || mid || '';
  const mp = P.find(x => x.id == mo) || {};
  nav(eid ? 'Redigera' : mid ? 'Ny stickling' : 'Ny växt', true);
  $('#app').innerHTML = `<div class="sec">
  <label>Namn</label><input id="fn" value="${esc(e.name)}" placeholder="t.ex. Monstera 1">
  <label>Sort</label><input id="fv" list="vs" value="${esc(e.variant || mp.variant)}">
  <datalist id="vs"><option>Deliciosa<option>Thai Constellation<option>Albo Variegata<option>Adansonii<option>Obliqua<option>Peru</datalist>
  <label>Moderplanta</label><select id="fm"><option value="">Ingen (egen moderplanta)</option>${
    P.filter(x => x.id != eid).map(x => `<option value="${x.id}" ${x.id == mo ? 'selected' : ''}>${esc(x.name)}</option>`).join('')
  }</select>
  <label>Datum (köpt eller tagen)</label><input id="fd" type="date" value="${e.date || today()}">
  <label>Vattna var … dag</label><input id="fi" type="number" min="1" value="${e.interval || 7}">
  <label>Anteckningar</label><textarea id="fx" rows="3">${esc(e.notes)}</textarea>
  <button onclick="savePlant('${eid || ''}')">Spara</button></div>`;
}

async function savePlant(eid) {
  const n = $('#fn').value.trim();
  if (!n) return alert('Skriv ett namn');
  const p = P.find(x => x.id == eid) || { id: Date.now().toString(36), photos: [], water: [], growth: [] };
  Object.assign(p, {
    name: n,
    variant: $('#fv').value.trim(),
    mother: $('#fm').value,
    date: $('#fd').value || today(),
    interval: +$('#fi').value || 7,
    notes: $('#fx').value.trim()
  });
  await save(p);
  P = await all();
  show(p.id);
}
