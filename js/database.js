/* =========================================================
   MONSTERA MANAGER
   database.js
   IndexedDB + grundläggande databasfunktioner
   ========================================================= */

const DB = "MonsteraManagerDB";
const VER = 9;

const PS = "plants";
const IS = "images";
const IMG = IS;

let db = null;


/* ---------------------------------------------------------
   Hjälpfunktion
   --------------------------------------------------------- */

const $ = id => document.getElementById(id);


/* ---------------------------------------------------------
   Öppna databas
   --------------------------------------------------------- */

function openDB() {
  if (db) {
    return Promise.resolve(db);
  }

  return new Promise((resolve, reject) => {

    const request = indexedDB.open(DB, VER);

    request.onupgradeneeded = event => {

      const database = event.target.result;

      /* Plantor */

      if (!database.objectStoreNames.contains(PS)) {
        database.createObjectStore(PS, {
          keyPath: "id"
        });
      }


      /* Bilder */

      if (!database.objectStoreNames.contains(IS)) {

        const store = database.createObjectStore(IS, {
          keyPath: "id"
        });

        store.createIndex("plantId", "plantId");
      }


      /* Miljö / historik */

      for (const name of [
        "envLogs",
        "waterLogs",
        "tempLogs",
        "humidityLogs",
        "lightLogs",
        "substrateLogs",
        "events"
      ]) {

        if (!database.objectStoreNames.contains(name)) {
          database.createObjectStore(name, {
            keyPath: "id"
          });
        }

      }

    };


    request.onsuccess = event => {

      db = event.target.result;


      db.onversionchange = () => {
        db.close();
        db = null;
      };


      db.onclose = () => {
        db = null;
      };


      resolve(db);
    };


    request.onerror = () => {
      reject(
        request.error ||
        new Error("Kunde inte öppna databasen.")
      );
    };


    request.onblocked = () => {
      reject(
        new Error(
          "Databasen är låst av en annan flik."
        )
      );
    };

  });
}


/* ---------------------------------------------------------
   Hämta object store
   --------------------------------------------------------- */

function store(name, mode = "readonly") {

  if (!db) {
    throw new Error(
      "Databasen är inte öppen."
    );
  }


  if (!db.objectStoreNames.contains(name)) {
    throw new Error(
      "Saknad databas-store: " + name
    );
  }


  return db
    .transaction(name, mode)
    .objectStore(name);
}


/* ---------------------------------------------------------
   Spara / uppdatera
   --------------------------------------------------------- */

function put(name, value) {

  return new Promise((resolve, reject) => {

    try {

      const request =
        store(name, "readwrite").put(value);


      request.onsuccess = () => {
        resolve(value);
      };


      request.onerror = () => {

        reject(
          request.error ||
          new Error(
            "Kunde inte spara data."
          )
        );

      };

    } catch (error) {

      reject(error);

    }

  });

}


/* ---------------------------------------------------------
   Hämta alla
   --------------------------------------------------------- */

function all(name) {

  return new Promise((resolve, reject) => {

    try {

      const request =
        store(name).getAll();


      request.onsuccess = () => {
        resolve(request.result);
      };


      request.onerror = () => {

        reject(
          request.error ||
          new Error(
            "Kunde inte läsa data."
          )
        );

      };

    } catch (error) {

      reject(error);

    }

  });

}


/* ---------------------------------------------------------
   Hämta en post
   --------------------------------------------------------- */

function one(name, id) {

  return new Promise((resolve, reject) => {

    try {

      const request =
        store(name).get(id);


      request.onsuccess = () => {
        resolve(request.result);
      };


      request.onerror = () => {

        reject(
          request.error ||
          new Error(
            "Kunde inte läsa posten."
          )
        );

      };

    } catch (error) {

      reject(error);

    }

  });

}


/* ---------------------------------------------------------
   Radera post
   --------------------------------------------------------- */

async function del(name, id) {

  for (let attempt = 0; attempt < 2; attempt++) {

    try {

      if (!db) {
        await openDB();
      }


      return await new Promise(
        (resolve, reject) => {

          try {

            const request =
              store(
                name,
                "readwrite"
              ).delete(id);


            request.onsuccess = () => {
              resolve(true);
            };


            request.onerror = () => {

              reject(
                request.error ||
                new Error(
                  "Kunde inte radera posten."
                )
              );

            };

          } catch (error) {

            reject(error);

          }

        }
      );

    } catch (error) {

      if (
        attempt === 0 &&
        /closing|closed|not open/i.test(
          String(error?.message || error)
        )
      ) {

        db = null;

        await openDB();

        continue;
      }

      throw error;
    }

  }

}


/* ---------------------------------------------------------
   Hämta bilder för en planta
   --------------------------------------------------------- */

function imgs(id) {

  return new Promise((resolve, reject) => {

    try {

      const request =
        store(IS)
          .index("plantId")
          .getAll(id);


      request.onsuccess = () => {
        resolve(request.result);
      };


      request.onerror = () => {

        reject(
          request.error ||
          new Error(
            "Kunde inte läsa bilder."
          )
        );

      };

    } catch (error) {

      reject(error);

    }

  });

}


/* ---------------------------------------------------------
   Datum / ålder
   --------------------------------------------------------- */

function ageDays(
  origin,
  date = new Date()
) {

  return Math.floor(
    (
      date -
      new Date(origin + "T00:00:00")
    ) / 86400000
  );

}


function age(
  origin,
  date = new Date()
) {

  const days =
    ageDays(origin, date);

  return days < 0
    ? "Inte ännu"
    : `Dag ${days}`;

}


/* ---------------------------------------------------------
   Escape HTML
   --------------------------------------------------------- */

function esc(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ---------------------------------------------------------
   Datumformat
   --------------------------------------------------------- */

function date(value) {

  return value
    ? new Date(
        value + "T00:00:00"
      ).toLocaleDateString(
        "sv-SE",
        {
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      )
    : "—";

}


/* ---------------------------------------------------------
   Datum + tid
   --------------------------------------------------------- */

function dt(value) {

  const d = new Date(value);

  return {

    d: d.toLocaleDateString(
      "sv-SE",
      {
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    ),

    t: d.toLocaleTimeString(
      "sv-SE",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )

  };

}


/* ---------------------------------------------------------
   Tidsskillnad
   --------------------------------------------------------- */

function diff(a, b) {

  const minutes =
    Math.floor(
      (new Date(b) - new Date(a)) /
      60000
    );

  const days =
    Math.floor(minutes / 1440);

  const hours =
    Math.floor(
      (minutes % 1440) / 60
    );

  const mins =
    minutes % 60;

  const parts = [];


  if (days) {
    parts.push(
      days +
      " " +
      (days === 1
        ? "dag"
        : "dagar")
    );
  }


  if (hours) {
    parts.push(
      hours +
      " " +
      (hours === 1
        ? "timme"
        : "timmar")
    );
  }


  if (!days && mins) {
    parts.push(
      mins + " min"
    );
  }


  return parts.length
    ? "+ " + parts.join(" ")
    : "";

}


/* ---------------------------------------------------------
   Generera nästa Albo-ID
   --------------------------------------------------------- */

async function idFor() {

  const plants =
    await all(PS);

  let number = 1;


  while (
    plants.some(
      plant =>
        plant.displayId ===
        "Albo #" +
        String(number)
          .padStart(3, "0")
    )
  ) {

    number++;

  }


  return (
    "Albo #" +
    String(number)
      .padStart(3, "0")
  );

}