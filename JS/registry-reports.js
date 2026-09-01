const TAG_META={normal:["📸","Normal"],rooting:["🌱","Rotning"],newleaf:["🍃","Nytt blad"],planted:["🪴","Planterad"],pruning:["✂️","Beskärning"],watering:["💧","Vattning"],treatment:["🧪","Behandling"]};
function tagBadge(t){const x=TAG_META[t]||TAG_META.normal;return `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--light);border:1px solid var(--border);border-radius:999px;padding:4px 8px;font-size:11px;font-weight:700">${x[0]} ${x[1]}</span>`}



async function showPhotoGallery(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">📸 Bildgalleri</h2><div class="card"><div class="field"><label>🔀 Jämför två bilder</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><select id="cmp1">${im.map((x,i)=>`<option value="${i}">Dag ${ageDays(p.originDate,new Date(x.createdAt))} · ${new Date(x.createdAt).toLocaleDateString("sv-SE")}</option>`).join("")}</select><select id="cmp2">${im.map((x,i)=>`<option value="${i}" ${i===im.length-1?"selected":""}>Dag ${ageDays(p.originDate,new Date(x.createdAt))} · ${new Date(x.createdAt).toLocaleDateString("sv-SE")}</option>`).join("")}</select></div></div><button class="save" style="width:100%" onclick="renderPhotoCompare()">🔍 Jämför</button></div><div id="galleryGrid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">${im.map(x=>`<div class="card" style="padding:8px;margin:0"><img src="${URL.createObjectURL(x.blob)}" onclick="openViewer(this._mmBlob||x.blob)" onload="this._mmBlob=x.blob" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px"><div style="font-weight:800;margin-top:6px">Dag ${ageDays(p.originDate,new Date(x.createdAt))}</div><div class="muted">${new Date(x.createdAt).toLocaleDateString("sv-SE")}</div></div>`).join("")}</div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function setPlantStatus(id,status){
  const p=await one(PS,id); if(!p)return;
  p.status=status; await put(PS,p);
  if(current===id) renderDetail();
  else showPlantRegistry(window.mmRegSort||"name",window.mmRegFilter||"all",window.mmRegSearch||"");
}
async function showPlantRegistry(sortMode=window.mmRegSort||"name", filterMode=window.mmRegFilter||"all", searchText=window.mmRegSearch||""){
  window.mmRegSort=sortMode; window.mmRegFilter=filterMode; window.mmRegSearch=searchText;
  const plants=await all(PS), enriched=[];
  for(const p of plants){
    const ims=(await imgs(p.id)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const latest=ims[0], prev=ims[1], m=latest?.measurements||{};
    enriched.push({p,ims,latest,prev,m,age:ageDays(p.originDate,new Date()),height:Number(m.height),leaves:Number(m.leaves),roots:Number(m.roots),last:latest?new Date(latest.createdAt).getTime():0});
  }
  const statusOf=x=>String(x.p.status||"Aktiv").toLowerCase();
  let filtered=enriched.filter(x=>{
    const q=searchText.trim().toLowerCase(), name=String(x.p.name||"").toLowerCase();
    if(q&&!name.includes(q))return false;
    if(filterMode==="active"&&statusOf(x)!=="aktiv")return false;if(filterMode==="notarchived"&&x.p.archived)return false;if(filterMode==="favorites"&&!x.p.favorite)return false;if(filterMode==="albo"&&!(x.p.tags||[]).some(t=>t.toLowerCase()==="albo"))return false;if(filterMode==="node"&&!(x.p.tags||[]).some(t=>t.toLowerCase()==="första_noden"))return false;
    if(filterMode==="rooting"&&!statusOf(x).includes("rot"))return false;if(filterMode==="growing"&&statusOf(x)!=="växer")return false;
    if(filterMode==="sale"&&!statusOf(x).includes("sälj")&&!statusOf(x).includes("till salu"))return false;
    if(filterMode==="archived"&&!x.p.archived)return false;
    return true;
  });
  const val=(x,k)=>Number.isFinite(x[k])?x[k]:-Infinity;
  filtered.sort((a,b)=>{
    if(sortMode==="name")return String(a.p.name||"").localeCompare(String(b.p.name||""),"sv");
    if(sortMode==="young")return a.age-b.age;if(sortMode==="old")return b.age-a.age;
    if(sortMode==="height")return val(b,"height")-val(a,"height");if(sortMode==="leaves")return val(b,"leaves")-val(a,"leaves");
    if(sortMode==="roots")return val(b,"roots")-val(a,"roots");if(sortMode==="recent")return b.last-a.last;return 0;
  });
  const area=document.getElementById("statsArea");
  const cards=filtered.map(({p,ims,latest,prev,m,age})=>{
    const delta=(k,u)=>{const a=Number(prev?.measurements?.[k]),b=Number(m[k]);return Number.isFinite(a)&&Number.isFinite(b)&&b!==a?`Sedan sist: ${b>a?"+":""}${b-a} ${u}`:""};
    return `<div class="mm-plant-card"><div>${latest?`<img class="mm-plant-thumb" src="${URL.createObjectURL(latest.blob)}">`:`<div class="mm-plant-thumb" style="display:flex;align-items:center;justify-content:center;font-size:28px">🌱</div>`}</div><div><div class="mm-plant-name">${esc(p.name||"Namnlös planta")}</div><button class="mm-fav" onclick="toggleFavorite('${p.id}')" title="Favorit">${p.favorite?"⭐":"☆"}</button><div class="mm-plant-meta">Dag ${age} · ${ims.length} dokumentationer</div><span class="mm-status">${esc(p.status||"Aktiv")}</span><div class="mm-status-editor"><select onchange="setPlantStatus('${p.id}',this.value)"><option ${((p.status||"Aktiv")==="Aktiv")?"selected":""}>Aktiv</option><option ${p.status==="Under rotning"?"selected":""}>Under rotning</option><option ${p.status==="Växer"?"selected":""}>Växer</option><option ${p.status==="Till salu"?"selected":""}>Till salu</option><option ${p.status==="Arkiverad"?"selected":""}>Arkiverad</option></select></div><div class="mm-card-stats"><div class="mm-stat"><span>📏 Höjd</span><b>${m.height??"—"} cm</b><span>${delta("height","cm")}</span></div><div class="mm-stat"><span>🍃 Blad</span><b>${m.leaves??"—"}</b><span>${delta("leaves","blad")}</span></div><div class="mm-stat"><span>🌱 Rötter</span><b>${m.roots??"—"}</b><span>${delta("roots","rötter")}</span></div><div class="mm-stat"><span>📐 Längsta rot</span><b>${m.longestRoot??"—"} cm</b><span>${delta("longestRoot","cm")}</span></div></div></div><div class="mm-tags">${(p.tags||[]).map(t=>`<span class="mm-tag">#${esc(t)}</span>`).join("")}</div><div class="mm-tag-editor"><input placeholder="#ny tagg" onkeydown="if(event.key==='Enter')addPlantTag('${p.id}',this)"><button class="small" onclick="addPlantTag('${p.id}',this.previousElementSibling)">+</button></div><button class="mm-archive" onclick="toggleArchived('${p.id}')">${p.archived?"↩️ Återställ":"📦 Arkivera"}</button><button class="mm-duplicate" onclick="duplicatePlant('${p.id}')">📋 Duplicera</button><button class="mm-manage" onclick="moveLatestDocumentation('${p.id}')">🔄 Flytta senaste dokumentation</button><button class="mm-manage" onclick="current='${p.id}';showPhotoTimeline()">📸 Fototidslinje</button><button class="mm-manage" onclick="current='${p.id}';showPhotoCompare()">↔️ Bildjämförelse</button><button class="mm-manage" onclick="current='${p.id}';showGrowthStats()">📊 Tillväxt</button><button class="mm-manage" onclick="current='${p.id}';showAutoBeforeAfter()">🎞️ Före / efter</button><button class="mm-manage" onclick="current='${p.id}';showGrowthAnalysis()">📈 Tillväxtanalys</button><button class="mm-manage" onclick="current='${p.id}';showGrowthChart()">📊 Diagram</button><button class="mm-manage" onclick="current='${p.id}';showMeasurementHistory()">📏 Mätvärden</button><button class="mm-manage" onclick="current='${p.id}';showLeafStats()">🍃 Bladstatistik</button><button class="mm-manage" onclick="current='${p.id}';showRootStats()">🌱 Rotstatistik</button><button class="mm-manage" onclick="current='${p.id}';showVariegation()">🤍 Variegering</button><button class="mm-manage" onclick="current='${p.id}';showGrowthIntervals()">⏱️ Intervall</button><button class="mm-manage" onclick="current='${p.id}';showRecords()">🏆 Rekord</button><button class="mm-manage" onclick="current='${p.id}';showForecast()">🔮 Prognos</button><button class="mm-manage" onclick="current='${p.id}';showSummaryReport()">📋 Rapport</button><button class="mm-manage" onclick="showExperimentLog()">🧪 Experimentlogg</button><button class="mm-manage" onclick="showWaterHistory()">💧 Vattning</button><button class="mm-manage" onclick="showTemperatureHistory()">🌡️ Temperatur</button><button class="mm-manage" onclick="showHumidityHistory()">💦 Luftfuktighet</button><button class="mm-manage" onclick="showLightHistory()">💡 Ljusdata</button><button class="mm-manage" onclick="showSubstrateLog()">🪴 Substrat</button><button class="mm-manage" onclick="showEventLog()">✂️ Händelser</button><button class="mm-manage" onclick="showEnvironmentGrowth()">🔗 Miljö → tillväxt</button><button class="mm-manage" onclick="showEnvironmentAnalysis()">📊 Miljöanalys</button><button class="mm-manage" onclick="showExperimentReport()">🧬 Experimentrapport</button><button class="mm-manage" onclick="runDBSelfTest()">🧪 Databas-test</button><button class="mm-manage" onclick="runPlantQA()">🌿 Plant-QA</button><button class="mm-manage" onclick="runImageQA()">🖼️ Bild-QA</button><button class="mm-manage" onclick="runMeasurementsQA()">📏 Mätningar-QA</button><button class="mm-manage" onclick="runGrowthQA()">🌱 Tillväxt-QA</button><button class="mm-manage" onclick="runChartQA()">📊 Diagram-QA</button><button class="mm-manage" onclick="runLeafQA()">🍃 Blad-QA</button><button class="mm-manage" onclick="runRootQA()">🌱 Rot-QA</button><button class="mm-manage" onclick="runVariegationQA()">🤍 Variegering-QA</button><button class="mm-manage" onclick="runForecastQA()">🔮 Prognos-QA</button><button class="mm-manage" onclick="runRecordsQA()">🏆 Rekord-QA</button><button class="mm-manage" onclick="runFinalQA()">🔍 FINAL QA</button><button class="small" onclick="current='${p.id}';renderDetail()">Öppna</button></div>`;
  }).join("");
  area.innerHTML=`<h2 class="timelineTitle">🌿 Plantregister</h2><div class="card"><div class="mm-filter-row"><input id="mmSearch" value="${esc(searchText)}" placeholder="🔎 Sök namn..." oninput="showPlantRegistry(document.getElementById('mmSort').value,document.getElementById('mmFilter').value,this.value)"><select id="mmFilter" onchange="showPlantRegistry(document.getElementById('mmSort').value,this.value,document.getElementById('mmSearch').value)"><option value="all">🌿 Alla</option><option value="active">🟢 Aktiva</option><option value="notarchived">🌿 Ej arkiverade</option><option value="archived">📦 Arkiverade</option><option value="favorites">⭐ Favoriter</option><option value="albo">🍃 #albo</option><option value="node">🌱 #första_noden</option><option value="rooting">🌱 Under rotning</option><option value="growing">📈 Växer</option><option value="sale">💰 Till salu</option><option value="archived">📦 Arkiverade</option></select></div><div class="mm-reg-controls"><select id="mmSort" onchange="showPlantRegistry(this.value,document.getElementById('mmFilter').value,document.getElementById('mmSearch').value)"><option value="name" ${sortMode==="name"?"selected":""}>🔤 Namn</option><option value="young" ${sortMode==="young"?"selected":""}>🎂 Yngst först</option><option value="old" ${sortMode==="old"?"selected":""}>🎂 Äldst först</option><option value="height" ${sortMode==="height"?"selected":""}>📏 Högst först</option><option value="leaves" ${sortMode==="leaves"?"selected":""}>🍃 Flest blad</option><option value="roots" ${sortMode==="roots"?"selected":""}>🌱 Flest rötter</option><option value="recent" ${sortMode==="recent"?"selected":""}>📸 Senast dokumenterad</option></select><button class="small" onclick="showPlantRegistry()">↻ Uppdatera</button></div><div class="mm-filter-count">Visar ${filtered.length} av ${enriched.length} plantor</div><div class="mm-registry">${cards||"<div class='muted'>Inga plantor matchar filtret.</div>"}</div></div>`;
  const f=document.getElementById("mmFilter");if(f)f.value=filterMode;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showPlantTimeline(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const events=[];
  events.push({date:new Date(p.originDate),day:0,icon:"🌱",title:"Planta skapad",text:"Startpunkt för plantans livshistoria."});
  im.forEach((x,i)=>{
    const m=x.measurements||{},prev=im[i-1]?.measurements||{};
    const changes=[];
    for(const [k,label,unit] of [["leaves","blad",""],["roots","rötter",""],["height","höjd"," cm"]]){
      const a=Number(prev[k]),b=Number(m[k]); if(i>0&&Number.isFinite(a)&&Number.isFinite(b)&&b!==a)changes.push(`${label} ${b>a?"+":""}${b-a}${unit}`);
    }
    const tag=TAG_META[x.tag]||TAG_META.normal;
    events.push({date:new Date(x.createdAt),day:ageDays(p.originDate,new Date(x.createdAt)),icon:tag[0],title:tag[1],text:`Dokumentation${changes.length?" · "+changes.join(" · "):""}`,img:x.blob});
  });
  const milestones=await all(MS).catch(()=>[]);
  milestones.filter(x=>x.plantId===current).forEach(x=>events.push({date:new Date(x.createdAt||x.date),day:ageDays(p.originDate,new Date(x.createdAt||x.date)),icon:"🏆",title:x.title||"Milstolpe",text:x.description||""}));
  events.sort((a,b)=>a.date-b.date);
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🧬 Plantans livslinje</h2><div class="card">${events.map(e=>`<div style="position:relative;padding:0 0 18px 32px;margin-bottom:8px;border-left:2px solid var(--border)"><div style="position:absolute;left:-15px;top:0;width:28px;height:28px;border-radius:50%;background:var(--light);display:flex;align-items:center;justify-content:center">${e.icon}</div><div class="muted">Dag ${e.day} · ${e.date.toLocaleDateString("sv-SE")}</div><h3 style="margin:4px 0">${esc(e.title)}</h3><div>${esc(e.text)}</div>${e.img?`<img src="${URL.createObjectURL(e.img)}" style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;margin-top:8px">`:""}</div>`).join("")}</div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}


async function showAutoGrowthAnalysis(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const now=Date.now(), cutoff=now-14*86400000, prevCut=now-28*86400000;
  const keys=[["height","📏 Höjd","cm"],["leaves","🍃 Blad","blad"],["roots","🌱 Rötter","rötter"],["longestRoot","📐 Längsta rot","cm"]];
  const calc=(k,from,to)=>{
    const pts=im.filter(x=>{const t=new Date(x.createdAt).getTime();return t>=from&&t<=to&&Number.isFinite(Number(x.measurements?.[k]))}).map(x=>({t:new Date(x.createdAt).getTime(),v:Number(x.measurements[k])}));
    if(pts.length<2)return null;
    const a=pts[0],b=pts[pts.length-1],d=Math.max(1,(b.t-a.t)/86400000);return (b.v-a.v)/d;
  };
  const rows=keys.map(([k,label,u])=>{const recent=calc(k,cutoff,now),older=calc(k,prevCut,cutoff);let msg="För lite data";if(recent!==null&&older!==null){const ratio=Math.abs(older)<0.00001?(recent>0?2:recent<0?0:1):recent/older;if(recent>older*1.15)msg="🟢 Tillväxten ökar";else if(recent<older*0.85)msg="🟡 Tillväxten har avtagit";else msg="⚪ Tillväxten är relativt stabil";return {label,u,recent,older,msg}}return {label,u,recent,older,msg}});
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🧠 Automatisk tillväxtanalys</h2><div class="card"><p class="muted">Analysen jämför den senaste 14-dagarsperioden med de föregående 14 dagarna när tillräckligt med data finns.</p><div class="mm-analysis">${rows.map(r=>`<div class="acard"><div>${r.label}</div><div class="status">${r.msg}</div>${r.recent!==null?`<div class="muted">Senaste: ${r.recent>=0?"+":""}${r.recent.toFixed(2)} ${r.u}/dag${r.older!==null?` · Tidigare: ${r.older>=0?"+":""}${r.older.toFixed(2)} ${r.u}/dag`:""}</div>`:""}</div>`).join("")}</div></div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showGrowthForecast(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  if(im.length<2){alert("📈 Du behöver minst två dokumentationer med mätvärden för att göra en prognos.");return}
  const keys=[["height","📏 Höjd","cm"],["leaves","🍃 Blad","blad"],["roots","🌱 Rötter","rötter"],["longestRoot","📐 Längsta rot","cm"]];
  const forecasts=keys.map(([k,label,u])=>{
    const pts=im.map(x=>({t:new Date(x.createdAt).getTime(),v:Number(x.measurements?.[k])})).filter(x=>Number.isFinite(x.v));
    if(pts.length<2)return {label,u,ok:false};
    const a=pts[0],b=pts[pts.length-1],days=Math.max(1,(b.t-a.t)/86400000),rate=(b.v-a.v)/days;
    const future=Math.max(0,b.v+rate*30);
    return {label,u,ok:true,current:b.v,rate,future};
  });
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🔮 Tillväxtprognos</h2><div class="card"><p class="muted">Prognosen använder förändringen mellan den första och senaste mätningen och räknar fram ett linjärt estimat 30 dagar framåt. Det är en uppskattning, inte en garanti.</p><div class="mm-forecast">${forecasts.map(f=>f.ok?`<div class="fcard"><div>${f.label}</div><div class="big">${f.future.toFixed(f.u==="blad"||f.u==="rötter"?0:1)} ${f.u}</div><div class="muted">Nu: ${f.current} ${f.u}<br>Snitt: ${f.rate>=0?"+":""}${f.rate.toFixed(2)} ${f.u}/dag<br>Om 30 dagar: uppskattning</div></div>`:`<div class="fcard"><div>${f.label}</div><div class="muted">För lite mätdata</div></div>`).join("")}</div></div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showAdvancedGrowth(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const area=document.getElementById("statsArea");
  const points=im.map(x=>({day:ageDays(p.originDate,new Date(x.createdAt)),m:x.measurements||{}})).filter(x=>["height","leaves","roots"].some(k=>Number.isFinite(Number(x.m[k]))));
  if(!points.length){area.innerHTML='<h2 class="timelineTitle">📈 Tillväxtanalys</h2><div class="card empty"><div>📊</div><h3>Inte tillräckligt med data</h3><p class="muted">Lägg till mätningar i dokumentationerna.</p></div>';return}
  const vals=key=>points.map(x=>Number(x.m[key])).filter(Number.isFinite), avg=(key,n=points.length)=>{const a=points.slice(-n),first=a[0],last=a[a.length-1];if(!first||!last)return null;const d=last.day-first.day;if(d<=0)return null;const v=Number(last.m[key])-Number(first.m[key]);return v/d};
  const metrics=[["height","📏 Höjd","cm"],["leaves","🍃 Blad","st"],["roots","🌱 Rötter","st"]];
  const width=700,height=230,pad=42;
  const charts=metrics.map(([key,label,unit])=>{
    const data=points.map(x=>({x:x.day,y:Number(x.m[key])})).filter(v=>Number.isFinite(v.y));
    if(data.length<1)return "";
    const max=Math.max(...data.map(v=>v.y),1),min=Math.min(...data.map(v=>v.y),0),xr=Math.max(...data.map(v=>v.x),1),yr=Math.max(max-min,1);
    const pts=data.map(v=>`${pad+(v.x/xr)*(width-pad-10)},${height-pad-((v.y-min)/yr)*(height-pad-10)}`).join(" ");
    return `<div class="card"><div style="font-weight:800">${label}</div><svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;margin-top:8px"><line x1="${pad}" y1="${height-pad}" x2="${width-10}" y2="${height-pad}" stroke="currentColor" opacity=".2"/><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${data.map(v=>`<circle cx="${pad+(v.x/xr)*(width-pad-10)}" cy="${height-pad-((v.y-min)/yr)*(height-pad-10)}" r="4" fill="currentColor"/><title>Dag ${v.x}: ${v.y} ${unit}</title>`).join("")}</svg><div class="muted">Tillväxthastighet senaste ${Math.min(14,points.length?points[points.length-1].day||1:1)} dagar: ${avg(key,Math.min(3,points.length))===null?"—":avg(key,Math.min(3,points.length)).toFixed(2)} ${unit}/dag</div></div>`;
  }).join("");
  area.innerHTML=`<h2 class="timelineTitle">📈 Avancerad tillväxtanalys</h2>${charts}`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showHistory(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const area=document.getElementById("statsArea");
  const cards=im.map((x,i)=>{
    const m=x.measurements||{},prev=im[i+1]?.measurements||null;
    const delta=(k)=>prev&&Number.isFinite(Number(prev[k]))&&Number.isFinite(Number(m[k]))?Number(m[k])-Number(prev[k]):null;
    const d=ageDays(p.originDate,new Date(x.createdAt));
    return `<div class="card" data-tag="${x.tag||"normal"}" style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center"><b>📸 Dag ${d}</b><span>${tagBadge(x.tag)}</span><span class="muted">${new Date(x.createdAt).toLocaleDateString("sv-SE")}</span></div><img src="${URL.createObjectURL(x.blob)}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:14px;margin:10px 0"><div class="stats"><div class="stat"><small>📏 Höjd</small><b>${m.height||"—"} cm</b></div><div class="stat"><small>🍃 Blad</small><b>${m.leaves||"—"}</b></div><div class="stat"><small>🌱 Rötter</small><b>${m.roots||"—"}</b></div><div class="stat"><small>📐 Längsta rot</small><b>${m.longestRoot||"—"} cm</b></div></div>${prev?`<div style="margin-top:10px;padding:10px;background:var(--light);border-radius:12px"><b>Förändring sedan förra</b><div class="muted">${delta("height")!==null?`📏 ${delta("height")>=0?"+":""}${delta("height")} cm · `:""}${delta("leaves")!==null?`🍃 ${delta("leaves")>=0?"+":""}${delta("leaves")} blad · `:""}${delta("roots")!==null?`🌱 ${delta("roots")>=0?"+":""}${delta("roots")} rötter`:""}</div></div>`:""}${x.note?`<p style="margin-bottom:0">📝 ${esc(x.note)}</p>`:""}</div>`;
  }).join("");
  area.innerHTML=`<h2 class="timelineTitle">📅 Dokumentationshistorik</h2><div class="card"><label style="font-size:12px;font-weight:700">🏷️ Visa tagg</label><select id="historyTag" onchange="filterHistoryTag()" style="width:100%;box-sizing:border-box;padding:12px;margin-top:6px;border:1px solid var(--border);border-radius:12px;font:inherit"><option value="all">Alla</option>${Object.entries(TAG_META).map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join("")}</select></div><div id="historyCards">${cards||'<div class="card empty"><div>📷</div><h3>Ingen dokumentation ännu</h3></div>'}`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}

function filterHistoryTag(){
  const tag=document.getElementById("historyTag")?.value||"all";
  document.querySelectorAll("#historyCards .card").forEach(c=>c.style.display=(tag==="all"||c.dataset.tag===tag)?"":"none");
}
async function showLatestComparison(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const area=document.getElementById("statsArea");
  if(im.length<2){area.innerHTML='<h2 class="timelineTitle">📸 Förra → Nu</h2><div class="card empty"><div>📷</div><h3>Behöver två dokumentationer</h3><p class="muted">Dokumentera plantan minst två gånger för att kunna jämföra.</p></div>';return}
  const a=im[im.length-2],b=im[im.length-1],am=a.measurements||{},bm=b.measurements||{},days=Math.max(0,ageDays(new Date(a.createdAt),new Date(b.createdAt)));
  const row=(label,k,unit)=>{const x=Number(am[k]),y=Number(bm[k]);if(!Number.isFinite(x)||!Number.isFinite(y))return "";const d=y-x;return `<div class="infoRow"><span>${label}</span><b>${x} → ${y} ${unit} <span class="${d>=0?"":"muted"}">(${d>=0?"+":""}${d})</span></b></div>`};
  area.innerHTML=`<h2 class="timelineTitle">📸 Förra → Nu</h2><div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><img id="cmpA" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"><img id="cmpB" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"></div><div class="muted" style="display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:6px"><span>Förra<br>${new Date(a.createdAt).toLocaleDateString("sv-SE")}</span><span>Nu<br>${new Date(b.createdAt).toLocaleDateString("sv-SE")}</span></div></div><div class="card"><h3 style="margin-top:0">📊 Förändring på ${days} dagar</h3>${row("📏 Höjd","height","cm")}${row("🍃 Blad","leaves","st")}${row("🌱 Rötter","roots","st")}${row("📐 Längsta rot","longestRoot","cm")}</div>`;
  $("cmpA").src=URL.createObjectURL(a.blob);$("cmpB").src=URL.createObjectURL(b.blob);area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showReport(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const first=im[0],last=im[im.length-1],fm=first?.measurements||{},lm=last?.measurements||{},e=p.economy||{};
  const sum=(k)=>Number.isFinite(Number(fm[k]))&&Number.isFinite(Number(lm[k]))?Number(lm[k])-Number(fm[k]):null;
  const costs=(e.costs||[]).reduce((a,x)=>a+Number(x.amount||0),0),sales=(e.sales||[]).reduce((a,x)=>a+Number(x.amount||0),0);
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">📄 Plant-rapport</h2><div id="plantReport" class="card" style="background:white">
    <div style="font-size:12px;color:#6d786f">🌿 MONSTERA MANAGER</div><h1 style="margin:4px 0">${esc(p.name)}</h1>
    <div class="muted">${statusBadge(p.status||"node")} · Ålder ${ageDays(p.originDate,new Date())} dagar</div>
    <hr style="border:0;border-top:1px solid var(--border);margin:14px 0">
    <div class="infoRow"><span>🌱 Ursprung</span><b>${new Date(p.originDate).toLocaleDateString("sv-SE")}</b></div>
    <div class="infoRow"><span>📸 Dokumentationer</span><b>${im.length}</b></div>
    <div class="infoRow"><span>📏 Höjd</span><b>${lm.height||"—"} cm ${sum("height")!==null?`(${sum("height")>=0?"+":""}${sum("height")} cm)`:""}</b></div>
    <div class="infoRow"><span>🍃 Blad</span><b>${lm.leaves||"—"} ${sum("leaves")!==null?`(${sum("leaves")>=0?"+":""}${sum("leaves")})`:""}</b></div>
    <div class="infoRow"><span>🌱 Rötter</span><b>${lm.roots||"—"} ${sum("roots")!==null?`(${sum("roots")>=0?"+":""}${sum("roots")})`:""}</b></div>
    <div class="infoRow"><span>💰 Kostnad</span><b>${costs.toFixed(0)} kr</b></div>
    <div class="infoRow"><span>💵 Försäljning</span><b>${sales.toFixed(0)} kr</b></div>
    <div class="infoRow"><span>📈 Resultat</span><b>${sales-costs>=0?"+":""}${(sales-costs).toFixed(0)} kr</b></div>
    ${first&&last?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px"><img id="repFirst" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"><img id="repLast" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"></div>`:""}
  </div><button class="save" onclick="printReport()">🖨️ Spara/dela rapport</button>`;
  if(first&&last){$("repFirst").src=URL.createObjectURL(first.blob);$("repLast").src=URL.createObjectURL(last.blob)}
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
function printReport(){
  const r=document.getElementById("plantReport");
  if(!r)return;
  const w=window.open("","_blank");
  if(!w){alert("Tillåt popup-fönster för att skriva ut rapporten.");return}
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Monstera Manager - rapport</title>
  <style>
  body{font-family:Arial,sans-serif;padding:24px;max-width:800px;margin:auto;color:#172019}
  img{max-width:48%;height:auto;border-radius:14px}
  .card{padding:16px;border:1px solid #d9e3dc;border-radius:16px;margin:10px 0}
  button{display:none}
  </style></head><body>${r.outerHTML}

</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(),300);
}
