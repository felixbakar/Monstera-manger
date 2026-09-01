async function showGrowthStats(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const area=document.getElementById("statsArea");
 if(!ims.length){area.innerHTML='<div class="card"><h2 class="timelineTitle">📊 Tillväxt</h2><div class="mm-growth-empty">Ingen dokumentation ännu.</div></div>';return}
 const first=ims[0],last=ims[ims.length-1],a=first.measurements||{},b=last.measurements||{};
 const days=Math.max(0,Math.round((new Date(last.createdAt)-new Date(first.createdAt))/86400000));
 const metric=(label,key,unit)=>{
   const x=Number(a[key]),y=Number(b[key]); if(!Number.isFinite(x)||!Number.isFinite(y))return "";
   const delta=y-x; return `<div class="mm-growth-card"><div><div class="mm-growth-main">${label}</div><div class="mm-growth-sub">${x} ${unit} → ${y} ${unit}</div></div><div class="mm-growth-value">${delta>=0?"+":""}${delta} ${unit}</div></div>`;
 };
 area.innerHTML=`<h2 class="timelineTitle">📊 Tillväxt — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-growth"><div class="mm-growth-sub">Första dokumentation: ${new Date(first.createdAt).toLocaleDateString("sv-SE")} · Senaste: ${new Date(last.createdAt).toLocaleDateString("sv-SE")} · ⏱️ ${days} dagar</div>${metric("📏 Höjd","height","cm")}${metric("🍃 Blad","leaves","blad")}${metric("🌱 Rötter","roots","rötter")}${metric("📐 Längsta rot","longestRoot","cm")}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showAutoBeforeAfter(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const area=document.getElementById("statsArea");
 if(ims.length<2){area.innerHTML='<div class="card"><h2 class="timelineTitle">🎞️ Före / efter</h2><div class="mm-growth-empty">Minst två bilder behövs.</div></div>';return}
 const before=ims[0],after=ims[ims.length-1],db=new Date(before.createdAt),da=new Date(after.createdAt);
 const days=Math.max(0,Math.round((da-db)/86400000));
 const b=before.measurements||{},a=after.measurements||{};
 const diff=(k,u)=>{const x=Number(b[k]),y=Number(a[k]);return Number.isFinite(x)&&Number.isFinite(y)?` · ${y-x>=0?"+":""}${y-x} ${u}`:""};
 area.innerHTML=`<h2 class="timelineTitle">🎞️ Automatisk före / efter — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-auto-beforeafter"><div class="mm-ab-card"><div class="mm-ab-title">FÖRE · Dag ${ageDays(p.originDate,db)}</div><img src="${URL.createObjectURL(before.blob)}"><div class="mm-ab-meta">${db.toLocaleDateString("sv-SE")} · ${esc(before.note||"Dokumentation")}</div></div><div class="mm-ab-card"><div class="mm-ab-title">EFTER · Dag ${ageDays(p.originDate,da)}</div><img src="${URL.createObjectURL(after.blob)}"><div class="mm-ab-meta">${da.toLocaleDateString("sv-SE")} · ${esc(after.note||"Dokumentation")}</div></div></div><div class="mm-ab-gap">⏱️ ${days} ${days===1?"dag":"dagar"} · 📊 Höjd${diff("height","cm")} · 🍃 Blad${diff("leaves","blad")} · 🌱 Rötter${diff("roots","rötter")}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showGrowthAnalysis(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const area=document.getElementById("statsArea");
 if(ims.length<2){area.innerHTML='<div class="card"><h2 class="timelineTitle">📈 Tillväxtanalys</h2><div class="mm-growth-empty">Minst två dokumentationer behövs för analys.</div></div>';return}
 const first=ims[0],last=ims[ims.length-1],d1=new Date(first.createdAt),d2=new Date(last.createdAt);
 const weeks=Math.max((d2-d1)/604800000,1/7), days=Math.max(Math.round((d2-d1)/86400000),1);
 const a=first.measurements||{},b=last.measurements||{};
 const metric=(label,key,unit)=>{const x=Number(a[key]),y=Number(b[key]);if(!Number.isFinite(x)||!Number.isFinite(y))return `<div class="mm-analysis-card"><div class="mm-analysis-label">${label}</div><div class="mm-analysis-label">Ingen tillräcklig mätdata ännu</div></div>`;const delta=y-x,rate=delta/weeks;return `<div class="mm-analysis-card"><div class="mm-analysis-label">${label}</div><div class="mm-analysis-big">${delta>=0?"+":""}${delta} ${unit}</div><div class="mm-analysis-label">${x} → ${y} ${unit} · ${rate>=0?"+":""}${rate.toFixed(2)} ${unit}/vecka</div></div>`};
 area.innerHTML=`<h2 class="timelineTitle">📈 Tillväxtanalys — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-analysis"><div class="mm-analysis-card"><div class="mm-analysis-label">Dokumenterad period</div><div class="mm-analysis-big">${days} dagar</div><div class="mm-analysis-label">${d1.toLocaleDateString("sv-SE")} → ${d2.toLocaleDateString("sv-SE")}</div></div>${metric("📏 Höjd","height","cm")}${metric("🍃 Blad","leaves","blad")}${metric("🌱 Rötter","roots","rötter")}${metric("📐 Längsta rot","longestRoot","cm")}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



function mmDrawChart(canvas,points,label,unit){
 const ctx=canvas.getContext("2d"),dpr=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
 canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
 if(points.length<2){ctx.fillText("Minst två mätningar behövs",16,30);return}
 const vals=points.map(x=>x.v),min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
 const pad={l:38,r:14,t:18,b:28},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
 ctx.font="11px sans-serif";ctx.fillText(label,10,14);
 ctx.beginPath();
 points.forEach((p,i)=>{const x=pad.l+(i/(points.length-1))*pw,y=pad.t+ph-((p.v-min)/range)*ph;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
 ctx.stroke();
 points.forEach((p,i)=>{const x=pad.l+(i/(points.length-1))*pw,y=pad.t+ph-((p.v-min)/range)*ph;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();if(i===0||i===points.length-1)ctx.fillText(`${p.v} ${unit}`,x-15,y-8)});
 ctx.fillText(`${points[0].date}`,pad.l,h-8);ctx.fillText(`${points.at(-1).date}`,w-72,h-8);
}
async function showGrowthChart(key="height"){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const defs={height:["📏 Höjd","cm"],leaves:["🍃 Blad","blad"],roots:["🌱 Rötter","rötter"],longestRoot:["📐 Längsta rot","cm"]};
 const [label,unit]=defs[key];
 const points=ims.map(im=>({v:Number((im.measurements||{})[key]),date:new Date(im.createdAt).toLocaleDateString("sv-SE")})).filter(x=>Number.isFinite(x.v));
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">📊 Tillväxtdiagram — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-chart-controls">${Object.entries(defs).map(([k,v])=>`<button class="${k===key?"active":""}" onclick="showGrowthChart('${k}')">${v[0]}</button>`).join("")}</div><canvas id="mmGrowthCanvas" class="mm-chart"></canvas><div class="mm-growth-empty">${points.length} dokumenterade mätpunkter för ${label.toLowerCase()}.</div></div>`;
 mmDrawChart(document.getElementById("mmGrowthCanvas"),points,label,unit);
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showMeasurementHistory(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const area=document.getElementById("statsArea");
 const rows=ims.map(im=>{const d=new Date(im.createdAt),m=im.measurements||{};return `<tr><td>Dag ${ageDays(p.originDate,d)}<br><span class="muted">${d.toLocaleDateString("sv-SE")}</span></td><td>${Number.isFinite(Number(m.height))?m.height+" cm":"—"}</td><td>${Number.isFinite(Number(m.leaves))?m.leaves:"—"}</td><td>${Number.isFinite(Number(m.roots))?m.roots:"—"}</td><td>${Number.isFinite(Number(m.longestRoot))?m.longestRoot+" cm":"—"}</td></tr>`}).join("");
 area.innerHTML=`<h2 class="timelineTitle">📏 Mätvärdeshistorik — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-history-wrap"><table class="mm-history"><thead><tr><th>Dokumentation</th><th>Höjd</th><th>Blad</th><th>Rötter</th><th>Längsta rot</th></tr></thead><tbody>${rows||"<tr><td colspan='5'>Ingen mätdata ännu.</td></tr>"}</tbody></table></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showLeafStats(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const vals=ims.map(im=>({im,d:new Date(im.createdAt),v:Number((im.measurements||{}).leaves)})).filter(x=>Number.isFinite(x.v));
 const area=document.getElementById("statsArea");
 if(!vals.length){area.innerHTML='<div class="card"><h2 class="timelineTitle">🍃 Bladstatistik</h2><div class="mm-growth-empty">Ingen bladmätning ännu.</div></div>';return}
 const first=vals[0].v,last=vals.at(-1).v,delta=last-first;
 let events=[];
 for(let i=1;i<vals.length;i++){const diff=vals[i].v-vals[i-1].v;if(diff>0)events.push({n:diff,d:Math.round((vals[i].d-vals[i-1].d)/86400000),date:vals[i].d})}
 const avg=events.length?events.reduce((a,e)=>a+e.d,0)/events.length:null;
 area.innerHTML=`<h2 class="timelineTitle">🍃 Bladstatistik — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-leaf-stats"><div class="mm-leaf-card"><div class="mm-leaf-sub">Första mätning</div><div class="mm-leaf-big">${first} 🍃</div></div><div class="mm-leaf-card"><div class="mm-leaf-sub">Senaste mätning</div><div class="mm-leaf-big">${last} 🍃</div></div><div class="mm-leaf-card"><div class="mm-leaf-sub">Förändring</div><div class="mm-leaf-big">${delta>=0?"+":""}${delta}</div></div><div class="mm-leaf-card"><div class="mm-leaf-sub">Snitt mellan ökningar</div><div class="mm-leaf-big">${avg===null?"—":avg.toFixed(1)+" dagar"}</div></div></div><div class="mm-leaf-events">${events.length?events.map(e=>`<div class="mm-leaf-event">🍃 +${e.n} blad · ${e.d} dagar efter föregående ökning · ${e.date.toLocaleDateString("sv-SE")}</div>`).join(""):"<div class='mm-growth-empty'>Ingen tydlig bladökning mellan mätpunkterna ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showRootStats(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const vals=ims.map(im=>({im,d:new Date(im.createdAt),roots:Number((im.measurements||{}).roots),longest:Number((im.measurements||{}).longestRoot)}));
 const rootVals=vals.filter(x=>Number.isFinite(x.roots)), longVals=vals.filter(x=>Number.isFinite(x.longest));
 const area=document.getElementById("statsArea");
 if(!rootVals.length&&!longVals.length){area.innerHTML='<div class="card"><h2 class="timelineTitle">🌱 Rotstatistik</h2><div class="mm-growth-empty">Ingen rotmätning ännu.</div></div>';return}
 const first=rootVals[0]?.roots,last=rootVals.at(-1)?.roots,delta=(first!==undefined&&last!==undefined)?last-first:null;
 const lf=longVals[0]?.longest,ll=longVals.at(-1)?.longest,ld=(lf!==undefined&&ll!==undefined)?ll-lf:null;
 let events=[];
 for(let i=1;i<rootVals.length;i++){const diff=rootVals[i].roots-rootVals[i-1].roots;if(diff>0)events.push({n:diff,d:Math.round((rootVals[i].d-rootVals[i-1].d)/86400000),date:rootVals[i].d})}
 const avg=events.length?events.reduce((a,e)=>a+e.d,0)/events.length:null;
 area.innerHTML=`<h2 class="timelineTitle">🌱 Rotstatistik — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-root-stats"><div class="mm-root-card"><div class="mm-root-sub">Rötter</div><div class="mm-root-big">${first===undefined?"—":first} → ${last===undefined?"—":last}</div><div class="mm-root-sub">${delta===null?"":(delta>=0?"+":"")+delta+" rötter"}</div></div><div class="mm-root-card"><div class="mm-root-sub">Längsta rot</div><div class="mm-root-big">${lf===undefined?"—":lf+" cm"} → ${ll===undefined?"—":ll+" cm"}</div><div class="mm-root-sub">${ld===null?"":(ld>=0?"+":"")+ld+" cm"}</div></div><div class="mm-root-card"><div class="mm-root-sub">Rotökningar</div><div class="mm-root-big">${events.length}</div></div><div class="mm-root-card"><div class="mm-root-sub">Snitt mellan ökningar</div><div class="mm-root-big">${avg===null?"—":avg.toFixed(1)+" dagar"}</div></div></div><div class="mm-root-events">${events.length?events.map(e=>`<div class="mm-root-event">🌱 +${e.n} rötter · ${e.d} dagar efter föregående ökning · ${e.date.toLocaleDateString("sv-SE")}</div>`).join(""):"<div class='mm-growth-empty'>Ingen tydlig rotökning mellan mätpunkterna ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showVariegation(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const vals=ims.map(im=>({im,d:new Date(im.createdAt),v:Number((im.measurements||{}).variegation)})).filter(x=>Number.isFinite(x.v));
 const area=document.getElementById("statsArea");
 const avg=vals.length?vals.reduce((a,x)=>a+x.v,0)/vals.length:null, first=vals[0]?.v,last=vals.at(-1)?.v;
 area.innerHTML=`<h2 class="timelineTitle">🤍 Variegeringsanalys — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-var"><div class="mm-var-card"><div class="mm-var-sub">Första registrering</div><div class="mm-var-big">${first===undefined?"—":first+"%"}</div></div><div class="mm-var-card"><div class="mm-var-sub">Senaste registrering</div><div class="mm-var-big">${last===undefined?"—":last+"%"}</div></div><div class="mm-var-card"><div class="mm-var-sub">Förändring</div><div class="mm-var-big">${first===undefined||last===undefined?"—":((last-first)>=0?"+":"")+(last-first).toFixed(1)+"%"}</div></div><div class="mm-var-card"><div class="mm-var-sub">Genomsnitt</div><div class="mm-var-big">${avg===null?"—":avg.toFixed(1)+"%"}</div></div></div><div class="mm-var-editor"><label>Registrera variegering på senaste bild (%)</label><input id="mmVarInput" type="number" min="0" max="100" step="0.1" placeholder="Ex. 35"><select id="mmVarPhoto">${ims.map(im=>`<option value="${im.id}">${new Date(im.createdAt).toLocaleDateString("sv-SE")} · Dag ${ageDays(p.originDate,new Date(im.createdAt))}</option>`).join("")}</select><button class="mm-milestone" onclick="saveVariegation()">💾 Spara variegering</button></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveVariegation(){
 const id=document.getElementById("mmVarPhoto")?.value,v=Number(document.getElementById("mmVarInput")?.value); if(!id||!Number.isFinite(v)||v<0||v>100)return;
 const im=await one(IMG,id); if(!im)return; im.measurements=im.measurements||{}; im.measurements.variegation=v; await put(IMG,im); showVariegation();
}



async function showGrowthIntervals(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const calc=(key,label,unit)=>{const arr=ims.map(im=>({d:new Date(im.createdAt),v:Number((im.measurements||{})[key])})).filter(x=>Number.isFinite(x.v));const gaps=[];for(let i=1;i<arr.length;i++){if(arr[i].v>arr[i-1].v)gaps.push(Math.max(1,Math.round((arr[i].d-arr[i-1].d)/86400000)))}if(!gaps.length)return `<div class="mm-int-card"><div class="mm-int-sub">${label}</div><div class="mm-int-big">—</div><div class="mm-int-sub">Inte tillräckligt med ökningar ännu</div></div>`;const avg=gaps.reduce((a,b)=>a+b,0)/gaps.length;return `<div class="mm-int-card"><div class="mm-int-sub">${label}</div><div class="mm-int-big">${avg.toFixed(1)} dagar</div><div class="mm-int-sub">Snabbast ${Math.min(...gaps)} dagar · Längst ${Math.max(...gaps)} dagar · ${gaps.length} intervall</div></div>`};
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">⏱️ Tillväxtintervall — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-intervals">${calc("height","📏 Höjd","cm")}${calc("leaves","🍃 Blad","blad")}${calc("roots","🌱 Rötter","rötter")}${calc("longestRoot","📐 Längsta rot","cm")}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showRecords(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const vals=ims.map(im=>({im,d:new Date(im.createdAt),m:im.measurements||{}}));
 const records=[];
 const maxOf=(key,label,icon,unit)=>{const a=vals.map(x=>({x,v:Number(x.m[key])})).filter(z=>Number.isFinite(z.v));if(!a.length)return;const z=a.reduce((q,r)=>r.v>q.v?r:q);records.push({icon,label,value:z.v+" "+unit,sub:z.x.d.toLocaleDateString("sv-SE")+" · Dag "+ageDays(p.originDate,z.x.d)})};
 maxOf("height","Högsta dokumenterade höjd","📏","cm"); maxOf("roots","Flest rötter","🌱","rötter"); maxOf("longestRoot","Längsta rot","📐","cm"); maxOf("leaves","Flest blad","🍃","blad"); maxOf("variegation","Högsta registrerade variegering","🤍","%");
 const growth=(key,label,icon,unit)=>{let best=null;for(let i=1;i<vals.length;i++){const a=Number(vals[i-1].m[key]),b=Number(vals[i].m[key]);if(Number.isFinite(a)&&Number.isFinite(b)&&b>a){const days=Math.max((vals[i].d-vals[i-1].d)/86400000,1),rate=(b-a)/days;if(!best||rate>best.rate)best={rate,delta:b-a,days,date:vals[i].d};}}if(best)records.push({icon,label,value:"+"+best.delta.toFixed(2)+" "+unit,sub:"på "+best.days.toFixed(1)+" dagar · "+best.date.toLocaleDateString("sv-SE")})};
 growth("height","Snabbaste höjdökning","🚀","cm"); growth("roots","Snabbaste rotökning","⚡","rötter"); growth("leaves","Snabbaste bladökning","🍃","blad");
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🏆 Rekord — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-records">${records.length?records.map(r=>`<div class="mm-record"><div class="mm-record-icon">${r.icon}</div><div><div class="mm-record-main">${r.label}</div><div class="mm-record-sub">${r.sub}</div></div><div class="mm-record-value">${r.value}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen tillräcklig mätdata ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showForecast(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const area=document.getElementById("statsArea");
 const calc=(key,label,unit)=>{const a=ims.map(im=>({d:new Date(im.createdAt),v:Number((im.measurements||{})[key])})).filter(x=>Number.isFinite(x.v));if(a.length<2)return `<div class="mm-forecast-card"><div class="mm-f-big">${label}</div><div class="mm-f-sub">För lite data för prognos</div></div>`;const x=a[0],y=a.at(-1),days=Math.max((y.d-x.d)/86400000,1),rate=(y.v-x.v)/days,days30=y.v+rate*30;return `<div class="mm-forecast-card"><div class="mm-f-big">${label}</div><div class="mm-f-sub">Senaste: ${y.v} ${unit}</div><div class="mm-f-big">≈ ${days30.toFixed(1)} ${unit}</div><div class="mm-f-sub">uppskattat om 30 dagar</div></div>`};
 area.innerHTML=`<h2 class="timelineTitle">🔮 Tillväxtprognos — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-forecast">${calc("height","📏 Höjd","cm")}${calc("roots","🌱 Rötter","rötter")}${calc("longestRoot","📐 Längsta rot","cm")}${calc("leaves","🍃 Blad","blad")}</div><div class="mm-f-note">⚠️ Prognoserna är matematiska uppskattningar baserade på första och senaste dokumenterade mätning. De är inte en garanti för faktisk framtida tillväxt.</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function showSummaryReport(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const m=ims.map(x=>x.measurements||{}),num=k=>m.map(x=>Number(x[k])).filter(Number.isFinite);
 const latest=ims.at(-1)?.measurements||{}, first=ims[0]?.measurements||{};
 const delta=(k)=>Number.isFinite(Number(latest[k]))&&Number.isFinite(Number(first[k]))?Number(latest[k])-Number(first[k]):null;
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">📋 Sammanfattningsrapport — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-report"><div class="mm-report-card"><div class="mm-report-label">🌱 Planta</div><div class="mm-report-big">${esc(p.name||"Namnlös planta")}</div><div class="mm-report-label">Start: ${p.originDate?new Date(p.originDate).toLocaleDateString("sv-SE"):"—"} · ${ims.length} fotodokumentationer</div></div><div class="mm-report-grid"><div class="mm-report-card"><div class="mm-report-label">📏 Höjd</div><div class="mm-report-big">${Number.isFinite(Number(latest.height))?latest.height+" cm":"—"}</div><div class="mm-report-label">${delta("height")===null?"":(delta("height")>=0?"+":"")+delta("height")+" cm sedan första"}</div></div><div class="mm-report-card"><div class="mm-report-label">🍃 Blad</div><div class="mm-report-big">${Number.isFinite(Number(latest.leaves))?latest.leaves:"—"}</div><div class="mm-report-label">${delta("leaves")===null?"":(delta("leaves")>=0?"+":"")+delta("leaves")+" sedan första"}</div></div><div class="mm-report-card"><div class="mm-report-label">🌱 Rötter</div><div class="mm-report-big">${Number.isFinite(Number(latest.roots))?latest.roots:"—"}</div><div class="mm-report-label">${delta("roots")===null?"":(delta("roots")>=0?"+":"")+delta("roots")+" sedan första"}</div></div><div class="mm-report-card"><div class="mm-report-label">📐 Längsta rot</div><div class="mm-report-big">${Number.isFinite(Number(latest.longestRoot))?latest.longestRoot+" cm":"—"}</div><div class="mm-report-label">${delta("longestRoot")===null?"":(delta("longestRoot")>=0?"+":"")+delta("longestRoot")+" cm sedan första"}</div></div><div class="mm-report-card"><div class="mm-report-label">🤍 Variegering</div><div class="mm-report-big">${Number.isFinite(Number(latest.variegation))?latest.variegation+"%":"—"}</div></div><div class="mm-report-card"><div class="mm-report-label">📸 Senaste dokumentation</div><div class="mm-report-big">${ims.length?new Date(ims.at(-1).createdAt).toLocaleDateString("sv-SE"):"—"}</div></div></div><div class="mm-report-card"><div class="mm-report-label">📊 Datakvalitet</div><div class="mm-report-big">${ims.length>=5?"Bra":"Under uppbyggnad"}</div><div class="mm-report-label">Prognoser och intervall blir mer tillförlitliga när fler mätpunkter registreras.</div></div><div class="mm-report-actions"><button onclick="showGrowthAnalysis()">📈 Analys</button><button onclick="showGrowthChart()">📊 Diagram</button><button onclick="showRecords()">🏆 Rekord</button><button onclick="showForecast()">🔮 Prognos</button></div></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}


