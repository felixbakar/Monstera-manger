
const DB="MonsteraManagerDB",VER=9,PS="plants",IS="images",IMG=IS;let db,current=null;
const $=id=>document.getElementById(id);

async function exportBackup(){
  try{
    const payload=await MM_makeBackupPayload(),blob=new Blob([JSON.stringify(payload)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`monstera-manager-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);alert("✅ Komplett backup exporterad.");
  }catch(err){console.error(err);alert("❌ Kunde inte exportera backupen.")}
}
$("backupInput").onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    const data=JSON.parse(await f.text());if(!MM_validateBackup(data))throw new Error("Ogiltig backup");
    if(!confirm(`Importera komplett backup? ${data.data[PS].length} plantor och ${data.data[IS].length} bilder hittades.`))return;
    await MM_restoreBackup(data);await renderHome();await renderDashboard();await renderReminderSummary();alert("✅ Komplett backup importerad.");
  }catch(err){console.error(err);alert("❌ Kunde inte importera backupen. Kontrollera att filen kommer från Monstera Manager.")}
  e.target.value="";
};
function openDB(){
  if(db)return Promise.resolve(db);
  return new Promise((ok,no)=>{
    let r=indexedDB.open(DB,VER);
    r.onupgradeneeded=e=>{
      let d=e.target.result;
      if(!d.objectStoreNames.contains(PS))d.createObjectStore(PS,{keyPath:"id"});
      if(!d.objectStoreNames.contains(IS)){
        let st=d.createObjectStore(IS,{keyPath:"id"});
        st.createIndex("plantId","plantId");
      }
      for(const n of ["envLogs","waterLogs","tempLogs","humidityLogs","lightLogs","substrateLogs","events"]){
        if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:"id"});
      }
    };
    r.onsuccess=e=>{
      db=e.target.result;
      db.onversionchange=()=>{
        db.close();
        db=null;
      };
      db.onclose=()=>{
        db=null;
      };
      ok(db);
    };
    r.onerror=()=>no(r.error);
    r.onblocked=()=>no(new Error("Databasen är låst av en annan flik."));
  });
}
function store(n,m="readonly"){if(!db)throw new Error("Databasen är inte öppen.");if(!db.objectStoreNames.contains(n))throw new Error("Saknad databas-store: "+n);return db.transaction(n,m).objectStore(n)}
function put(n,v){return new Promise((ok,no)=>{try{let r=store(n,"readwrite").put(v);r.onsuccess=()=>ok(v);r.onerror=()=>no(r.error||new Error("Kunde inte spara data."))}catch(e){no(e)}})}
function all(n){return new Promise((ok,no)=>{try{let r=store(n).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error||new Error("Kunde inte läsa data."))}catch(e){no(e)}})}
function one(n,id){return new Promise((ok,no)=>{try{let r=store(n).get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error||new Error("Kunde inte läsa posten."))}catch(e){no(e)}})}
async function del(n,id){
  for(let attempt=0;attempt<2;attempt++){
    try{
      if(!db) await openDB();
      return await new Promise((ok,no)=>{
        try{
          let r=store(n,"readwrite").delete(id);
          r.onsuccess=()=>ok(true);
          r.onerror=()=>no(r.error||new Error("Kunde inte radera posten."));
        }catch(e){no(e)}
      });
    }catch(e){
      if(attempt===0 && /closing|closed|not open/i.test(String(e?.message||e))){db=null;await openDB();continue;}
      throw e;
    }
  }
}
function imgs(id){return new Promise((ok,no)=>{try{let r=store(IS).index("plantId").getAll(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error||new Error("Kunde inte läsa bilder."))}catch(e){no(e)}})}
function ageDays(origin,date=new Date()){return Math.floor((date-new Date(origin+"T00:00:00"))/86400000)}
function age(origin,date=new Date()){let d=ageDays(origin,date);return d<0?"Inte ännu":`Dag ${d}`}
function esc(x){return String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function date(s){return s?new Date(s+"T00:00:00").toLocaleDateString("sv-SE",{year:"numeric",month:"long",day:"numeric"}):"—"}
function dt(s){let d=new Date(s);return{d:d.toLocaleDateString("sv-SE",{year:"numeric",month:"long",day:"numeric"}),t:d.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}}
function diff(a,b){let m=Math.floor((new Date(b)-new Date(a))/60000),d=Math.floor(m/1440),h=Math.floor(m%1440/60),mi=m%60,p=[];if(d)p.push(d+" "+(d==1?"dag":"dagar"));if(h)p.push(h+" "+(h==1?"timme":"timmar"));if(!d&&mi)p.push(mi+" min");return p.length?"+ "+p.join(" "):""}
async function idFor(){let p=await all(PS),n=1;while(p.some(x=>x.displayId==="Albo #"+String(n).padStart(3,"0")))n++;return"Albo #"+String(n).padStart(3,"0")}

async function renderDashboard(){
  const ps=await all(PS), ims=await all(IS);
  let totalLeaves=0,last=null,totalCost=0,totalSales=0;
  for(const x of ps){
    const imgs=ims.filter(i=>i.plantId===x.id);
    for(const i of imgs){
      const n=Number(i.measurements?.leaves||0); if(Number.isFinite(n)) totalLeaves=Math.max(totalLeaves,n);
      if(!last||new Date(i.createdAt)>new Date(last.createdAt))last=i;
    }
    const e=x.economy||{}; totalCost+=(e.costs||[]).reduce((a,v)=>a+Number(v.amount||0),0); totalSales+=(e.sales||[]).reduce((a,v)=>a+Number(v.amount||0),0);
  }
  const result=totalSales-totalCost;
  const d=document.getElementById("projectDashboard"); if(!d)return;
  d.innerHTML=`<div class="stat"><small>🌱 Plantor</small><b>${ps.length}</b></div><div class="stat"><small>📸 Dokumentationer</small><b>${ims.length}</b></div><div class="stat"><small>🍃 Flest blad</small><b>${totalLeaves}</b></div><div class="stat"><small>💰 Resultat</small><b>${result>=0?"+":""}${result.toFixed(0)} kr</b></div>`;
}


const STATUS_META={node:["🌱","Nod"],rooting:["🌿","Rotar"],growing:["🍃","Växer"],established:["🪴","Etablerad"],forsale:["💰","Till salu"],sold:["✅","Såld"]};
function statusBadge(st){const x=STATUS_META[st]||STATUS_META.node;return `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--light);border:1px solid var(--border);border-radius:999px;padding:4px 8px;font-size:11px;font-weight:700">${x[0]} ${x[1]}</span>`}
function applyPlantFilter(){
  const q=(document.getElementById("plantSearch")?.value||"").toLowerCase().trim();
  const f=document.getElementById("plantFilter")?.value||"all";
  document.querySelectorAll("#home .plant").forEach(card=>{
    const text=card.textContent.toLowerCase();const st=card.dataset.status||"";
    let ok=!q||text.includes(q);
    if(f==="documented")ok=ok&&!card.textContent.includes("Ingen dokumentation");
    if(f==="never")ok=ok&&card.textContent.includes("Ingen dokumentation");
    if(f==="sold")ok=ok&&card.textContent.includes("Såld");
    if(f==="reminder")ok=ok&&card.textContent.includes("🔔");if(STATUS_META[f])ok=ok&&st===f;
    card.style.display=ok?"":"none";
  });
}

function openToolsModal(){ $("toolsModal").classList.add("open"); document.body.style.overflow="hidden"; }
function closeToolsModal(){ $("toolsModal").classList.remove("open"); document.body.style.overflow=""; }

async function showProjectAnalysis(){
  const ps=await all(PS), ims=await all(IS);
  const daysSince=(d)=>Math.max(0,Math.floor((Date.now()-new Date(d))/86400000));
  let totalCost=0,totalSales=0,totalDays=0,growthSamples=0,leafGrowth=0,rootGrowth=0,heightGrowth=0;
  const active=ps.filter(p=>(p.status||"node")!=="sold").length;
  for(const p of ps){
    const e=p.economy||{}; totalCost+=(e.costs||[]).reduce((a,x)=>a+Number(x.amount||0),0);totalSales+=(e.sales||[]).reduce((a,x)=>a+Number(x.amount||0),0);
    const arr=ims.filter(i=>i.plantId===p.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    if(arr.length>1){
      const a=arr[0].measurements||{},b=arr[arr.length-1].measurements||{};
      [["leaves","leaf"],["roots","root"],["height","height"]].forEach(([k,t])=>{const x=Number(a[k]),y=Number(b[k]);if(Number.isFinite(x)&&Number.isFinite(y)){growthSamples++;if(t==="leaf")leafGrowth+=y-x;if(t==="root")rootGrowth+=y-x;if(t==="height")heightGrowth+=y-x;}});
    }
  }
  const result=totalSales-totalCost;
  const area=document.getElementById("projectDashboard");
  area.className="card";
  area.innerHTML=`<h2 style="margin:0 0 4px">📊 Projektanalys</h2><div class="muted">Sammanfattning av hela Monstera Albo-experimentet</div>
  <div class="stats" style="margin-top:12px"><div class="stat"><small>🌱 Aktiva</small><b>${active}</b></div><div class="stat"><small>📸 Dokumentationer</small><b>${ims.length}</b></div><div class="stat"><small>💰 Investerat</small><b>${totalCost.toFixed(0)} kr</b></div><div class="stat"><small>📈 Resultat</small><b>${result>=0?"+":""}${result.toFixed(0)} kr</b></div></div>
  <div style="margin-top:14px"><div class="infoRow"><span>🍃 Total bladförändring</span><b>${leafGrowth>=0?"+":""}${leafGrowth}</b></div><div class="infoRow"><span>🌱 Total rotförändring</span><b>${rootGrowth>=0?"+":""}${rootGrowth}</b></div><div class="infoRow"><span>📏 Total höjdförändring</span><b>${heightGrowth>=0?"+":""}${heightGrowth} cm</b></div><div class="infoRow"><span>💵 Försäljning</span><b>${totalSales.toFixed(0)} kr</b></div></div></div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}

async function renderReminderSummary(){
  const ps=await all(PS),im=await all(IS),due=[];
  for(const p of ps){
    const interval=Number(p.docInterval||0);if(!interval)continue;
    const arr=im.filter(x=>x.plantId===p.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if(!arr.length||Math.floor((Date.now()-new Date(arr[0].createdAt))/86400000)>=interval)due.push({p,days:arr.length?Math.floor((Date.now()-new Date(arr[0].createdAt))/86400000):null});
  }
  const box=document.getElementById("reminderSummary");if(!box)return;
  box.innerHTML=due.length?`<div class="card"><h3 style="margin-top:0">🔔 Dags att dokumentera</h3>${due.map(x=>`<div class="infoRow"><span>🌿 ${esc(x.p.name)}</span><b>${x.days===null?"Aldrig":x.days+" dagar sedan"}</b></div>`).join("")}</div>`:"";
}
const MONSTERA_VARIANTS=[
  {name:"Deliciosa",label:"Monstera deliciosa"},
  {name:"Albo",label:"Monstera Albo"},
  {name:"Thai Constellation",label:"Monstera Thai Constellation"},
  {name:"Aurea",label:"Monstera Aurea"},
  {name:"Mint",label:"Monstera Mint"},
  {name:"Burle Marx Flame",label:"Monstera Burle Marx Flame"},
  {name:"Esqueleto",label:"Monstera Esqueleto"},
  {name:"Adansonii",label:"Monstera adansonii"},
  {name:"Dubia",label:"Monstera dubia"},
  {name:"Siltepecana",label:"Monstera siltepecana"},
  {name:"Standleyana",label:"Monstera standleyana"},
  {name:"Övrig",label:"Monstera – Övrig variant"}
];
function monsteraVariantOf(p){
  if(p?.variant) return p.variant;
  const text=String((p?.name||"")+" "+(p?.displayId||"")).toLowerCase();
  if(text.includes("thai"))return "Thai Constellation";
  if(text.includes("albo"))return "Albo";
  if(text.includes("aurea"))return "Aurea";
  if(text.includes("mint"))return "Mint";
  if(text.includes("burle marx"))return "Burle Marx Flame";
  if(text.includes("esqueleto"))return "Esqueleto";
  if(text.includes("adansonii"))return "Adansonii";
  if(text.includes("dubia"))return "Dubia";
  if(text.includes("siltepecana"))return "Siltepecana";
  if(text.includes("standleyana"))return "Standleyana";
  return "Deliciosa";
}
function monsteraDisplayName(v){return MONSTERA_VARIANTS.find(x=>x.name===v)?.label||("Monstera "+v)}
async function nextMonsteraName(variant,isCutting){
  const ps=await all(PS);
  const prefix=`Monstera ${variant}`;
  const letter=isCutting?"S":"M";
  let max=0;
  const re=new RegExp("^"+prefix.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+" "+letter+"(\\d+)$","i");
  for(const p of ps){
    if(String(p.variant||monsteraVariantOf(p))!==variant)continue;
    const m=String(p.name||"").match(re);
    if(m)max=Math.max(max,Number(m[1])||0);
  }
  return `${prefix} ${letter}${max+1}`;
}