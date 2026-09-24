// Foton: förminskas till max 900 px innan de sparas
function addPhoto(inp) {
  const f = inp.files[0];
  if (!f) return;
  const im = new Image();
  im.onload = () => {
    const s = Math.min(1, 900 / Math.max(im.width, im.height));
    const c = document.createElement('canvas');
    c.width = im.width * s;
    c.height = im.height * s;
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    cur.photos.push({ d: today(), img: c.toDataURL('image/jpeg', .75) });
    save(cur).then(() => show(cur.id));
  };
  im.src = URL.createObjectURL(f);
}

async function delPhoto(i) {
  if (!confirm('Ta bort fotot?')) return;
  cur.photos.splice(i, 1);
  await save(cur);
  show(cur.id);
}
