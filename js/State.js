// Delad data och små hjälpfunktioner. Laddas först.
let db, P = [], cur = null; // P = alla växter, cur = växten man tittar på

const $ = s => document.querySelector(s);
const today = () => new Date().toISOString().slice(0, 10);
const days = d => Math.floor((Date.now() - new Date(d)) / 864e5);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Sätter rubrik, visar/döljer bakåtknapp och +-knapp
function nav(title, back) {
  $('header').hidden = !back;
  $('#back').hidden = !back;
  $('#t').textContent = title;
}

