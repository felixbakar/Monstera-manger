// Startsidan: moderplantor med sina sticklingar under
function card(p, sub) {
  const im = p.photos.length
    ? `<img src="${p.photos[p.photos.length - 1].img}">`
    : '<div class="ph">🌱</div>';
  return `<div class="card ${sub ? 'sub' : ''}" onclick="show('${p.id}')">${im}
    <div><b>${esc(p.name)}</b><small>${esc(p.variant)}${p.mother ? ' (stickling)' : ''}</small>${status(p)}</div></div>`;
}

function home() {
  cur = null;
  nav('Mina monsteror', false);
  const roots = P.filter(p => !P.find(m => m.id == p.mother));
  const list = roots.map(p =>
    card(p) + P.filter(c => c.mother == p.id).map(c => card(c, 1)).join('')
  ).join('');
  $('#app').innerHTML =
    (list || '<p class="empty">Inga växter än. Tryck på + för att lägga till din första.</p>') +
    '<button class="alt" onclick="exp()">Spara backup</button>' +
    '<label class="btn alt">Läs in backup<input type="file" accept=".json" hidden onchange="imp(this)"></label>';
}
