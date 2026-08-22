/* =========================================================
   MONSTERA MANAGER
   modals.js
   Dokumentation, mätningar och radering
   ========================================================= */


/* ---------------------------------------------------------
   Fält för mätningar
   --------------------------------------------------------- */

function field(
  label,
  key,
  val = ""
) {

  return `
    <div class="field">

      <label>
        ${label}
      </label>

      <input
        id="m_${key}"
        type="number"
        step="0.1"
        min="0"
        value="${esc(val)}"
        placeholder="Valfritt"
      >

    </div>
  `;

}


/* ---------------------------------------------------------
   Dokumentationsformulär
   --------------------------------------------------------- */

function documentationForm(
  existing = {}
) {

  return new Promise(
    resolve => {

      const bg =
        document.createElement(
          "div"
        );


      bg.className =
        "modalBg open";


      bg.innerHTML = `

        <div class="modal">

          <div class="modalHead">

            <h2>
              📸 Ny dokumentation
            </h2>

            <button
              type="button"
              class="close"
              id="docClose"
            >
              ×
            </button>

          </div>


          <div class="field">

            <label>
              Anteckning (valfritt)
            </label>

            <textarea
              id="docNote"
              placeholder="T.ex. ny rot, nytt blad, ändrad färg..."
            ></textarea>

          </div>


          <h3
            style="
              margin:8px 0 10px
            "
          >
            📏 Mätningar
            <span class="muted">
              (valfria)
            </span>
          </h3>


          ${field(
            "Höjd (cm)",
            "height",
            existing.measurements?.height
          )}


          ${field(
            "Antal blad",
            "leaves",
            existing.measurements?.leaves
          )}


          ${field(
            "Antal rötter",
            "roots",
            existing.measurements?.roots
          )}


          ${field(
            "Längsta rot (cm)",
            "longestRoot",
            existing.measurements?.longestRoot
          )}


          ${field(
            "Bladstorlek (cm)",
            "leafSize",
            existing.measurements?.leafSize
          )}


          <button
            class="save"
            id="measurementSave"
            type="button"
          >
            💾 Spara dokumentation
          </button>

        </div>

      `;


      document.body.appendChild(
        bg
      );


      /*
       * Fyll i befintlig anteckning
       * när vi redigerar.
       */

      const note =
        bg.querySelector(
          "#docNote"
        );


      if (note) {

        note.value =
          existing.note ||
          "";

      }


      /*
       * Stäng utan att spara.
       */

      bg.querySelector(
        "#docClose"
      ).onclick = () => {

        bg.remove();

        resolve(null);

      };


      /*
       * Spara.
       */

      bg.querySelector(
        "#measurementSave"
      ).onclick = () => {

        const measurements =
          {};


        [
          "height",
          "leaves",
          "roots",
          "longestRoot",
          "leafSize"
        ].forEach(
          key => {

            const input =
              bg.querySelector(
                "#m_" + key
              );


            measurements[key] =
              input
                ?.value
                .trim() ||
              "";

          }
        );


        const data = {

          note:
            note
              ?.value
              .trim() ||
            "",

          measurements

        };


        bg.remove();

        resolve(
          data
        );

      };

    }
  );

}


/* ---------------------------------------------------------
   Redigera dokumentation
   --------------------------------------------------------- */

async function editDoc(
  id
) {

  const im =
    await imgs(
      current
    );


  const x =
    im.find(
      v =>
        v.id === id
    );


  if (!x) {
    return;
  }


  const data =
    await documentationForm({

      note:
        x.note ||
        "",

      measurements:
        x.measurements ||
        {}

    });


  if (!data) {
    return;
  }


  x.note =
    data.note;


  x.measurements =
    data.measurements;


  await put(
    IS,
    x
  );


  await renderDetail();

}


/* ---------------------------------------------------------
   Ta bort dokumentation
   --------------------------------------------------------- */

async function removeDoc(
  id
) {

  /*
   * Behåller den befintliga
   * bekräftelsen från senaste
   * fungerande versionen.
   */

  if (
    !confirm(
      "Ta bort den här dokumentationen?"
    )
  ) {

    return;

  }


  await del(
    IS,
    id
  );


  await renderDetail();

  await renderHome();

}


/* ---------------------------------------------------------
   Ta bort planta
   --------------------------------------------------------- */

async function removePlant() {

  const id =
    current;


  const p =
    await one(
      PS,
      id
    );


  if (!p) {
    return;
  }


  /*
   * Egen bekräftelseruta i stället
   * för window.confirm().
   *
   * Detta var den fix vi lade till
   * eftersom confirm() kunde bete sig
   * opålitligt när HTML-filen kördes
   * som external-file på iPhone/iPad.
   */

  const bg =
    document.createElement(
      "div"
    );


  bg.className =
    "modalBg open";


  bg.style.zIndex =
    "9999";


  bg.innerHTML = `

    <div
      class="modal"
      style="
        padding-bottom:24px
      "
    >

      <div
        class="modalHead"
      >

        <h2>
          🗑️ Ta bort planta?
        </h2>

        <button
          type="button"
          class="close"
          id="cancelDelete"
        >
          ×
        </button>

      </div>


      <p
        style="
          font-size:15px;
          line-height:1.5;
          margin:0 0 8px
        "
      >

        <b>
          ${esc(
            p.name ||
            "Namnlös planta"
          )}
        </b>

      </p>


      <p
        class="muted"
        style="
          line-height:1.5;
          margin-bottom:18px
        "
      >
        Plantan och all tillhörande
        dokumentation kommer att tas bort.
        Detta går inte att ångra.
      </p>


      <div
        style="
          display:grid;
          grid-template-columns:
            1fr 1fr;
          gap:10px
        "
      >

        <button
          type="button"
          class="small"
          id="cancelDelete2"
        >
          Avbryt
        </button>


        <button
          type="button"
          class="deletePlant"
          id="confirmDelete"
          style="
            margin:0;
            width:100%;
          "
        >
          🗑️ Ta bort
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    bg
  );


  const close =
    () => {

      bg.remove();

    };


  bg.querySelector(
    "#cancelDelete"
  ).onclick =
    close;


  bg.querySelector(
    "#cancelDelete2"
  ).onclick =
    close;


  /*
   * Klick utanför modalen =
   * avbryt.
   */

  bg.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        bg
      ) {

        close();

      }

    }
  );


  /*
   * Definitiv radering.
   */

  bg.querySelector(
    "#confirmDelete"
  ).onclick =
    async () => {

      const button =
        bg.querySelector(
          "#confirmDelete"
        );


      button.disabled =
        true;


      button.textContent =
        "Tar bort…";


      try {

        /*
         * Ta bort alla bilder
         * som tillhör plantan.
         */

        const images =
          await imgs(
            id
          );


        for (
          const image
          of images
        ) {

          await del(
            IS,
            image.id
          );

        }


        /*
         * Ta bort relaterade
         * miljöloggar / händelser
         * där plantId finns.
         */

        for (
          const storeName
          of [
            "envLogs",
            "waterLogs",
            "tempLogs",
            "humidityLogs",
            "lightLogs",
            "substrateLogs"
          ]
        ) {

          try {

            const rows =
              await all(
                storeName
              );


            for (
              const row
              of rows
            ) {

              if (
                row.plantId ===
                id
              ) {

                await del(
                  storeName,
                  row.id
                );

              }

            }

          } catch (error) {

            /*
             * Saknad/otillgänglig
             * log-store ska inte
             * stoppa raderingen
             * av själva plantan.
             */

            console.warn(
              "Kunde inte rensa",
              storeName,
              error
            );

          }

        }


        /*
         * Ta bort själva plantan.
         */

        await del(
          PS,
          id
        );


        close();


        /*
         * Tillbaka till startsidan.
         */

        current =
          null;


        $("detail")
          ?.classList
          .remove(
            "active"
          );


        if ($("home")) {

          $("home")
            .style
            .display =
            "block";

        }


        await renderHome();

        await renderDashboard();


      } catch (error) {

        console.error(
          error
        );


        button.disabled =
          false;


        button.textContent =
          "🗑️ Ta bort";


        alert(
          "❌ Kunde inte ta bort plantan.\n\n" +
          (
            error?.message ||
            "Okänt fel."
          )
        );

      }

    };

}


/* ---------------------------------------------------------
   Gör funktionerna globala
   --------------------------------------------------------- */

window.documentationForm =
  documentationForm;


window.editDoc =
  editDoc;


window.removeDoc =
  removeDoc;


window.removePlant =
  removePlant;