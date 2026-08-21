async function runDiagnostics(){

  const c=[];

  const add=(l,o)=>
    c.push(`
<div class="qa">

  <span>
    ${o?"🟢":"🔴"} ${l}
  </span>

  <b>
    ${o?"OK":"FEL"}
  </b>

</div>
`);

  add(
    "IndexedDB finns",
    typeof indexedDB!=="undefined"
  );

  try{

    const d=await openDB();

    add(
      "Databasen öppnas",
      !!d
    );

    add(
      "Plant-store finns",
      d.objectStoreNames.contains(PS)
    );

    add(
      "Bild-store finns",
      d.objectStoreNames.contains(IS)
    );

  }catch(e){

    add(
      "Databasen öppnas",
      false
    );

  }

  add(
    "Plantlogik laddad",
    typeof nextPlantName==="function"
  );

  add(
    "Backup laddad",
    typeof makeBackup==="function"
  );

  $("statsArea").innerHTML=`

<div class="card">

  <h2>🧪 Diagnostik</h2>

  ${c.join("")}

  <p class="muted">
    Diagnostiken ändrar inte dina riktiga plantor.
  </p>

</div>

`;

}