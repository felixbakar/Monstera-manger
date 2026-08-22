/* =========================================================
   MONSTERA MANAGER
   backup.js
   Backup / restore / kompatibilitet
   ========================================================= */

window.MM_BACKUP_VERSION = "1.7";

window.MM_BACKUP_STORES = [
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


/* ---------------------------------------------------------
   Blob → Base64
   --------------------------------------------------------- */

async function blobToBase64(blob) {

  if (!blob) return null;

  const buffer =
    await blob.arrayBuffer();

  const bytes =
    new Uint8Array(buffer);

  let binary = "";

  for (
    let i = 0;
    i < bytes.length;
    i += 0x8000
  ) {

    binary += String.fromCharCode(
      ...bytes.subarray(
        i,
        i + 0x8000
      )
    );

  }

  return btoa(binary);

}


/* ---------------------------------------------------------
   Base64 → Blob
   --------------------------------------------------------- */

function base64ToBlob(
  base64,
  type = "application/octet-stream"
) {

  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }

  return new Blob(
    [bytes],
    { type }
  );

}


/* ---------------------------------------------------------
   Skapa komplett backup
   --------------------------------------------------------- */

window.MM_makeBackupPayload =
  async function () {

    const payload = {

      app: "Monstera Manager",

      version:
        MM_BACKUP_VERSION,

      createdAt:
        new Date().toISOString(),

      data: {}

    };


    /* Hämta alla datastores */

    for (
      const name
      of MM_BACKUP_STORES
    ) {

      payload.data[name] =
        await all(name);

    }


    /* Bilder måste konverteras
       eftersom IndexedDB lagrar
       dem som Blob */

    payload.data[IS] =
      await Promise.all(

        payload.data[IS].map(
          async image => {

            const copy =
              { ...image };


            if (
              copy.blob
              instanceof Blob
            ) {

              copy.blobBase64 =
                await blobToBase64(
                  copy.blob
                );

              copy.blobType =
                copy.blob.type ||
                "image/jpeg";

              delete copy.blob;

            }


            return copy;

          }
        )

      );


    return payload;

  };


/* ---------------------------------------------------------
   Kontrollera backup
   --------------------------------------------------------- */

window.MM_validateBackup =
  function (data) {

    if (
      !data ||
      data.app !==
        "Monstera Manager" ||
      !data.data ||
      !Array.isArray(
        data.data[PS]
      ) ||
      !Array.isArray(
        data.data[IS]
      )
    ) {

      return false;

    }


    /*
      Äldre backups kan sakna
      datastores som introducerats
      senare.
    */

    for (
      const name
      of MM_BACKUP_STORES
    ) {

      if (
        data.data[name] !==
          undefined &&
        !Array.isArray(
          data.data[name]
        )
      ) {

        return false;

      }

    }


    return true;

  };


/* ---------------------------------------------------------
   Återställ backup
   --------------------------------------------------------- */

window.MM_restoreBackup =
  async function (data) {

    if (
      !MM_validateBackup(data)
    ) {

      throw new Error(
        "Ogiltig backup"
      );

    }


    /*
      Restore = ersätt databasen.
      Vi mergar alltså inte gammal
      och ny data.
    */

    for (
      const name
      of MM_BACKUP_STORES
    ) {

      const rows =
        Array.isArray(
          data.data[name]
        )
          ? data.data[name]
          : [];


      /* Radera befintlig data */

      const existing =
        await all(name);


      for (
        const row
        of existing
      ) {

        await del(
          name,
          row.id
        );

      }


      /* Lägg tillbaka backupdata */

      for (
        const row
        of rows
      ) {

        const copy =
          { ...row };


        /* Återskapa bild-Blob */

        if (
          name === IS &&
          copy.blobBase64
        ) {

          copy.blob =
            base64ToBlob(
              copy.blobBase64,
              copy.blobType ||
                "image/jpeg"
            );

          delete copy.blobBase64;
          delete copy.blobType;

        }


        await put(
          name,
          copy
        );

      }

    }

  };


/* ---------------------------------------------------------
   Exportera backup till JSON-fil
   --------------------------------------------------------- */

async function exportBackup() {

  try {

    const payload =
      await MM_makeBackupPayload();


    const blob =
      new Blob(
        [
          JSON.stringify(
            payload
          )
        ],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `monstera-manager-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;


    link.click();


    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );


    alert(
      "✅ Komplett backup exporterad."
    );

  } catch (error) {

    console.error(error);

    alert(
      "❌ Kunde inte exportera backupen."
    );

  }

}


/* ---------------------------------------------------------
   Importera backup
   --------------------------------------------------------- */

function setupBackupImport() {

  const input =
    $("backupInput");


  if (!input) return;


  input.onchange =
    async event => {

      const file =
        event.target.files[0];


      if (!file) return;


      try {

        const data =
          JSON.parse(
            await file.text()
          );


        if (
          !MM_validateBackup(
            data
          )
        ) {

          throw new Error(
            "Ogiltig backup"
          );

        }


        const plantCount =
          data.data[PS].length;


        const imageCount =
          data.data[IS].length;


        const confirmed =
          confirm(
            `Importera komplett backup?\n\n` +
            `${plantCount} plantor\n` +
            `${imageCount} bilder\n\n` +
            `Nuvarande data kommer att ersättas.`
          );


        if (!confirmed) {

          input.value = "";

          return;

        }


        await MM_restoreBackup(
          data
        );


        /*
          Uppdatera gränssnittet
          efter restore.
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
          typeof renderReminderSummary ===
          "function"
        ) {

          await renderReminderSummary();

        }


        alert(
          "✅ Komplett backup importerad."
        );


      } catch (error) {

        console.error(error);

        alert(
          "❌ Kunde inte importera backupen.\n\n" +
          "Kontrollera att filen kommer från Monstera Manager."
        );

      }


      input.value = "";

    };

}


/* ---------------------------------------------------------
   Kontrollera backupfil
   --------------------------------------------------------- */

async function verifyBackupFile() {

  const input =
    document.createElement(
      "input"
    );


  input.type = "file";

  input.accept =
    ".json,application/json";


  input.onchange =
    async () => {

      const file =
        input.files[0];


      if (!file) return;


      try {

        const data =
          JSON.parse(
            await file.text()
          );


        if (
          MM_validateBackup(
            data
          )
        ) {

          const d =
            data.data;


          const environmentLogs =
            (
              d.envLogs || []
            ).length +
            (
              d.tempLogs || []
            ).length +
            (
              d.humidityLogs || []
            ).length +
            (
              d.lightLogs || []
            ).length;


          alert(
            `✅ Backup OK\n\n` +
            `Version: ${data.version || "äldre"}\n` +
            `Plantor: ${d.plants.length}\n` +
            `Bilder: ${d.images.length}\n` +
            `Miljöloggar: ${environmentLogs}\n` +
            `Händelser: ${(d.events || []).length}`
          );

        } else {

          alert(
            "❌ Filen ser inte ut som en giltig Monstera Manager-backup."
          );

        }


      } catch (error) {

        console.error(error);

        alert(
          "❌ Kunde inte läsa backupfilen."
        );

      }

    };


  input.click();

}


/* ---------------------------------------------------------
   Äldre backup-kompatibilitet
   --------------------------------------------------------- */

async function runLegacyBackupCompatibilityTest() {

  const legacy = {

    app:
      "Monstera Manager",

    version:
      "1.5",

    createdAt:
      new Date().toISOString(),

    data: {

      plants: [],

      images: []

    }

  };


  const valid =
    MM_validateBackup(
      legacy
    );


  const area =
    $("statsArea");


  if (!area) return;


  area.innerHTML = `

    <h2 class="timelineTitle">
      🧪 Äldre backup-kompatibilitet
    </h2>

    <div class="card">

      <div class="mm-dbtest-row">

        <span>
          V1.5-liknande backup utan nya stores
        </span>

        <span class="${
          valid
            ? "mm-dbtest-ok"
            : "mm-dbtest-bad"
        }">

          ${
            valid
              ? "✅ PASS"
              : "❌ FAIL"
          }

        </span>

      </div>


      <div class="mm-dbtest-note">

        ${
          valid
            ? "Äldre backups accepteras och saknade nya datastores behandlas som tomma."
            : "Äldre backups avvisas fortfarande."
        }

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* ---------------------------------------------------------
   Initiera backup-input
   --------------------------------------------------------- */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    setupBackupImport
  );

} else {

  setupBackupImport();

}