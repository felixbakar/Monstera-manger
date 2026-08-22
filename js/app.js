/* =========================================================
   MONSTERA MANAGER
   app.js
   App-initiering, navigation och gemensam app-logik
   ========================================================= */


/* ---------------------------------------------------------
   Globalt valt plant-ID
   --------------------------------------------------------- */

window.current =
  window.current || null;


/* ---------------------------------------------------------
   Starta appen
   --------------------------------------------------------- */

async function initApp() {

  try {

    await openDB();


    /*
     * Kontrollera att databasen verkligen
     * innehåller de stores som appen behöver.
     */

    const requiredStores = [
      PS,
      IS,
      "envLogs",
      "waterLogs",
      "tempLogs",
      "humidityLogs",
      "lightLogs",
      "substrateLogs",
      "events"
    ];


    const missing =
      requiredStores.filter(
        name =>
          !db.objectStoreNames.contains(
            name
          )
      );


    if (missing.length) {

      console.warn(
        "Saknade datastores:",
        missing
      );

    }


    /*
     * Första renderingen.
     */

    if (
      typeof renderHome ===
      "function"
    ) {

      await renderHome();

    }


    if (
      typeof renderDashboard ===
      "function"
    ) {

      await renderDashboard();

    }


    if (
      typeof checkReminders ===
      "function"
    ) {

      await checkReminders();

    }


    /*
     * Backup-import.
     */

    if (
      typeof setupBackupImport ===
      "function"
    ) {

      setupBackupImport();

    }


    /*
     * Starta eventuell diagnostik
     * efter att resten av appen
     * laddats.
     */

    if (
      typeof initDiagnostics ===
      "function"
    ) {

      try {

        await initDiagnostics();

      } catch (error) {

        console.warn(
          "Diagnostik kunde inte startas:",
          error
        );

      }

    }


  } catch (error) {

    console.error(
      "Monstera Manager kunde inte startas:",
      error
    );


    const plants =
      document.getElementById(
        "plants"
      );


    if (plants) {

      plants.innerHTML = `

        <div class="card">

          <h3>
            ⚠️ Kunde inte starta appen
          </h3>

          <p class="muted">
            Databasen kunde inte öppnas.
          </p>

          <p class="muted">
            ${esc(
              error?.message ||
              "Okänt fel."
            )}
          </p>

          <button
            class="save"
            onclick="location.reload()"
          >
            🔄 Försök igen
          </button>

        </div>

      `;

    }

  }

}


/* ---------------------------------------------------------
   Navigering
   --------------------------------------------------------- */

function showHome() {

  current =
    null;


  const home =
    document.getElementById(
      "home"
    );


  const detail =
    document.getElementById(
      "detail"
    );


  if (detail) {

    detail.classList.remove(
      "active"
    );

  }


  if (home) {

    home.style.display =
      "block";

  }


  renderHome();

}


window.showHome =
  showHome;


/* ---------------------------------------------------------
   Öppna dashboard
   --------------------------------------------------------- */

async function showDashboard() {

  const home =
    document.getElementById(
      "home"
    );


  const detail =
    document.getElementById(
      "detail"
    );


  const dashboard =
    document.getElementById(
      "dashboard"
    );


  if (home) {

    home.style.display =
      "none";

  }


  if (detail) {

    detail.classList.remove(
      "active"
    );

  }


  if (dashboard) {

    dashboard.classList.add(
      "active"
    );

  }


  if (
    typeof renderDashboard ===
    "function"
  ) {

    await renderDashboard();

  }

}


window.showDashboard =
  showDashboard;


/* ---------------------------------------------------------
   Stäng dashboard
   --------------------------------------------------------- */

function closeDashboard() {

  const dashboard =
    document.getElementById(
      "dashboard"
    );


  if (dashboard) {

    dashboard.classList.remove(
      "active"
    );

  }


  showHome();

}


window.closeDashboard =
  closeDashboard;


/* ---------------------------------------------------------
   Öppna plantsidan
   --------------------------------------------------------- */

async function showPlantDetail(
  id
) {

  current =
    id;


  const home =
    document.getElementById(
      "home"
    );


  if (home) {

    home.style.display =
      "none";

  }


  const detail =
    document.getElementById(
      "detail"
    );


  if (detail) {

    detail.classList.add(
      "active"
    );

  }


  if (
    typeof renderDetail ===
    "function"
  ) {

    await renderDetail();

  }

}


window.showPlantDetail =
  showPlantDetail;


/* ---------------------------------------------------------
   Enkel debounce
   --------------------------------------------------------- */

function debounce(
  fn,
  delay = 250
) {

  let timer = null;


  return function (...args) {

    clearTimeout(timer);


    timer =
      setTimeout(
        () =>
          fn.apply(
            this,
            args
          ),
        delay
      );

  };

}


window.debounce =
  debounce;


/* ---------------------------------------------------------
   Bild-URL cleanup
   --------------------------------------------------------- */

window.MM_revokeObjectURL =
  function (url) {

    if (
      typeof url ===
      "string" &&
      url.startsWith(
        "blob:"
      )
    ) {

      try {

        URL.revokeObjectURL(
          url
        );

      } catch (_) {}

    }

  };


/* ---------------------------------------------------------
   Start
   --------------------------------------------------------- */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initApp,
    {
      once: true
    }
  );

} else {

  initApp();

}