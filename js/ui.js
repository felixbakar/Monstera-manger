let current=null;

async function renderHome(){

  const p=await all(PS);
  const im=await all(IS);

  const q=(
    $("plantSearch").value||""
  ).toLowerCase();

  const f=$("plantFilter").value;

  $("plantCount").textContent=p.length;

  $("imageCount").textContent=im.length;

  $("favoriteCount").textContent=
    p.filter(x=>x.favorite).length;

  const a=[];

  for(const x of p){

    const pics=await imgs(x.id);

    if(
      q &&
      !(
        (x.name+" "+x.displayId)
          .toLowerCase()
          .includes(q)
      )
    )
      continue;

    if(f==="favorites"&&!x.favorite)
      continue;

    if(f==="documented"&&!pics.length)
      continue;

    if(f==="never"&&pics.length)
      continue;

    if(f==="archived"&&!x.archived)
      continue;

    a.push({
      ...x,
      pics,
      last:pics.sort(
        (u,v)=>
          new Date(v.createdAt)-
          new Date(u.createdAt)
      )[0]
    });

  }

  if(!a.length){

    $("plants").innerHTML=
      '<div class="card empty">'+
      'Inga plantor matchar.'+
      '</div>';

    return;

  }

  const cats=[
    "Monstera",
    "Fikus",
    "Övriga",
    ...[
      ...new Set(
        a.map(x=>x.category)
      )
    ].filter(
      x=>![
        "Monstera",
        "Fikus",
        "Övriga"
      ].includes(x)
    )
  ];

  $("plants").innerHTML=
    cats.map(c=>{

      const xs=a.filter(
        x=>x.category===c
      );

      if(!xs.length)
        return "";

      return `
<section class="categoryGroup">

  <div class="categoryHead">

    <div class="categoryTitle">
      ${
        c==="Monstera"
        ?"🌿"
        :c==="Övriga"
        ?"🪴"
        :"🌿"
      }
      ${esc(c)}
    </div>

    <span class="count">
      ${xs.length}
      ${xs.length===1?"planta":"plantor"}
    </span>

  </div>

  ${
    xs.length>1
    ?'<div class="hint">Svep åt sidan för att se fler →</div>'
    :""
  }

  <div class="plantCarousel">

    ${xs.map(x=>`

<article
  class="plant"
  onclick="openDetail('${x.id}')"
>

  <div class="plantIcon">

    ${
      x.last?.blob
      ? `<img src="${URL.createObjectURL(x.last.blob)}">`
      : "🌱"
    }

  </div>

  <div class="plantInfo">

    <h3>${esc(x.name)}</h3>

    <div class="muted">
      ${esc(x.displayId)}
      ${x.variant
        ?" · "+esc(x.variant)
        :""
      }
    </div>

    <div class="muted">
      🌱 ${age(x.originDate)}
      · 📸 ${x.pics.length}
    </div>

    ${
      x.isCutting
      ?'<span class="pill">🌱 Stickling</span>'
      :""
    }

  </div>

  <div class="arrow">
    ›
  </div>

</article>

`).join("")}

  </div>

</section>
`;

    }).join("");

}

async function renderDashboard(){

  const p=await all(PS);

  const cost=p.reduce(
    (s,x)=>
      s+
      (x.economy?.costs||[])
        .reduce(
          (a,y)=>
            a+Number(y.amount||0),
          0
        ),
    0
  );

  const sales=p.reduce(
    (s,x)=>
      s+
      (x.economy?.sales||[])
        .reduce(
          (a,y)=>
            a+Number(y.amount||0),
          0
        ),
    0
  );

  $("projectDashboard").innerHTML=`

<div class="card">

  <h3>📊 Översikt</h3>

  <div class="stats">

    <div>
      🌱
      <b>${p.filter(x=>!x.archived).length}</b>
      <small>Aktiva</small>
    </div>

    <div>
      💰
      <b>${cost.toFixed(0)} kr</b>
      <small>Investerat</small>
    </div>

    <div>
      📈
      <b>
        ${
          sales-cost>=0
          ?"+"
          :""
        }${(sales-cost).toFixed(0)} kr
      </b>
      <small>Resultat</small>
    </div>

  </div>

</div>

`;

}

async function openDetail(id){

  current=id;

  const p=await one(PS,id);

  const pics=(await imgs(id))
    .sort(
      (a,b)=>
        new Date(b.createdAt)-
        new Date(a.createdAt)
    );

  const m=pics[0]?.measurements||{};

  $("statsArea").innerHTML=`

<div class="card">

  <div>

    <h2>${esc(p.name)}</h2>

    <div class="muted">

      ${esc(p.displayId)}
      ·
      ${esc(p.category)}

      ${
        p.variant
        ?" · "+esc(p.variant)
        :""
      }

    </div>

  </div>

  <div class="infoRow">
    <span>Ursprungsdatum</span>
    <b>${fmt(p.originDate)}</b>
  </div>

  <div class="infoRow">
    <span>Inköpsdatum</span>
    <b>${fmt(p.purchaseDate)}</b>
  </div>

  <div class="infoRow">
    <span>Ålder</span>
    <b>${age(p.originDate)}</b>
  </div>

  <div class="measureGrid">

    ${
      [
        ["📏 Höjd","height","cm"],
        ["🍃 Blad","leaves","st"],
        ["🌱 Rötter","roots","st"],
        ["🤍 Variegering","variegation","%"]
      ]
      .map(x=>`

<div class="measure">

  <small>${x[0]}</small>

  <b>
    ${m[x[1]]??"—"} ${x[2]}
  </b>

</div>

`)
      .join("")
    }

  </div>

  <div class="action-row">

    <button
      class="small-btn"
      onclick="addDocumentation('${id}')"
    >
      📸 Dokumentera
    </button>

    <button
      class="small-btn"
      onclick="showGrowth('${id}')"
    >
      📈 Tillväxt
    </button>

    <button
      class="small-btn"
      onclick="showForecast('${id}')"
    >
      🔮 Prognos
    </button>

    <button
      class="small-btn"
      onclick="showRecords('${id}')"
    >
      🏆 Rekord
    </button>

    <button
      class="small-btn"
      onclick="showPlantModal(await one(PS,'${id}'))"
    >
      ✏️ Redigera
    </button>

    <button
      class="small-btn danger"
      onclick="deletePlant('${id}')"
    >
      🗑️ Radera
    </button>

  </div>

  <h3>
    📸 Dokumentationer (${pics.length})
  </h3>

  ${
    pics.map(x=>`

<div class="infoRow">

  <span>
    ${
      new Date(x.createdAt)
        .toLocaleDateString("sv-SE")
    }
  </span>

  <b>
    ${x.measurements?.height??"—"} cm
    ·
    ${x.measurements?.leaves??"—"} blad
  </b>

</div>

`).join("")
    ||
    '<div class="muted">Ingen dokumentation.</div>'
  }

  <button
    class="small-btn"
    style="margin-top:12px"
    onclick="goHome()"
  >
    ← Tillbaka
  </button>

</div>

`;

  $("statsArea")
    .scrollIntoView({
      behavior:"smooth"
    });

}

function goHome(){

  current=null;

  $("statsArea").innerHTML="";

  renderHome();

  renderDashboard();

  scrollTo({
    top:0,
    behavior:"smooth"
  });

}

async function deletePlant(id){

  if(
    !confirm(
      "Radera plantan och dess dokumentation?"
    )
  )
    return;

  for(
    const x of await imgs(id)
  )
    await del(IS,x.id);

  await del(PS,id);

  goHome();

}

function pickImage(){

  return new Promise(r=>{

    const i=$("photoInput");

    i.value="";

    i.onchange=()=>{
      r(i.files?.[0]||null);
    };

    i.click();

  });

}

async function addDocumentation(id){

  const f=await pickImage();

  if(!f)
    return;

  showModal(
    "📸 Dokumentation",
    `
<div class="field">
  <label>Höjd (cm)</label>
  <input id="mh" type="number" step=".1">
</div>

<div class="field">
  <label>Antal blad</label>
  <input id="ml" type="number">
</div>

<div class="field">
  <label>Antal rötter</label>
  <input id="mr" type="number">
</div>

<div class="field">
  <label>Variegering (%)</label>
  <input id="mv" type="number" step=".1">
</div>

<div class="field">
  <label>Anteckning</label>
  <textarea id="mn"></textarea>
</div>

<button class="primary" id="saveDoc">
  💾 Spara
</button>
`
  );

  $("saveDoc").onclick=async()=>{

    const m={};

    for(
      const [id2,k]
      of [
        ["mh","height"],
        ["ml","leaves"],
        ["mr","roots"],
        ["mv","variegation"]
      ]
    ){

      const v=Number(
        $(id2).value
      );

      if(Number.isFinite(v))
        m[k]=v;

    }

    await put(
      IS,
      {
        id:crypto.randomUUID(),
        plantId:id,
        createdAt:new Date().toISOString(),
        blob:await optimizeImage(f),
        measurements:m,
        note:$("mn").value
      }
    );

    closeModal();

    await renderHome();

    await renderDashboard();

    openDetail(id);

  };

}

async function showGrowth(id){

  const p=await one(PS,id);

  const a=await imgs(id);

  const c=[
    "height",
    "leaves",
    "roots"
  ]
  .map(k=>{

    const v=a
      .map(
        x=>Number(
          x.measurements?.[k]
        )
      )
      .filter(Number.isFinite);

    return `
<div class="measure">

  <small>${k}</small>

  <b>
    ${
      v.length>1
      ?(
        v.at(-1)-v[0]>=0
        ?"+"
        :""
      )+
      (v.at(-1)-v[0]).toFixed(1)
      :"—"
    }
  </b>

</div>
`;

  })
  .join("");

  $("statsArea").innerHTML=`

<div class="card">

  <h2>
    📈 Tillväxt — ${esc(p.name)}
  </h2>

  <div class="measureGrid">
    ${c}
  </div>

  <button
    class="small-btn"
    onclick="openDetail('${id}')"
  >
    ← Tillbaka
  </button>

</div>

`;

}

async function showForecast(id){

  const p=await one(PS,id);

  const a=(await imgs(id))
    .sort(
      (x,y)=>
        new Date(x.createdAt)-
        new Date(y.createdAt)
    );

  const calc=k=>{

    const x=a
      .map(z=>({
        d:new Date(z.createdAt),
        v:Number(
          z.measurements?.[k]
        )
      }))
      .filter(
        z=>Number.isFinite(z.v)
      );

    if(x.length<2)
      return "—";

    const days=Math.max(
      1,
      (x.at(-1).d-x[0].d)/
      86400000
    );

    const rate=
      (x.at(-1).v-x[0].v)/
      days;

    return (
      x.at(-1).v+
      rate*30
    ).toFixed(1);

  };

  $("statsArea").innerHTML=`

<div class="card">

  <h2>
    🔮 Prognos — ${esc(p.name)}
  </h2>

  <div class="measureGrid">

    <div class="measure">
      <small>Höjd om 30 dagar</small>
      <b>${calc("height")} cm</b>
    </div>

    <div class="measure">
      <small>Blad om 30 dagar</small>
      <b>${calc("leaves")}</b>
    </div>

  </div>

  <p class="muted">
    Matematisk uppskattning, inte en garanti.
  </p>

  <button
    class="small-btn"
    onclick="openDetail('${id}')"
  >
    ← Tillbaka
  </button>

</div>

`;

}

async function showRecords(id){

  const p=await one(PS,id);

  const a=await imgs(id);

  const keys=[
    ["height","Högsta höjd","cm"],
    ["leaves","Flest blad","st"],
    ["roots","Flest rötter","st"],
    ["variegation","Högsta variegering","%"]
  ];

  $("statsArea").innerHTML=`

<div class="card">

  <h2>
    🏆 Rekord — ${esc(p.name)}
  </h2>

  ${
    keys.map(
      ([k,l,u])=>{

        const v=a
          .map(
            x=>Number(
              x.measurements?.[k]
            )
          )
          .filter(Number.isFinite);

        return `
<div class="infoRow">

  <span>${l}</span>

  <b>
    ${v.length?Math.max(...v):"—"}
    ${v.length?u:""}
  </b>

</div>
`;

      }
    ).join("")
  }

  <button
    class="small-btn"
    onclick="openDetail('${id}')"
  >
    ← Tillbaka
  </button>

</div>

`;

}