// Vattning: senaste datum, märke och "Vattnad idag"
const last = p => p.water.length ? p.water[p.water.length - 1] : p.date;

function status(p) {
  const left = p.interval - days(last(p));
  return left <= 0
    ? '<span class="b red">Vattna nu</span>'
    : `<span class="b">Vatten om ${left} d</span>`;
}

async function water() {
  if (!cur.water.includes(today())) {
    cur.water.push(today());
    await save(cur);
  }
  show(cur.id);
}
