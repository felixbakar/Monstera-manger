async function renderHome(){
 let p=await all(PS);
 $("plantCount").textContent=p.length;
 $("imageCount").textContent=(await all(IS)).length;
 if(!p.length){
   $("plants").innerHTML='<div class="card empty"><div>🌱</div><h3>Inga plantor ännu</h3><p>Lägg till din första planta.</p></div>';
   return;
 }
 p.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
 for(let x of p){
   x.category=x.category||"Monstera";
   if(x.category==="Fokus") x.category="Fikus";
   if(x.category==="Monstera") x.variant=monsteraVariantOf(x);
   const ximgs=await imgs(x.id);
   x._count=ximgs.length;
   x._latest=ximgs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0]||null;
 }
 const nameById=new Map(p.map(x=>[x.id,x.name||"Namnlös planta"]));
 const categoryMeta={Monstera:["🌿","Monstera"],Fikus:["🌿","Fikus"],Övriga:["🪴","Övriga"]};
 const order=["Monstera","Fikus","Övriga"];
 const cats=[...order,...[...new Set(p.map(x=>x.category))].filter(c=>!order.includes(c))];
 const plantCard=x=>{
   const mother=x.motherPlantId?nameById.get(x.motherPlantId):null;
   const cutting=x.isCutting?`<div class="muted" style="margin-top:5px">🌱 Stickling${mother?` från ${esc(mother)}`:""}</div>`:"";
   const thumb=x._latest?.blob?`<img src="${URL.createObjectURL(x._latest.blob)}" alt="Senaste bild av ${esc(x.name||"plantan")}">`:"🌱";
   return `<div class="plant" onclick="openDetail('${x.id}')"><div class="plantIcon">${thumb}</div><div class="plantInfo"><h3>${esc(x.name)}</h3><div class="muted">${esc(x.displayId||"")}</div><div class="age">🌱 ${age(x.originDate)}</div><div class="muted">📸 ${x._count} bilder</div>${cutting}</div><div class="arrow">›</div></div>`;
 };
 const carousel=items=>`<div class="plantCarousel">${items.map(plantCard).join("")}</div>`;
 $("plants").innerHTML=cats.map(cat=>{
   const items=p.filter(x=>x.category===cat);
   if(!items.length)return "";
   const meta=categoryMeta[cat]||["🌱",cat];
   if(cat==="Monstera") {
     const variants=[...new Set(items.map(x=>monsteraVariantOf(x)))];
     const preferred=MONSTERA_VARIANTS.map(x=>x.name);
     variants.sort((a,b)=>{const ai=preferred.indexOf(a),bi=preferred.indexOf(b);return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b,"sv")});
     return `<section class="categoryGroup"><div class="categoryHead"><h3 class="categoryTitle">${meta[0]} ${esc(meta[1])}</h3><span class="categoryCount">${items.length} ${items.length===1?"planta":"plantor"}</span></div>${variants.map(v=>{const vi=items.filter(x=>monsteraVariantOf(x)===v);return `<div class="mm-variantGroup"><div class="mm-variantHead"><h4 class="mm-variantTitle">${esc(monsteraDisplayName(v))}</h4><span class="mm-variantCount">${vi.length} ${vi.length===1?"planta":"plantor"}</span></div>${vi.length>1?`<div class="categoryHint">Svep åt sidan för att se fler →</div>`:""}${carousel(vi)}</div>`}).join("")}</section>`;
   }
   return `<section class="categoryGroup"><div class="categoryHead"><h3 class="categoryTitle">${meta[0]} ${esc(meta[1])}</h3><span class="categoryCount">${items.length} ${items.length===1?"planta":"plantor"}</span></div>${items.length>1?`<div class="categoryHint">Svep åt sidan för att se fler →</div>`:""}${carousel(items)}</section>`;
 }).join("");
}

async function openDetail(id){current=id;$("home").style.display="none";$("detail").classList.add("active");await renderDetail()}
async function renderDetail(){
 let p=await one(PS,current),im=await imgs(current);
 if(!p)return;
 im.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 let tl=im.length?im.map((x,i)=>{let z=dt(x.createdAt);return (i?`<div class="gap"><span>${diff(im[i-1].createdAt,x.createdAt)}</span></div>`:"")+eventHTML(x,p,i+1)}).join(""):'<div class="card empty"><div>📸</div><h3>Ingen dokumentation ännu</h3><p>Lägg till din första bild.</p></div>';
 const latest=im[im.length-1];
 const m=latest?.measurements||{};
 const val=(v,u="")=>(v!==undefined&&v!==null&&v!=="")?`${esc(v)}${u}`:"—";
 const delta=(k,u="")=>{
   if(im.length<2)return "";
   const a=Number(im[0]?.measurements?.[k]),b=Number(m[k]);
   if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)return "";
   const d=b-a; return `<span class="mm-v9-delta">${d>0?"+":""}${d}${u} sedan första</span>`;
 };
 const available=(fn)=>typeof window[fn]==="function";
 const action=(icon,title,sub,fn,cls="")=>available(fn)?`<button type="button" class="mm-v9-action ${cls}" onclick="window['${fn}']()"><span class="mm-v9-action-icon">${icon}</span><span><b>${title}</b><small>${sub}</small></span><span class="mm-v9-chevron">›</span></button>`:"";
 const group=(icon,title,items)=>{
   const visible=items.filter(x=>available(x[3]));
   if(!visible.length)return "";
   return `<div class="mm-v9-group"><div class="mm-v9-group-title"><span>${icon}</span><b>${title}</b></div>${visible.map(x=>action(...x)).join("")}</div>`;
 };
 const avatar=latest?.blob?`<img src="${URL.createObjectURL(latest.blob)}" alt="Senaste dokumentation">`:'<span>🌱</span>';
 $("detailContent").innerHTML=`
 <div class="mm-v9-wrap">
   <div class="mm-v9-profile">
     <div class="mm-v9-profile-top">
       <div class="mm-v9-avatar">${avatar}</div>
       <div class="mm-v9-title-wrap">
         <h2 class="mm-v9-name">${esc(p.name||"Namnlös planta")}</h2>
         <div class="mm-v9-id">${esc(p.displayId||"")}</div>
         <div class="mm-v9-age">🌱 Dag ${ageDays(p.originDate,new Date())}</div>
       </div>
     </div>
     <div class="mm-v9-meta">
       <div class="mm-v9-meta-box"><span>Ursprung</span><b>${date(p.originDate)}</b></div>
       <div class="mm-v9-meta-box"><span>Inköp</span><b>${date(p.purchaseDate)}</b></div>
       <div class="mm-v9-meta-box"><span>Dokumentationer</span><b>${im.length}</b></div>
       <div class="mm-v9-meta-box"><span>Status</span><b>${esc(p.status||"Aktiv")}</b></div>
     </div>
     ${await relationHTML(p)}
     ${latest?`<div class="mm-v9-current"><div class="mm-v9-current-title">Senaste mätning</div><div class="mm-v9-stats">
       <div class="mm-v9-stat"><span>📏 Höjd</span><b>${val(m.height," cm")}</b>${delta("height"," cm")}</div>
       <div class="mm-v9-stat"><span>🍃 Blad</span><b>${val(m.leaves)}</b>${delta("leaves")}</div>
       <div class="mm-v9-stat"><span>🌱 Rötter</span><b>${val(m.roots)}</b>${delta("roots")}</div>
       <div class="mm-v9-stat"><span>📐 Längsta rot</span><b>${val(m.longestRoot," cm")}</b>${delta("longestRoot"," cm")}</div>
     </div></div>`:""}
   </div>

   <div class="mm-v9-main-actions">
     <button type="button" class="mm-v9-photo" onclick="takePhoto()">📸 <span><b>Lägg till bild</b><small>Dokumentera plantan</small></span><span>›</span></button>
     ${available("showStats")?`<button type="button" class="mm-v9-main-action" onclick="showStats()">📊 <span><b>Statistik</b><small>Se aktuell tillväxt</small></span><span>›</span></button>`:""}
     ${available("showGrowth")?`<button type="button" class="mm-v9-main-action" onclick="showGrowth()">📈 <span><b>Tillväxt</b><small>Kurva och utveckling</small></span><span>›</span></button>`:""}
     <button type="button" class="mm-v9-more" onclick="openPlantTools()">☰ <span><b>Mer om plantan</b><small>Alla analyser, verktyg och funktioner</small></span><span>⌃</span></button>
   </div>

   <h2 class="timelineTitle">📈 Tillväxttidslinje</h2>
   <div class="timeline">${tl}</div>
   ${p.description?`<div class="card"><b>Beskrivning</b><p>${esc(p.description)}</p></div>`:""}
   <button class="deletePlant" onclick="removePlant()">🗑️ Ta bort planta</button>
   <div id="statsArea"></div>
 </div>

 <div id="mmPlantTools" class="mm-v9-sheet-bg" aria-hidden="true" onclick="if(event.target===this)closePlantTools()">
   <div class="mm-v9-sheet" role="dialog" aria-modal="true" aria-label="Mer om plantan">
     <div class="mm-v9-sheet-handle"></div>
     <div class="mm-v9-sheet-head"><div><div class="mm-v9-sheet-kicker">🌿 ${esc(p.name||"Planta")}</div><h3>Mer om plantan</h3></div><button type="button" class="mm-v9-close" onclick="closePlantTools()">×</button></div>
     <div class="mm-v9-sheet-body">
       ${group("📊","Analys & tillväxt",[
         ["📊","Statistik","Samlad tillväxtdata","showStats"],
         ["📈","Tillväxtkurva","Mätningar över tid","showGrowth"],
         ["🧠","Avancerad analys","Djupare tillväxtanalys","showAdvancedGrowth"],
         ["🔮","Tillväxtprognos","Prognos 30 dagar framåt","showGrowthForecast"],
         ["🧠","Automatisk analys","Jämför tillväxtperioder","showAutoGrowthAnalysis"],
         ["🏆","Rekord","Personliga växtrekord","showRecords"]
       ])}
       ${group("📸","Dokumentation",[
         ["↔️","Jämför bilder","Se förändringen","showCompare"],
         ["📸","Förra → Nu","Snabb jämförelse","showLatestComparison"],
         ["📅","Dokumentationshistorik","Alla dokumentationer","showHistory"],
         ["🖼️","Bildgalleri","Galleri och jämförelse","showPhotoGallery"],
         ["🧬","Plantans livslinje","Händelser i ordning","showPlantTimeline"],
         ["📸","Snabbdokumentera","Snabb registrering","quickDocument"]
       ])}
       ${group("🌱","Plantan",[
         ["🌱","Livshistoria","Plantans viktiga datum","showLifeHistory"],
         ["🏆","Milstolpar","Viktiga händelser","showMilestones"],
         ["🧪","Plasthälsa","QA och plantstatus","showHealth"],
         ["📄","Plant-rapport","Sammanfattad rapport","showReport"],
         ["🔔","Påminnelser","Nästa dokumentation","showReminderForm"],
         ["🗓️","Kalender","Planerade händelser","showCalendar"],
         ["🌿","Plantregister","Alla plantor","showPlantRegistry"]
       ])}
       ${group("🧪","Experiment & miljö",[
         ["🧪","Experimentlogg","Miljö och anteckningar","showExperimentLog"],
         ["💧","Vattning","Vattningshistorik","showWaterHistory"],
         ["🌡️","Temperatur","Temperaturhistorik","showTemperatureHistory"],
         ["💦","Luftfuktighet","Fuktighetshistorik","showHumidityHistory"],
         ["💡","Ljusdata","Ljusregistrering","showLightHistory"],
         ["🪴","Substrat","Substratlogg","showSubstrateLog"],
         ["✂️","Händelser","Händelselogg","showEventLog"],
         ["🔗","Miljö → tillväxt","Koppla miljö till tillväxt","showEnvironmentGrowth"],
         ["📊","Miljöanalys","Analysera miljödata","showEnvironmentAnalysis"],
         ["🧬","Experimentrapport","Samlad experimentrapport","showExperimentReport"]
       ])}
       ${group("🔍","Kvalitetssäkring",[
         ["🧪","Databas-test","Kontrollera databasen","runDBSelfTest"],
         ["🌿","Plant-QA","Testa plantdata","runPlantQA"],
         ["🖼️","Bild-QA","Testa bildsystemet","runImageQA"],
         ["📏","Mätningar-QA","Testa mätningar","runMeasurementsQA"],
         ["🌱","Tillväxt-QA","Testa tillväxt","runGrowthQA"],
         ["📊","Diagram-QA","Testa diagram","runChartQA"],
         ["🍃","Blad-QA","Testa bladdata","runLeafQA"],
         ["🌱","Rot-QA","Testa rotdata","runRootQA"],
         ["🤍","Variegering-QA","Testa variegering","runVariegationQA"],
         ["🔮","Prognos-QA","Testa prognoser","runForecastQA"],
         ["🏆","Rekord-QA","Testa rekord","runRecordsQA"]
       ])}
     </div>
   </div>
 </div>`;
 im.forEach(x=>{let el=document.querySelector(`[data-img="${x.id}"]`);if(el)el.src=URL.createObjectURL(x.blob)});
}

function eventHTML(x,p,n){let z=dt(x.createdAt),a=ageDays(p.originDate,new Date(x.createdAt));let m=x.measurements||{};let fields=[["Höjd",m.height,"cm"],["Blad",m.leaves,"st"],["Rötter",m.roots,"st"],["Längsta rot",m.longestRoot,"cm"],["Bladstorlek",m.leafSize,"cm"]].filter(v=>v[1]!==""&&v[1]!==null&&v[1]!==undefined);return `<div class="event"><div class="dot"></div><div class="eventCard"><img data-img="${x.id}" alt="Dokumentation"><div class="eventBody"><div class="eventNo">BILD #${n}</div><div class="eventDate">${z.d}</div><div class="eventTime">🕐 ${z.t}</div><div class="eventAge">🌱 Plantans ålder: Dag ${a}</div>${fields.length?`<div class="measureGrid">${fields.map(v=>`<div class="measure"><label>${v[0]}</label><b>${esc(v[1])} ${v[2]}</b></div>`).join("")}</div>`:""}${x.note?`<div class="note">📝 ${esc(x.note)}</div>`:""}<div class="actions"><button class="small" onclick="editDoc('${x.id}')">✏️ Ändra</button><button class="small danger" onclick="removeDoc('${x.id}')">🗑️ Ta bort</button></div></div></div></div>`}

async function showReminderForm(){
  const p=await one(PS,current);
  const existing=p.reminder||{};
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🔔 Påminnelse</h2><div class="card">
  <div class="field"><label>Påminnelse</label><select id="remEnabled" style="width:100%;padding:13px;border:1px solid var(--border);border-radius:13px;background:#fafbf9"><option value="yes" ${existing.enabled!==false?"selected":""}>På</option><option value="no" ${existing.enabled===false?"selected":""}>Av</option></select></div>
  <div class="field"><label>Intervall (dagar)</label><input id="remDays" type="number" min="1" step="1" value="${esc(existing.days||3)}"></div>
  <div class="field"><label>Nästa dokumentation</label><input id="remDate" type="date" value="${esc(existing.nextDate||"")}"></div>
  <button class="save" onclick="saveReminder()">💾 Spara påminnelse</button>
  ${existing.nextDate?`<button class="small" style="width:100%;margin-top:8px" onclick="clearReminder()">🔕 Stäng av påminnelse</button>`:""}
  <p class="muted" style="margin-bottom:0;margin-top:10px">Appen visar en påminnelse när du öppnar den och datumet har passerat. En fristående HTML-sida kan inte garantera systemnotiser när den är helt stängd.</p>
  </div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveReminder(){
  const p=await one(PS,current);
  const days=Math.max(1,parseInt(document.getElementById("remDays").value||3,10));
  const next=document.getElementById("remDate").value||new Date(Date.now()+days*86400000).toISOString().slice(0,10);
  p.reminder={enabled:document.getElementById("remEnabled").value==="yes",days,nextDate:next};
  await put(PS,p); await renderDetail(); checkReminders();
  alert("Påminnelsen är sparad.");
}
async function clearReminder(){
  const p=await one(PS,current); p.reminder={enabled:false}; await put(PS,p); await renderDetail();
}
async function checkReminders(){
  const ps=await all(PS),today=new Date().toISOString().slice(0,10);
  const due=ps.filter(p=>p.reminder&&p.reminder.enabled!==false&&p.reminder.nextDate&&p.reminder.nextDate<=today);
  if(!due.length)return;
  const names=due.map(p=>`• ${p.name}`).join("\n");
  alert(`🔔 Dags att dokumentera:\n\n${names}\n\nTa en ny bild på plantan.`);
}
async function relationHTML(p){
  const ps=await all(PS);
  const mother=p.motherPlantId?ps.find(x=>x.id===p.motherPlantId):null;
  const children=ps.filter(x=>x.isCutting&&x.motherPlantId===p.id);
  if(!p.isCutting&&!children.length)return "";
  let html=`<div class="relation-card">`;
  if(p.isCutting){
    html+=`<div><b>🌱 Stickling</b><div class="muted">Den här plantan kommer från:</div>${mother?`<button type="button" class="relation-link" onclick="openDetail('${mother.id}')"><strong>${esc(mother.name||"Namnlös planta")}</strong><span>${esc(mother.displayId||"")} · Tryck för att öppna moderplantan</span></button>`:`<div class="muted" style="margin-top:7px">Moderplantan finns inte längre i registret.</div>`}</div>`;
  }
  if(children.length){
    html+=`<div style="${p.isCutting?'margin-top:13px;padding-top:13px;border-top:1px solid var(--border)':''}"><b>🌿 Sticklingar från den här plantan</b>${children.map(c=>`<button type="button" class="relation-link" onclick="openDetail('${c.id}')"><strong>${esc(c.name||"Namnlös planta")}</strong><span>${esc(c.displayId||"")} · Stickling</span></button>`).join("")}</div>`;
  }
  return html+`</div>`;
}

async function populateMotherPlants(){
  const select=$("pMother");
  if(!select)return;
  const ps=await all(PS);
  select.innerHTML=`<option value="">Välj moderplanta...</option>${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.name||"Namnlös planta")} — ${esc(p.displayId||"")}</option>`).join("")}`;
  toggleCuttingFields();
}
function toggleCuttingFields(){
  const checked=$("isCutting")?.checked;
  const wrap=$("motherWrap");
  if(wrap)wrap.classList.toggle("open",!!checked);
  const select=$("pMother");
  if(select)select.required=!!checked;
}
function goHome(){current=null;$("detail").classList.remove("active");$("home").style.display="block";renderHome()}
function toggleCustomCategory(){
  const select=$("pCategory"), wrap=$("customCategoryWrap"), input=$("pCustomCategory");
  const custom=select?.value==="__custom__";
  if(wrap)wrap.classList.toggle("open",custom);
  if(input)input.required=custom;
  if(!custom && input)input.value="";
}
async function populateCategoryOptions(){
  const select=$("pCategory");
  if(!select)return;
  const ps=await all(PS);
  const cats=["Monstera","Fikus","Övriga",...[...new Set(ps.map(p=>p.category).filter(Boolean))].filter(c=>!['Monstera','Fokus','Fikus','Övriga'].includes(c))];
  select.innerHTML=cats.map(c=>`<option value="${esc(c)}">${c==="Monstera"?"🌿":c==="Fikus"?"🌿":c==="Övriga"?"🪴":"🌱"} ${esc(c)}</option>`).join("")+`<option value="__custom__">➕ Lägg till egen kategori…</option>`;
  select.value="Monstera";
  toggleCustomCategory();
}
async function openPlantForm(){let now=new Date().toISOString().slice(0,10);$("plantForm").reset();$("pOrigin").value=now;$("pPurchase").value=now;await populateCategoryOptions();await populateMotherPlants();$("plantModal").classList.add("open")}
function closePlantForm(){$("plantModal").classList.remove("open");$("plantForm").reset();toggleCuttingFields();toggleCustomCategory()}
$("plantForm").onsubmit=async e=>{
  e.preventDefault();
  const isCutting=$("isCutting").checked;
  const selectedCategory=$("pCategory").value;
  const customCategory=$("pCustomCategory").value.trim();
  const category=selectedCategory==="__custom__"?customCategory:(selectedCategory==="Fokus"?"Fikus":selectedCategory||"Monstera");
  if(!category){alert("Skriv ett namn på den egna kategorin.");return;}
  const motherPlantId=$("pMother").value||null;
  if(isCutting&&!motherPlantId){alert("Välj vilken planta sticklingen kommer från.");return;}
  await put(PS,{id:crypto.randomUUID(),displayId:await idFor(),name:$("pName").value.trim(),category,originDate:$("pOrigin").value,purchaseDate:$("pPurchase").value||null,description:$("pDesc").value.trim(),isCutting,motherPlantId:isCutting?motherPlantId:null,createdAt:new Date().toISOString()});
  closePlantForm();
  await renderHome();
}










async function quickDocument(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const prev=im[im.length-1], now=new Date();
  const prevM=prev?.measurements||{}; window.mmQuickPrev=prevM;
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">📸 Snabbdokumentera</h2>
  <div class="card"><div class="infoRow"><span>🌿 Planta</span><b>${esc(p.name)}</b></div><div class="infoRow"><span>📅 Datum</span><b>${now.toLocaleDateString("sv-SE")}</b></div><div class="infoRow"><span>🎂 Ålder</span><b>Dag ${ageDays(p.originDate,now)}</b></div>${prev?`<div class="infoRow"><span>↩️ Förra dokumentationen</span><b>${new Date(prev.createdAt).toLocaleDateString("sv-SE")}</b></div>`:""}</div>
  <div class="card"><h3 style="margin-top:0">📊 Senaste mätvärden</h3>
  <div class="mm-measures">
  <div class="mm-measure"><label>📏 Höjd (cm)</label><input id="quickHeight" type="number" min="0" step="0.1" value="${prevM.height??""}" oninput="updateMeasureDeltas()"><div class="mm-delta" id="dHeight"></div></div>
  <div class="mm-measure"><label>🍃 Blad</label><input id="quickLeaves" type="number" min="0" step="1" value="${prevM.leaves??""}" oninput="updateMeasureDeltas()"><div class="mm-delta" id="dLeaves"></div></div>
  <div class="mm-measure"><label>🌱 Rötter</label><input id="quickRoots" type="number" min="0" step="1" value="${prevM.roots??""}" oninput="updateMeasureDeltas()"><div class="mm-delta" id="dRoots"></div></div>
  <div class="mm-measure"><label>📐 Längsta rot (cm)</label><input id="quickLongestRoot" type="number" min="0" step="0.1" value="${prevM.longestRoot??""}" oninput="updateMeasureDeltas()"><div class="mm-delta" id="dLongestRoot"></div></div>
</div>
  <div class="field"><label>🏷️ Taggar</label><select id="quickTag" style="width:100%;box-sizing:border-box;padding:13px;border:1px solid var(--border);border-radius:13px;font:inherit"><option value="normal">📸 Normal</option><option value="rooting">🌱 Rotning</option><option value="newleaf">🍃 Nytt blad</option><option value="planted">🪴 Planterad</option><option value="pruning">✂️ Beskärning</option><option value="watering">💧 Vattning</option><option value="treatment">🧪 Behandling</option></select></div><div class="field"><label>📝 Anteckning</label><textarea id="quickNote" rows="3" placeholder="Vad har hänt sedan sist?"></textarea></div>
  <div class="field"><label>🔔 Dokumentationsintervall</label><select id="docInterval" style="width:100%;box-sizing:border-box;padding:13px;border:1px solid var(--border);border-radius:13px;font:inherit"><option value="0">Av</option><option value="3">Var 3:e dag</option><option value="7">Var 7:e dag</option><option value="14">Var 14:e dag</option><option value="30">Var 30:e dag</option></select></div><button class="small" style="width:100%;padding:13px" onclick="saveDocReminder()">💾 Spara påminnelse</button><input id="quickPhoto" type="file" accept="image/*" capture="environment" style="width:100%;padding:12px;box-sizing:border-box">
  <button class="save" style="width:100%;margin-top:10px" onclick="saveQuickDocument()">💾 Spara dokumentation</button></div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}


function updateMeasureDeltas(){
  const fields=[["quickHeight","dHeight","height","cm"],["quickLeaves","dLeaves","leaves","blad"],["quickRoots","dRoots","roots","rötter"],["quickLongestRoot","dLongestRoot","longestRoot","cm"]];
  const prev=window.mmQuickPrev||{};
  fields.forEach(([id,out,k,u])=>{const v=Number(document.getElementById(id)?.value),p=Number(prev[k]);const el=document.getElementById(out);if(!el)return;if(!Number.isFinite(v)||!Number.isFinite(p)){el.textContent="";return}const d=v-p;el.textContent=`Sedan sist: ${d>=0?"+":""}${d} ${u}`});
}
async function saveDocReminder(){
  const p=await one(PS,current);if(!p)return;
  p.docInterval=Number(document.getElementById("docInterval").value||0);
  p.docReminderSavedAt=new Date().toISOString();
  await put(PS,p);alert(p.docInterval?`🔔 Påminnelse sparad: var ${p.docInterval}:e dag.`:"🔕 Påminnelse avstängd.");
  await renderHome();
}
async function saveQuickDocument(){
  const file=document.getElementById("quickPhoto").files[0];
  if(!file){alert("📸 Ta eller välj en bild först.");return}
  const f=await optimizeImage(file), data={plantId:current,createdAt:new Date().toISOString(),measurements:{
    height:Number(document.getElementById("quickHeight").value)||0,
    leaves:Number(document.getElementById("quickLeaves").value)||0,
    roots:Number(document.getElementById("quickRoots").value)||0,
    longestRoot:Number(document.getElementById("quickLongestRoot").value)||0
  },note:document.getElementById("quickNote").value||"",tag:document.getElementById("quickTag").value||"normal"};
  data.blob=f; if(prev){const a=prev.measurements||{},b=data.measurements||{},delta=(k)=>Number.isFinite(Number(a[k]))&&Number.isFinite(Number(b[k]))?Number(b[k])-Number(a[k]):null;data._comparison={days:Math.max(0,ageDays(new Date(prev.createdAt),new Date(data.createdAt))),height:delta("height"),leaves:delta("leaves"),roots:delta("roots"),longestRoot:delta("longestRoot")};} await put(IS,data); await renderDetail(); await renderHome(); await renderDashboard(); alert("✅ Dokumentationen är sparad.");
}


