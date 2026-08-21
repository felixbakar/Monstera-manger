function showModal(title,body){

  $("modalRoot").innerHTML=`

<div class="modalBg open">

  <div class="modal">

    <div class="modalHead">

      <h2>${title}</h2>

      <button
        class="close"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>

    ${body}

  </div>

</div>

`;

}

function closeModal(){

  $("modalRoot").innerHTML="";

}

async function showPlantModal(existing=null){

  const variant=
    existing?.variant||
    "Monstera deliciosa";

  showModal(
    existing
      ?"✏️ Redigera planta"
      :"🌱 Lägg till planta",

`
<form id="plantForm">

<div class="field">

  <label>Namn</label>

  <input
    id="pName"
    value="${esc(existing?.name||"")}"
  >

</div>

<div class="field">

  <label>Kategori</label>

  <select id="pCategory">

    <option>Monstera</option>
    <option>Fikus</option>
    <option>Övriga</option>

  </select>

</div>

<div
  id="variantWrap"
  class="field"
>

  <label>Variant</label>

  <select id="pVariant">

    ${
      MONSTERA_VARIANTS.map(
        x=>`
<option
  ${x===variant?"selected":""}
>
  ${x}
</option>
`
      ).join("")
    }

  </select>

  <small class="muted">
    Lämna namnet tomt för automatiskt
    M1/M2 eller S1/S2.
  </small>

</div>

<div class="field">

  <label>Ursprungsdatum</label>

  <input
    id="pOrigin"
    type="date"
    required
    value="${
      existing?.originDate||
      new Date()
        .toISOString()
        .slice(0,10)
    }"
  >

</div>

<div class="field">

  <label>Inköpsdatum</label>

  <input
    id="pPurchase"
    type="date"
    value="${existing?.purchaseDate||""}"
  >

</div>

<div class="cuttings">

<label>

  <input
    id="isCutting"
    type="checkbox"
    ${existing?.isCutting?"checked":""}
  >

  🌱 Det här är en stickling

</label>

<div
  id="motherWrap"
  class="mother"
>

  <div class="field">

    <label>Moderplanta</label>

    <select id="pMother"></select>

  </div>

</div>

</div>

<div class="field">

  <label>Beskrivning</label>

  <textarea id="pDesc">${
    esc(existing?.description||"")
  }</textarea>

</div>

<button
  class="primary"
  type="submit"
>
  💾 ${
    existing
    ?"Spara ändringar"
    :"Spara planta"
  }
</button>

</form>
`
  );

  await populateMotherPlants();

  if(existing?.motherPlantId)
    $("pMother").value=
      existing.motherPlantId;

  $("isCutting").onchange=
    toggleCutting;

  toggleCutting();

  $("pCategory").onchange=()=>{

    $("variantWrap").style.display=
      $("pCategory").value==="Monstera"
      ?"block"
      :"none";

  };

  $("pCategory").onchange();

  $("plantForm").onsubmit=
    async e=>{

      e.preventDefault();

      const cat=
        $("pCategory").value;

      const cut=
        $("isCutting").checked;

      const v=
        cat==="Monstera"
        ?$("pVariant").value
        :null;

      let name=
        $("pName").value.trim();

      if(
        cat==="Monstera" &&
        !name
      )
        name=
          await nextPlantName(
            v,
            cut
          );

      if(
        cut &&
        !$("pMother").value
      ){

        alert(
          "Välj moderplanta."
        );

        return;

      }

      const x={
        name,
        category:cat,
        variant:v,
        originDate:$("pOrigin").value,
        purchaseDate:$("pPurchase").value,
        description:$("pDesc").value,
        isCutting:cut,
        motherPlantId:
          cut
          ?$("pMother").value
          :null
      };

      if(existing)
        await updatePlant(
          existing.id,
          x
        );
      else
        await createPlant(x);

      closeModal();

      await renderHome();

      await renderDashboard();

      if(existing)
        openDetail(existing.id);

    };

}