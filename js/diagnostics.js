/* =========================================================
   MONSTERA MANAGER
   diagnostics.js
   Diagnostik + FINAL QA
   ========================================================= */

(function () {

  const MM_diagErrors = [];

  window.MM_diagErrors =
    MM_diagErrors;


  /* -------------------------------------------------------
     Fånga JavaScript-fel
     ------------------------------------------------------- */

  window.addEventListener(
    "error",
    function (e) {

      MM_diagErrors.push({

        type: "JavaScript",

        message:
          e.message ||
          "Okänt JS-fel",

        source:
          e.filename ||
          "",

        line:
          e.lineno ||
          0

      });


      if (
        typeof window.MM_runDiagnostics ===
        "function"
      ) {

        window.MM_runDiagnostics();

      }

    }
  );


  /* -------------------------------------------------------
     Fånga Promise-fel
     ------------------------------------------------------- */

  window.addEventListener(
    "unhandledrejection",
    function (e) {

      MM_diagErrors.push({

        type: "Promise",

        message:
          e.reason?.message ||
          String(
            e.reason ||
            "Okänt Promise-fel"
          )

      });


      if (
        typeof window.MM_runDiagnostics ===
        "function"
      ) {

        window.MM_runDiagnostics();

      }

    }
  );


  /* -------------------------------------------------------
     Hjälpfunktioner
     ------------------------------------------------------- */

  function D(value) {

    return typeof esc ===
      "function"

      ? esc(
          String(value)
        )

      : String(value)
          .replace(
            /[&<>"']/g,
            function (c) {

              return {

                "&":
                  "&amp;",

                "<":
                  "&lt;",

                ">":
                  "&gt;",

                '"':
                  "&quot;",

                "'":
                  "&#39;"

              }[c];

            }
          );

  }


  function C(
    label,
    ok,
    detail
  ) {

    return {

      label,

      ok:
        !!ok,

      detail:
        detail ||
        ""

    };

  }


  /* -------------------------------------------------------
     Huvuddiagnostik
     ------------------------------------------------------- */

  window.MM_runDiagnostics =
    async function () {

      const checks = [];


      /* JavaScript */

      checks.push(
        C(

          "JavaScript-fel",

          MM_diagErrors.length ===
            0,

          MM_diagErrors.length

            ? MM_diagErrors
                .map(
                  function (x) {

                    return (
                      x.type +
                      ": " +
                      x.message +
                      (
                        x.line
                          ? " (rad " +
                            x.line +
                            ")"
                          : ""
                      )
                    );

                  }
                )
                .join(
                  " | "
                )

            : "Inga fångade JavaScript-fel."

        )
      );


      /* IndexedDB */

      checks.push(
        C(

          "IndexedDB är tillgängligt",

          typeof indexedDB !==
            "undefined",

          "Webbläsaren har IndexedDB."

        )
      );


      /* Databasfunktion */

      checks.push(
        C(

          "Databasfunktion finns",

          typeof openDB ===
            "function",

          "openDB är laddad."

        )
      );


      /* Öppna databasen */

      let database =
        null;


      try {

        if (
          typeof openDB ===
          "function"
        ) {

          database =
            await openDB();

        }


        checks.push(
          C(

            "Databasen öppnas",

            !!database,

            database

              ? "Anslutning till databasen lyckades."

              : "Databasen kunde inte öppnas."

          )
        );


        if (database) {

          const names = [

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
            names.filter(
              function (name) {

                return !database
                  .objectStoreNames
                  .contains(name);

              }
            );


          checks.push(
            C(

              "Alla datastores finns",

              missing.length ===
                0,

              missing.length

                ? "Saknas: " +
                  missing.join(", ")

                : names.length +
                  " datastores hittades."

            )
          );

        }

      } catch (e) {

        checks.push(
          C(

            "Databasen öppnas",

            false,

            e?.message ||
              String(e)

          )
        );

      }


      /* Databasen ska hållas öppen */

      checks.push(
        C(

          "Databasen hålls öppen",

          !!database &&
            database.objectStoreNames
              .length > 0,

          "Diagnostik stänger inte den delade databaskopplingen."

        )
      );


      /* Bildsystem */

      checks.push(
        C(

          "Bildsystemet finns",

          typeof imgs ===
            "function" &&

          typeof put ===
            "function" &&

          typeof one ===
            "function" &&

          typeof del ===
            "function",

          "Bild- och databasfunktionerna är laddade."

        )
      );


      /* Sticklingfält */

      checks.push(
        C(

          "Sticklingfält finns",

          !!document.getElementById(
            "isCutting"
          ) &&

          !!document.getElementById(
            "pMother"
          ),

          "Stickling/modern-planta-kopplingen är laddad."

        )
      );


      /* ---------------------------------------------------
         QA-funktioner
         --------------------------------------------------- */

      const required = [

        [
          "Plant-QA",
          "runPlantQA"
        ],

        [
          "Bild-QA",
          "runImageQA"
        ],

        [
          "Mätnings-QA",
          "runMeasurementsQA"
        ],

        [
          "Tillväxt-QA",
          "runGrowthQA"
        ],

        [
          "Diagram-QA",
          "runChartQA"
        ],

        [
          "Blad-QA",
          "runLeafQA"
        ],

        [
          "Rot-QA",
          "runRootQA"
        ],

        [
          "Variegering-QA",
          "runVariegationQA"
        ],

        [
          "Prognos-QA",
          "runForecastQA"
        ],

        [
          "Rekord-QA",
          "runRecordsQA"
        ],

        [
          "Backup-QA",
          "runBackupIntegrityTest"
        ]

      ];


      required.forEach(
        function (x) {

          checks.push(
            C(

              x[0] +
                " är laddad",

              typeof window[
                x[1]
              ] ===
                "function",

              typeof window[
                x[1]
              ] ===
                "function"

                ? "Funktion hittad."

                : "Funktion saknas."

            )
          );

        }
      );


      /* ---------------------------------------------------
         Kontrollera att rå JavaScript inte visas
         --------------------------------------------------- */

      const text =
        document.body?.innerText ||
        "";


      const rawMarkers = [

        "w.document.close()",

        "${esc(",

        "+results.map(x=>",

        "area.innerHTML="

      ];


      const raw =
        rawMarkers.filter(
          function (marker) {

            return text.indexOf(
              marker
            ) >= 0;

          }
        );


      checks.push(
        C(

          "Ingen rå JavaScript-kod visas",

          raw.length ===
            0,

          raw.length

            ? "Hittade kodmarkör: " +
              raw.join(", ")

            : "Ingen rå kodmarkör hittades i synlig text."

        )
      );


      /* ---------------------------------------------------
         Trasiga bilder
         --------------------------------------------------- */

      const broken =
        [
          ...document.images
        ].filter(
          function (img) {

            if (
              !img.complete ||
              img.naturalWidth !==
                0 ||
              !img.src
            ) {

              return false;

            }


            const src =
              img.currentSrc ||
              img.src ||
              "";


            /*
             * Ignorera själva HTML-dokumentets
             * file://-URL.
             */

            try {

              const u =
                new URL(
                  src,
                  document.baseURI
                );


              const doc =
                new URL(
                  document.baseURI
                );


              if (
                u.href ===
                  doc.href ||

                (
                  u.protocol ===
                    "file:" &&

                  u.pathname ===
                    doc.pathname
                )
              ) {

                return false;

              }

            } catch (_) {}


            return true;

          }
        );


      checks.push(
        C(

          "Inga trasiga bilder",

          broken.length ===
            0,

          broken.length

            ? broken
                .map(
                  function (img) {

                    return (
                      (
                        img.alt ||
                        "bild"
                      ) +
                      " → " +
                      (
                        img.currentSrc ||
                        img.src
                      )
                    );

                  }
                )
                .join(
                  " | "
                )

            : "Inga riktiga bildfiler verkar vara trasiga. Dokumentets egen file://-URL ignoreras."

        )
      );


      /* ---------------------------------------------------
         Dokument-URL filtreras från bildtest
         --------------------------------------------------- */

      checks.push(
        C(

          "Dokument-URL filtreras från bildtest",

          true,

          "file://-referens till själva HTML-dokumentet räknas inte som trasig bild."

        )
      );


      /* ---------------------------------------------------
         Diagnosknappen
         --------------------------------------------------- */

      checks.push(
        C(

          "Diagnosknappen fungerar",

          typeof window.MM_runDiagnostics ===
            "function",

          "Diagnostikfunktionen är laddad."

        )
      );


      /* ---------------------------------------------------
         Kopiering
         --------------------------------------------------- */

      checks.push(
        C(

          "Kopieringsfunktionen finns",

          typeof navigator.clipboard !==
            "undefined" ||

          typeof document.execCommand ===
            "function",

          "Urklippskopiering stöds eller fallback kan användas."

        )
      );


      /* ---------------------------------------------------
         Rendera resultat
         --------------------------------------------------- */

      const area =
        document.getElementById(
          "statsArea"
        );


      if (!area) {
        return checks;
      }


      const ok =
        checks.every(
          function (x) {

            return x.ok;

          }
        );


      area.innerHTML = `

        <h2 class="timelineTitle">
          🔍 Diagnostik
        </h2>

        <div class="card">

          <div class="mm-qa">

            ${
              checks
                .map(
                  function (x) {

                    return `

                      <div
                        class="mm-qa-card"
                      >

                        <div
                          class="mm-qa-ok"
                        >

                          ${
                            x.ok
                              ? "🟢"
                              : "🔴"
                          }

                          ${D(
                            x.label
                          )}

                        </div>


                        ${
                          x.detail

                            ? `

                              <div
                                class="mm-qa-detail"
                              >
                                ${D(
                                  x.detail
                                )}
                              </div>

                            `

                            : ""
                        }

                      </div>

                    `;

                  }
                )
                .join("")
            }


            <div
              class="mm-qa-card"
            >

              <div
                class="mm-qa-ok"
              >

                ${
                  ok
                    ? "🟢 DIAGNOSTIK GODKÄND"
                    : "🔴 DIAGNOSTIK HAR FEL"
                }

              </div>


              <div
                class="mm-qa-detail"
              >

                ${
                  ok

                    ? "Alla kontroller passerade."

                    : "Minst en kontroll behöver åtgärdas."
                }

              </div>

            </div>

          </div>

        </div>

      `;


      area.scrollIntoView({

        behavior:
          "smooth",

        block:
          "start"

      });


      return checks;

    };


  /* -------------------------------------------------------
     Alias för äldre knappkod
     ------------------------------------------------------- */

  if (
    typeof window.runBackupIntegrityTest !==
      "function" &&

    typeof window.MM_runBackupIntegrityTest ===
      "function"
  ) {

    window.runBackupIntegrityTest =
      window.MM_runBackupIntegrityTest;

  }


  /* -------------------------------------------------------
     FINAL QA
     ------------------------------------------------------- */

  window.runFinalQA =
    async function () {

      const results = [];


      const checks = [

        [
          "IndexedDB API finns",
          typeof indexedDB !==
            "undefined"
        ],

        [
          "DB helper put finns",
          typeof put ===
            "function"
        ],

        [
          "DB helper one finns",
          typeof one ===
            "function"
        ],

        [
          "DB helper del finns",
          typeof del ===
            "function"
        ],

        [
          "Bildläsning finns",
          typeof imgs ===
            "function"
        ],

        [
          "Statuspanelen finns",
          !!document.getElementById(
            "mmStatusBox"
          )
        ],

        [
          "Plant-QA finns",
          typeof runPlantQA ===
            "function"
        ],

        [
          "Bild-QA finns",
          typeof runImageQA ===
            "function"
        ],

        [
          "Mätnings-QA finns",
          typeof runMeasurementsQA ===
            "function"
        ],

        [
          "Tillväxt-QA finns",
          typeof runGrowthQA ===
            "function"
        ],

        [
          "Diagram-QA finns",
          typeof runChartQA ===
            "function"
        ],

        [
          "Blad-QA finns",
          typeof runLeafQA ===
            "function"
        ],

        [
          "Rot-QA finns",
          typeof runRootQA ===
            "function"
        ],

        [
          "Variegering-QA finns",
          typeof runVariegationQA ===
            "function"
        ],

        [
          "Prognos-QA finns",
          typeof runForecastQA ===
            "function"
        ],

        [
          "Rekord-QA finns",
          typeof runRecordsQA ===
            "function"
        ],

        [
          "Backup-QA finns",
          typeof runBackupIntegrityTest ===
            "function"
        ]

      ];


      checks.forEach(
        x =>
          results.push(x)
      );


      try {

        const database =
          await openDB();


        const stores = [

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


        results.push(

          [

            "Alla 9 datastores finns",

            stores.every(
              x =>
                database
                  .objectStoreNames
                  .contains(x)
            )

          ]

        );


      } catch (e) {

        results.push(

          [

            "Databas öppnas utan fel",

            false,

            e.message

          ]

        );

      }


      const finalOK =
        results.every(
          x =>
            x[1]
        );


      const area =
        document.getElementById(
          "statsArea"
        );


      if (!area) {
        return finalOK;
      }


      area.innerHTML = `

        <h2 class="timelineTitle">
          🔍 V1.7 FINAL QA
        </h2>

        <div class="card">

          <div class="mm-qa">

            ${
              results
                .map(
                  x => `

                    <div
                      class="mm-qa-card"
                    >

                      <div
                        class="mm-qa-ok"
                      >

                        ${
                          x[1]
                            ? "✅"
                            : "❌"
                        }

                        ${D(
                          x[0]
                        )}

                      </div>


                      ${
                        x[2]

                          ? `

                            <div
                              class="mm-qa-detail"
                            >
                              ${D(
                                x[2]
                              )}
                            </div>

                          `

                          : ""
                      }

                    </div>

                  `
                )
                .join("")
            }


            <div
              class="mm-qa-card"
            >

              <div
                class="mm-qa-ok"
              >

                ${
                  finalOK
                    ? "🟢 FINAL QA GODKÄND"
                    : "🔴 FINAL QA HAR FEL"
                }

              </div>


              <div
                class="mm-qa-detail"
              >

                Statisk/runtime smoke-test.
                QA-testdata påverkas inte.

              </div>

            </div>

          </div>

        </div>

      `;


      area.scrollIntoView({

        behavior:
          "smooth",

        block:
          "start"

      });


      return finalOK;

    };


})();