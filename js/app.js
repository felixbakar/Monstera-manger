document.addEventListener(
  "DOMContentLoaded",
  async()=>{

    try{

      await openDB();

      $("addPlantBtn").onclick=
        ()=>showPlantModal();

      $("plantSearch").oninput=
        renderHome;

      $("plantFilter").onchange=
        renderHome;

      $("toolsBtn").onclick=
        ()=>showModal(
          "⚙️ Verktyg",
          `
<div class="tools">

  <button
    class="small-btn"
    onclick="exportBackup()"
  >
    💾 Exportera backup
  </button>

  <button
    class="small-btn"
    onclick="importBackup()"
  >
    📥 Importera backup
  </button>

  <button
    class="small-btn"
    onclick="runDiagnostics()"
  >
    🧪 Diagnostik
  </button>

  <button
    class="small-btn"
    onclick="closeModal()"
  >
    Stäng
  </button>

</div>

<p class="muted">
  Ingen API-nyckel ligger i denna version.
</p>
`
        );

      await renderHome();

      await renderDashboard();

    }catch(e){

      document.body.insertAdjacentHTML(
        "beforeend",
        `
<div
  class="card"
  style="margin:12px;color:#a32018"
>
  ❌ ${esc(e.message)}
</div>
`
      );

    }

  }
);