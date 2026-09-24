// Backup: spara alla växter till en fil och läs in igen
function exp() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(P)], { type: 'application/json' }));
  a.download = 'monstera-backup-' + today() + '.json';
  a.click();
}

async function imp(i) {
  const f = i.files[0];
  if (!f) return;
  try {
    for (const p of JSON.parse(await f.text())) await save(p);
    P = await all();
    home();
  } catch (e) { alert('Filen gick inte att läsa'); }
}
