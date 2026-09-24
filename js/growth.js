// Tillväxt: mätningar och graf
function chart(g) {
  const v = g.filter(x => x.h > 0);
  if (v.length < 2) return '';
  const W = 300, H = 110, hs = v.map(x => x.h), mx = Math.max(...hs), mn = Math.min(...hs);
  const pt = v.map((x, i) => [10 + i * (W - 20) / (v.length - 1), H - 12 - (x.h - mn) / ((mx - mn) || 1) * (H - 28)]);
  return `<svg viewBox="0 0 ${W} ${H}"><polyline fill="none" stroke="var(--g)" stroke-width="2" points="${pt.map(p => p.join(',')).join(' ')}"/>${
    pt.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--g)"/>`).join('')}</svg>`;
}

async function grow() {
  const h = +$('#gh').value, l = +$('#gl').value;
  if (!h && !l) return alert('Fyll i höjd eller antal blad');
  cur.growth.push({ d: today(), h, l });
  await save(cur);
  show(cur.id);
}
