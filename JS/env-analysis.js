async function showEnvironmentGrowth(){
 const area=document.getElementById("statsArea");
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const metric=ims.map(x=>({d:new Date(x.createdAt),v:Number((x.measurements||{}).height)})).filter(x=>Number.isFinite(x.v));
 const envs=[
  ["Temperatur","tempLogs","temp","🌡️","°C"],
  ["Luftfuktighet","humidityLogs","hum","💦","%"],
  ["Ljustimmar","lightLogs","hours","💡","h/dag"]
 ];
 const pearson=(a,b)=>{const n=a.length;if(n<3)return null;const ma=a.reduce((x,y)=>x+y,0)/n,mb=b.reduce((x,y)=>x+y,0)/n;let xy=0,xx=0,yy=0;for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;xy+=x*y;xx+=x*x;yy+=y*y}return xx&&yy?xy/Math.sqrt(xx*yy):null};
 const cards=[];
 for(const [label,store,key,icon,unit] of envs){
   const logs=(await all(store)).map(x=>({d:new Date(x.date),v:Number(x[key])})).filter(x=>Number.isFinite(x.v));
   const pairs=[];
   for(const im of metric){let best=null,dist=Infinity;for(const e of logs){const dd=Math.abs(e.d-im.d);if(dd<dist){dist=dd;best=e}}if(best&&dist<=3*86400000)pairs.push([best.v,im.v])}
   const r=pearson(pairs.map(x=>x[0]),pairs.map(x=>x[1]));
   cards.push(`<div class="mm-corr-card"><div class="mm-corr-title">${icon} ${label} → höjd</div><div class="mm-corr-value">${r===null?"För lite matchad data":(r>0?"+":"")+r.toFixed(2)}</div><div class="mm-corr-note">${r===null?"Behöver minst 3 matchade mätpunkter.":Math.abs(r)>=0.7?"Starkt statistiskt samband i den insamlade datan.":Math.abs(r)>=0.4?"Måttligt samband i den insamlade datan.":"Svagt samband i den insamlade datan."} Matchning: ${pairs.length} punkter.</div>${r===null?"":`<div class="mm-corr-bar"><div class="mm-corr-fill" style="width:${Math.min(100,Math.abs(r)*100)}%"></div></div>`}</div>`);
 }
 area.innerHTML=`<h2 class="timelineTitle">🔗 Miljö → tillväxt</h2><div class="card"><div class="mm-corr">${cards.join("")}</div><div class="mm-corr-legend">Korrelationsvärde r: +1 = positivt samband, 0 = inget linjärt samband, −1 = negativt samband. Detta visar samband, inte orsakssamband. Miljömätningar matchas mot närmaste tillväxtmätning inom 3 dagar.</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showEnvironmentAnalysis(){
 const area=document.getElementById("statsArea");
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const growth=ims.map(x=>({d:new Date(x.createdAt),h:Number((x.measurements||{}).height),r:Number((x.measurements||{}).roots),l:Number((x.measurements||{}).leaves)})).filter(x=>Number.isFinite(x.h)||Number.isFinite(x.r)||Number.isFinite(x.l));
 const stores=[["🌡️","Temperatur","tempLogs","temp","°C"],["💦","Luftfuktighet","humidityLogs","hum","%"],["💡","Ljus","lightLogs","hours","h/dag"]];
 const cards=[];
 for(const [icon,label,store,key,unit] of stores){
  const logs=(await all(store)).map(x=>({d:new Date(x.date),v:Number(x[key])})).filter(x=>Number.isFinite(x.v));
  let best=null,bestDelta=-Infinity;
  for(let i=1;i<growth.length;i++){
   const prev=growth[i-1],cur=growth[i], target=Number.isFinite(cur.h)&&Number.isFinite(prev.h)?cur.h-prev.h:null;
   if(target===null)continue;
   let vals=logs.filter(e=>e.d<=cur.d&&e.d>=new Date(cur.d-7*86400000));
   if(!vals.length)continue;
   const avg=vals.reduce((a,b)=>a+b.v,0)/vals.length;
   if(target>bestDelta){bestDelta=target;best={avg,target,count:vals.length}}
  }
  cards.push(`<div class="mm-analysis-card"><div class="mm-analysis-label">${icon} ${label}</div><div class="mm-analysis-big">${best?best.avg.toFixed(1)+" "+unit:"Inte tillräckligt med data"}</div><div class="mm-analysis-small">${best?`Den bästa dokumenterade höjdökningen i en mätperiod hade detta genomsnitt. Tillväxt: ${best.target>0?"+":""}${best.target.toFixed(2)} cm. ${best.count} miljömätningar.`:"Behöver fler tillväxt- och miljömätningar."}</div></div>`);
 }
 const water=(await all("waterLogs")).sort((a,b)=>new Date(a.date)-new Date(b.date));
 let waterGap="—"; if(water.length>1){const gaps=[];for(let i=1;i<water.length;i++)gaps.push((new Date(water[i].date)-new Date(water[i-1].date))/86400000);waterGap=(gaps.reduce((a,b)=>a+b,0)/gaps.length).toFixed(1)+" dagar";}
 area.innerHTML=`<h2 class="timelineTitle">📊 Miljöanalys</h2><div class="card"><div class="mm-analysis"><div class="mm-analysis-grid">${cards.join("")}<div class="mm-analysis-card"><div class="mm-analysis-label">💧 Vattning</div><div class="mm-analysis-big">${waterGap}</div><div class="mm-analysis-small">Genomsnittligt intervall mellan registrerade vattningar.</div></div></div><div class="mm-analysis-card"><div class="mm-analysis-label">🧪 Datakvalitet</div><div class="mm-analysis-big">${growth.length} tillväxtpunkter · ${water.length} vattningar</div><div class="mm-analysis-small">Analysen blir mer tillförlitlig när vi får fler mätningar över längre tid och med jämn dokumentation.</div></div></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showExperimentReport(){
 const area=document.getElementById("statsArea");
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const m=ims.map(x=>({d:new Date(x.createdAt),h:Number((x.measurements||{}).height),r:Number((x.measurements||{}).roots),l:Number((x.measurements||{}).leaves)}));
 const num=k=>m.map(x=>x[k]).filter(Number.isFinite), first=m[0],last=m.at(-1);
 const delta=(k)=>{const a=num(k);return a.length>1?a.at(-1)-a[0]:null};
 const waters=await all("waterLogs"), temps=await all("tempLogs"), hums=await all("humidityLogs"), lights=await all("lightLogs"), subs=await all("substrateLogs"), events=await all("events");
 const avg=a=>{const v=a.map(Number).filter(Number.isFinite);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};
 const days=first&&last?Math.max(0,(last.d-first.d)/86400000):0;
 const h=delta("h"),r=delta("r"),l=delta("l");
 const dateRange=first&&last?`${first.d.toLocaleDateString("sv-SE")} → ${last.d.toLocaleDateString("sv-SE")}`:"Ingen tillväxtperiod ännu";
 const summary=h!==null&&days>0?`Dokumenterad höjdutveckling: ${h>=0?"+":""}${h.toFixed(2)} cm över ${days.toFixed(0)} dagar (${(h/days*30).toFixed(2)} cm/månad, om takten skulle fortsätta).`: "För få höjdmätningar för en tillväxtsammanfattning.";
 area.innerHTML=`<h2 class="timelineTitle">🧬 Experimentrapport</h2><div class="card"><div class="mm-report"><div class="mm-report-grid"><div class="mm-report-card"><div class="mm-report-label">📅 Dokumentationsperiod</div><div class="mm-report-big">${dateRange}</div></div><div class="mm-report-card"><div class="mm-report-label">📸 Tillväxtmätningar</div><div class="mm-report-big">${ims.length}</div></div><div class="mm-report-card"><div class="mm-report-label">📏 Höjd</div><div class="mm-report-big">${h===null?"—":(h>=0?"+":"")+h.toFixed(2)+" cm"}</div></div><div class="mm-report-card"><div class="mm-report-label">🌱 Rötter</div><div class="mm-report-big">${r===null?"—":(r>=0?"+":"")+r}</div></div><div class="mm-report-card"><div class="mm-report-label">🍃 Blad</div><div class="mm-report-big">${l===null?"—":(l>=0?"+":"")+l}</div></div><div class="mm-report-card"><div class="mm-report-label">🧪 Händelser</div><div class="mm-report-big">${events.length}</div></div></div><div class="mm-report-section"><h3>📋 Sammanfattning</h3><div>${summary}</div><div class="mm-report-note">Rapporten beskriver observerade samband och dokumenterade förändringar. Den bevisar inte att en viss miljöfaktor orsakat tillväxten.</div></div><div class="mm-report-section"><h3>🌡️ Miljödata</h3><div class="mm-report-grid"><div>🌡️ Temperatur: <b>${avg(temps.map(x=>x.temp))===null?"—":avg(temps.map(x=>x.temp)).toFixed(1)+" °C"}</b></div><div>💦 Luftfuktighet: <b>${avg(hums.map(x=>x.hum))===null?"—":avg(hums.map(x=>x.hum)).toFixed(1)+" %"}</b></div><div>💡 Ljustid: <b>${avg(lights.map(x=>x.hours))===null?"—":avg(lights.map(x=>x.hours)).toFixed(1)+" h/dag"}</b></div><div>💧 Vattningar: <b>${waters.length}</b></div></div></div><div class="mm-report-section"><h3>🪴 Odlingsmiljö</h3><div>${subs.length?`Senast dokumenterade substrat: <b>${esc(subs.at(-1).mix||"Ej angivet")}</b>.`: "Inget substrat är registrerat ännu."}</div></div><div class="mm-report-section"><h3>📊 Datakvalitet</h3><div>${ims.length>=5?"Bra grund för fortsatt trendanalys.":ims.length>=3?"Tillräckligt för preliminära mönster, men mer data behövs.":"Experimentet är fortfarande i ett tidigt datainsamlingsskede."}</div></div></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showHealth(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const area=document.getElementById("statsArea");
  if(!im.length){area.innerHTML='<h2 class="timelineTitle">🧪 Plasthälsa</h2><div class="card empty"><div>🌱</div><h3>Ingen data ännu</h3><p class="muted">Lägg till en dokumentation så kan appen börja bedöma utvecklingen.</p></div>';return}
  const last=im[im.length-1],prev=im.length>1?im[im.length-2]:null;
  const days=Math.floor((Date.now()-new Date(last.createdAt))/86400000);
  const m=last.measurements||{}, pm=prev?.measurements||{};
  let score=0,notes=[];
  if(days<=14){score+=1}else if(days>30){score-=1;notes.push(`Det har gått ${days} dagar sedan senaste dokumentationen.`)}
  for(const k of ["leaves","roots","height"]){
    if(Number.isFinite(Number(m[k]))&&Number.isFinite(Number(pm[k]))){
      if(Number(m[k])>Number(pm[k]))score+=1;
    }
  }
  let level="🟡 Långsam utveckling",desc="Följ plantan och dokumentera igen snart.";
  if(score>=2){level="🟢 Bra utveckling";desc="Senaste data visar en positiv eller regelbunden utveckling."}
  if(score<=0){level="🔴 Bör kontrolleras";desc="Det finns få tecken på ny utveckling eller dokumentationen är gammal."}
  area.innerHTML=`<h2 class="timelineTitle">🧪 Plasthälsa</h2><div class="card" style="text-align:center"><div style="font-size:34px">${level.split(" ")[0]}</div><h2 style="margin:6px 0">${esc(level.substring(level.indexOf(" ")+1))}</h2><p class="muted">${esc(desc)}</p></div>
  <div class="card"><h3 style="margin-top:0">🔎 Underlag</h3><div class="infoRow"><span>Senaste dokumentation</span><b>${dt(last.createdAt).d}</b></div><div class="infoRow"><span>Dagar sedan</span><b>${days}</b></div><div class="infoRow"><span>Senaste blad</span><b>${m.leaves||"—"}</b></div><div class="infoRow"><span>Senaste rötter</span><b>${m.roots||"—"}</b></div>${notes.map(n=>`<p class="muted">⚠️ ${esc(n)}</p>`).join("")}</div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showMilestones(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const events=[];
  let prev=null;
  for(const x of im){
    const m=x.measurements||{}, d=ageDays(p.originDate,new Date(x.createdAt));
    if(!prev){events.push({date:x.createdAt,icon:"📸",title:"Första dokumentationen",text:"Plantans dokumentation börjar här."})}
    else{
      const pairs=[["leaves","🍃","Nytt blad"],["roots","🌱","Nya rötter"],["height","📏","Tillväxt i höjd"],["longestRoot","📐","Roten har vuxit"],["leafSize","🍃","Bladstorleken har ökat"]];
      for(const [k,icon,title] of pairs){
        const a=Number(prev[k]),b=Number(m[k]);
        if(Number.isFinite(a)&&Number.isFinite(b)&&b>a)events.push({date:x.createdAt,icon,title,text:`${a} → ${b} ${k==="leaves"||k==="roots"?"st":"cm"}`});
      }
    }
    prev=m;
  }
  const manual=p.milestones||{};
  if(manual.plantedDate)events.unshift({date:manual.plantedDate,icon:"🪴",title:"Planterad",text:"Manuellt registrerad milstolpe."});
  events.sort((a,b)=>new Date(a.date)-new Date(b.date));
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🏆 Milstolpar</h2><div class="card">${events.length?events.map(e=>`<div style="display:flex;gap:12px;padding:13px 0;border-bottom:1px solid var(--border)"><div style="font-size:25px">${e.icon}</div><div><b>${esc(e.title)}</b><div class="muted">${new Date(e.date).toLocaleDateString("sv-SE",{year:"numeric",month:"short",day:"numeric"})} · Dag ${ageDays(p.originDate,new Date(e.date))}</div><div style="margin-top:3px">${esc(e.text)}</div></div></div>`).join(""):"<p class='muted'>Inga milstolpar ännu.</p>"}</div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showGrowth(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const area=document.getElementById("statsArea");
  const metric=(key,label,unit)=>{
    const vals=im.map(x=>({day:ageDays(p.originDate,new Date(x.createdAt)),v:Number(x.measurements?.[key])})).filter(x=>Number.isFinite(x.v));
    if(!vals.length)return `<div class="card"><b>${label}</b><p class="muted">Ingen mätdata ännu.</p></div>`;
    const min=Math.min(...vals.map(x=>x.v)),max=Math.max(...vals.map(x=>x.v)),range=Math.max(max-min,1);
    const w=340,h=150,pad=28;
    const points=vals.map((x,i)=>{const xx=pad+(vals.length===1?0:i*(w-pad*2)/(vals.length-1));const yy=h-pad-(x.v-min)/range*(h-pad*2);return [xx,yy,x]});
    const poly=points.map(x=>x[0].toFixed(1)+","+x[1].toFixed(1)).join(" ");
    const circles=points.map(x=>`<circle cx="${x[0]}" cy="${x[1]}" r="4" fill="currentColor"><title>Dag ${x[2].day}: ${x[2].v} ${unit}</title></circle>`).join("");
    return `<div class="card"><b>${label}</b><div style="overflow:auto"><svg viewBox="0 0 ${w} ${h}" style="width:100%;min-width:300px;height:170px;color:var(--primary)"><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#dbe5dc"/><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" stroke="#dbe5dc"/><polyline points="${poly}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${circles}<text x="${pad}" y="${h-7}" font-size="9" fill="#6d786f">Dag ${vals[0].day}</text><text x="${w-pad}" y="${h-7}" text-anchor="end" font-size="9" fill="#6d786f">Dag ${vals[vals.length-1].day}</text></svg></div><div class="muted">Min ${min} ${unit} · Max ${max} ${unit}</div></div>`;
  };
  area.innerHTML=`<h2 class="timelineTitle">📈 Tillväxtkurvor</h2>${metric("height","📏 Höjd","cm")}${metric("leaves","🍃 Antal blad","st")}${metric("roots","🌱 Antal rötter","st")}${metric("longestRoot","📐 Längsta rot","cm")}${metric("leafSize","🍃 Bladstorlek","cm")}`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showLifeHistory(){
  const p=await one(PS,current), im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const first=im[0], latest=im[im.length-1];
  const milestones=p.milestones||{};
  const fmt=v=>v?new Date(v).toLocaleDateString("sv-SE",{year:"numeric",month:"long",day:"numeric"}):"Inte registrerat";
  const findDate=(test)=>{const x=im.find(i=>test(i));return x?x.createdAt:null};
  const firstRoot=milestones.firstRoot||findDate(i=>Number(i.measurements?.roots||0)>0);
  const firstLeaf=milestones.firstLeaf||findDate(i=>Number(i.measurements?.leaves||0)>0);
  const planted=milestones.plantedDate;
  const rows=[
    ["🌱 Ursprung",p.originDate],
    ["📸 Första dokumentation",first?.createdAt],
    ["🌱 Första rot dokumenterad",firstRoot],
    ["🍃 Första blad dokumenterat",firstLeaf],
    ["🪴 Planterad",planted],
    ["📸 Senaste dokumentation",latest?.createdAt],
  ];
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🌱 Livshistoria</h2>
  <div class="card"><h3 style="margin-top:0">${esc(p.name)}</h3>${rows.map(r=>`<div class="infoRow"><span>${r[0]}</span><b>${fmt(r[1])}</b></div>`).join("")}</div>
  <div class="card"><h3 style="margin-top:0">✏️ Milstolpar</h3>
    <div class="field"><label>🪴 Planterad datum</label><input id="milPlanted" type="date" value="${planted?String(planted).slice(0,10):""}"></div>
    <button class="save" onclick="saveMilestones()">💾 Spara milstolpe</button>
  </div>
  <div class="card"><h3 style="margin-top:0">📜 Tidslinje</h3>${im.map((x,i)=>`<div class="infoRow"><span>📸 ${i+1}. ${dt(x.createdAt).d}</span><b>Dag ${ageDays(p.originDate,new Date(x.createdAt))}</b></div>`).join("")||'<p class="muted">Ingen dokumentation ännu.</p>'}</div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveMilestones(){
  const p=await one(PS,current);p.milestones=p.milestones||{};
  const v=document.getElementById("milPlanted").value;p.milestones.plantedDate=v?v+"T12:00:00":null;
  await put(PS,p);showLifeHistory();
}