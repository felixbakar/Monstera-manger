// Databasen (IndexedDB). Sparar hela växten som ett objekt.
const openDB = () => new Promise(r => {
  const q = indexedDB.open('mm', 1);
  q.onupgradeneeded = () => q.result.createObjectStore('p', { keyPath: 'id' });
  q.onsuccess = () => { db = q.result; r(); };
});
const all = () => new Promise(r => {
  const q = db.transaction('p').objectStore('p').getAll();
  q.onsuccess = () => r(q.result);
});
const save = p => new Promise(r => {
  const t = db.transaction('p', 'readwrite');
  t.objectStore('p').put(p);
  t.oncomplete = r;
});
const rm = id => new Promise(r => {
  const t = db.transaction('p', 'readwrite');
  t.objectStore('p').delete(id);
  t.oncomplete = r;
});
