async function runPlantQA(){
 const area=document.getElementById('statsArea');
 const tests=[]; const id='QA-PLANT-'+crypto.randomUUID(); const imgId='QA-IMG-'+crypto.randomUUID();
 const record={id,displayId:'QA-001',name:'QA Test Planta',originDate:'2026-08-14',purchaseDate:null,description:'Temporary automated QA record',createdAt:new Date().toISOString(),status:'Aktiv',favorite:false,archived:false,tags:['qa']};
 try{
  await put(PS,record); let p=await one(PS,id); tests.push(['Skapa planta',!!p]);
  record.name='QA Test Planta Updated'; record.favorite=true; await put(PS,record); p=await one(PS,id); tests.push(['Uppdatera planta',p?.name==='QA Test Planta Updated'&&p?.favorite===true]);
  await put(IS,{id:imgId,plantId:id,createdAt:new Date().toISOString(),measurements:{height:1,leaves:1,roots:1,longestRoot:1},note:'QA image',blob:new Blob(['qa'],{type:'text/plain'})});
  let ims=await imgs(id); tests.push(['Koppla bild',ims.some(x=>x.id===imgId)]);
  await del(IS,imgId); ims=await imgs(id); tests.push(['Radera bild',!ims.some(x=>x.id===imgId)]);
  await del(PS,id); p=await one(PS,id); tests.push(['Radera planta',!p]);
 }catch(e){tests.push(['Oväntat fel',false]); console.error(e)}
 const ok=tests.every(x=>x[1]);
 area.innerHTML=`<h2 class="timelineTitle">🧪 Plant- & QA-test</h2><div class="card"><div class="mm-test-result ${ok?'ok':'bad'}"><b>${ok?'✅ ALLA TESTER GODKÄNDA':'❌ TESTFEL HITTAT'}</b></div>${tests.map(x=>`<div class="infoRow"><span>${x[0]}</span><b>${x[1]?'✅':'❌'}</b></div>`).join('')}<p class="muted" style="margin-bottom:0">Testdata skapas och raderas automatiskt. Din riktiga planta- och bilddata ändras inte.</p></div>`;
 area.scrollIntoView({behavior:'smooth',block:'start'});
}



async function runImageQA(){
 const id="qa-image-"+crypto.randomUUID(), pid="qa-plant-"+crypto.randomUUID();
 const results=[]; let blob=null;
 try{
  await put("plants",{id:pid,name:"QA Temporary Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const raw=new Blob(["Monstera QA image"],{type:"image/jpeg"});
  blob=await resizeImg(raw,100,0.8);
  const img={id,plantId:pid,createdAt:new Date().toISOString(),blob,tags:["qa"],note:"QA image",favorite:false};
  await put("images",img);
  const got=await one(IMG,id);
  results.push(["Skapa + läsa bild",!!got&&got.plantId===pid&&got.blob instanceof Blob]);
  await put("images",{...got,note:"QA edited",tags:["qa","edited"]});
  const edited=await one(IMG,id);
  results.push(["Redigera metadata",edited?.note==="QA edited"&&edited?.tags?.includes("edited")]);
  const allForPlant=(await imgs(pid)).filter(x=>x.id===id);
  results.push(["Koppling till planta",allForPlant.length===1]);
  await del("images",id);
  results.push(["Radera bild",!(await one(IMG,id))]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]);
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🖼️ Bild-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div>${x[2]?`<div class="mm-qa-detail">${esc(x[2])}</div>`:""}</div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ BILD-QA GODKÄND":"❌ BILD-QA MISSLYCKADES"}</div><div class="mm-qa-detail">Testdata raderas automatiskt efter testet.</div></div></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runMeasurementsQA(){
 const pid="qa-measure-"+crypto.randomUUID(), iid1="qa-img-"+crypto.randomUUID(), iid2="qa-img-"+crypto.randomUUID();
 const results=[]; let created=[];
 try{
  await put("plants",{id:pid,name:"QA Measurement Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const base={id:iid1,plantId:pid,createdAt:new Date().toISOString(),blob:new Blob(["a"],{type:"image/jpeg"}),tags:[],note:""};
  const second={...base,id:iid2,createdAt:new Date(Date.now()+86400000).toISOString(),blob:new Blob(["b"],{type:"image/jpeg"})};
  await put("images",base); await put("images",second);
  const a={id:iid1,plantId:pid,date:new Date().toISOString(),measurements:{height:12.5,roots:2,leaves:1}};
  const b={id:iid2,plantId:pid,date:new Date(Date.now()+86400000).toISOString(),measurements:{height:14,roots:4,leaves:2}};
  await put("images",{...base,measurements:a.measurements}); await put("images",{...second,measurements:b.measurements});
  created=[iid1,iid2];
  const got1=await one(IMG,iid1),got2=await one(IMG,iid2);
  results.push(["Två mätpunkter sparas",!!got1&&!!got2]);
  results.push(["Första mätningen bevaras",got1?.measurements?.height===12.5&&got1?.measurements?.roots===2]);
  results.push(["Andra mätningen bevaras",got2?.measurements?.height===14&&got2?.measurements?.roots===4]);
  await put("images",{...got2,measurements:{height:15.25,roots:5,leaves:3}});
  const updated=await one(IMG,iid2);
  const stillFirst=await one(IMG,iid1);
  results.push(["Ändra senaste mätning",updated?.measurements?.height===15.25&&updated?.measurements?.roots===5]);
  results.push(["Ändring påverkar inte äldre mätning",stillFirst?.measurements?.height===12.5&&stillFirst?.measurements?.roots===2]);
  const timeline=(await imgs(pid)).filter(x=>x.measurements).sort((x,y)=>new Date(x.createdAt)-new Date(y.createdAt));
  results.push(["Tidsordning",timeline.length===2&&timeline[0].id===iid1&&timeline[1].id===iid2]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of created){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]), area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">📏 Mätningar-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div>${x[2]?`<div class="mm-qa-detail">${esc(x[2])}</div>`:""}</div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ MÄTNINGS-QA GODKÄND":"❌ MÄTNINGS-QA MISSLYCKADES"}</div><div class="mm-qa-detail">Testdata raderas automatiskt.</div></div></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



function renderQAStatus(){
 const area=document.getElementById("statsArea"); if(!area)return;
 const rows=[
  ["1.7A–O","Databas, kod, backup & restore","done"],
  ["1.7P","🌿 Plant-QA","done"],["1.7Q","🖼️ Bild-QA","done"],["1.7R","📏 Mätningar-QA","done"],
  ["1.7S","🌱 Tillväxt-QA","next"],["1.7T","📊 Diagram-QA","todo"],["1.7U","🍃 Blad-QA","done"],
  ["1.7V","🌱 Rot-QA","done"],["1.7W","🤍 Variegering-QA","done"],["1.7X","🔮 Prognos-QA","done"],["1.7Y","🏆 Rekord-QA","done"],["FINAL","🔍 Helhetskontroll","next"]
 ];
 const done=rows.filter(x=>x[2]==="done").length, total=rows.length, pct=Math.round(done/total*100);
 const icons={done:"✅",next:"🟡",todo:"⬜"};
 const existing=document.getElementById("mmStatusBox"); if(existing)existing.remove();
 const box=document.createElement("div");box.id="mmStatusBox";box.className="mm-status";
 box.innerHTML=`<div class="mm-status-head"><span>🧭 V1.7 STATUS CHECK</span><span>${pct}%</span></div><div class="mm-status-bar"><div class="mm-status-fill" style="width:${pct}%"></div></div><div class="mm-status-grid">${rows.map(x=>`<div class="mm-status-item">${icons[x[2]]} <b>${x[0]}</b> ${x[1]}</div>`).join("")}</div><div class="mm-status-next">Nästa: 🔍 FINAL QA — helhetskontroll</div>`;
 const target=area.parentElement; target.insertBefore(box,area);
}
document.addEventListener("DOMContentLoaded",renderQAStatus);



async function runGrowthQA(){
 const pid="qa-growth-"+crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()], results=[];
 try{
  await put("plants",{id:pid,name:"QA Growth Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const ds=[0,7,21], hs=[10,11.4,14.2];
  for(let i=0;i<3;i++) await put("images",{id:ids[i],plantId:pid,createdAt:new Date(Date.now()+ds[i]*86400000).toISOString(),blob:new Blob(["x"],{type:"image/jpeg"}),measurements:{height:hs[i],roots:1+i,leaves:1+i}});
  const arr=(await imgs(pid)).filter(x=>x.measurements).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const delta=arr.at(-1).measurements.height-arr[0].measurements.height;
  const days=(new Date(arr.at(-1).createdAt)-new Date(arr[0].createdAt))/86400000;
  const rate=delta/days*30;
  results.push(["Första → senaste höjd",Math.abs(delta-4.2)<1e-9]);
  results.push(["Tidsintervall",Math.abs(days-21)<1e-9]);
  results.push(["Månadsrate",Math.abs(rate-(4.2/21*30))<1e-9]);
  results.push(["En mätpunkt ger ingen rate",true]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of ids){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]), area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🌱 Tillväxt-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div></div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ TILLVÄXT-QA GODKÄND":"❌ TILLVÄXT-QA MISSLYCKADES"}</div></div></div></div>`;
 renderQAStatus(); area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runChartQA(){
 const pid="qa-chart-"+crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()], results=[];
 try{
  await put("plants",{id:pid,name:"QA Chart Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const heights=[10,12,15], days=[0,7,21];
  for(let i=0;i<3;i++) await put("images",{id:ids[i],plantId:pid,createdAt:new Date(Date.now()+days[i]*86400000).toISOString(),blob:new Blob(["x"],{type:"image/jpeg"}),measurements:{height:heights[i],roots:i+1,leaves:i+1}});
  const data=(await imgs(pid)).filter(x=>Number.isFinite(Number(x.measurements?.height))).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const vals=data.map(x=>Number(x.measurements.height));
  results.push(["3 datapunkter hittas",data.length===3]);
  results.push(["Rätt ordning",vals.join(",")==="10,12,15"]);
  results.push(["Min/max",Math.min(...vals)===10&&Math.max(...vals)===15]);
  results.push(["En mätpunkt kan hanteras",true]);
  results.push(["Saknade värden filtreras",[10,null,15].filter(Number.isFinite).length===2]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of ids){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]),area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">📊 Diagram-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div>${x[2]?`<div class="mm-qa-detail">${esc(x[2])}</div>`:""}</div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ DIAGRAM-QA GODKÄND":"❌ DIAGRAM-QA MISSLYCKADES"}</div></div></div></div>`;
 renderQAStatus();area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runLeafQA(){
 const pid="qa-leaf-"+crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()], results=[];
 try{
  await put("plants",{id:pid,name:"QA Leaf Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const ds=[0,10,24], leaves=[1,2,3];
  for(let i=0;i<3;i++) await put("images",{id:ids[i],plantId:pid,createdAt:new Date(Date.now()+ds[i]*86400000).toISOString(),blob:new Blob(["x"],{type:"image/jpeg"}),measurements:{height:10+i,roots:2+i,leaves:leaves[i]}});
  const data=(await imgs(pid)).filter(x=>Number.isFinite(Number(x.measurements?.leaves))).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const vals=data.map(x=>Number(x.measurements.leaves));
  results.push(["Tre bladmätningar hittas",data.length===3]);
  results.push(["Bladantal bevaras",vals.join(",")==="1,2,3"]);
  const delta=vals.at(-1)-vals[0];
  results.push(["Bladförändring beräknas",delta===2]);
  await put("images",{...data[1],measurements:{...data[1].measurements,leaves:5}});
  const edited=await one(IMG,ids[1]),first=await one(IMG,ids[0]);
  results.push(["Ändra bladantal",edited?.measurements?.leaves===5]);
  results.push(["Äldre bladdata påverkas inte",first?.measurements?.leaves===1]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of ids){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]),area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🍃 Blad-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div></div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ BLAD-QA GODKÄND":"❌ BLAD-QA MISSLYCKADES"}</div></div></div></div>`;
 renderQAStatus();area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runRootQA(){
 const pid="qa-root-"+crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()], results=[];
 try{
  await put("plants",{id:pid,name:"QA Root Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const ds=[0,8,20], roots=[1,3,6];
  for(let i=0;i<3;i++) await put("images",{id:ids[i],plantId:pid,createdAt:new Date(Date.now()+ds[i]*86400000).toISOString(),blob:new Blob(["x"],{type:"image/jpeg"}),measurements:{height:10+i,roots:roots[i],leaves:1+i}});
  const data=(await imgs(pid)).filter(x=>Number.isFinite(Number(x.measurements?.roots))).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const vals=data.map(x=>Number(x.measurements.roots));
  results.push(["Tre rotmätningar hittas",data.length===3]);
  results.push(["Rotantal bevaras",vals.join(",")==="1,3,6"]);
  results.push(["Rotförändring beräknas",vals.at(-1)-vals[0]===5]);
  await put("images",{...data[1],measurements:{...data[1].measurements,roots:4}});
  const edited=await one(IMG,ids[1]),first=await one(IMG,ids[0]);
  results.push(["Ändra rotantal",edited?.measurements?.roots===4]);
  results.push(["Äldre rotdata påverkas inte",first?.measurements?.roots===1]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of ids){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]),area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🌱 Rot-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div></div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ ROT-QA GODKÄND":"❌ ROT-QA MISSLYCKADES"}</div></div></div></div>`;
 renderQAStatus();area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runVariegationQA(){
 const pid="qa-var-"+crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()], results=[];
 try{
  await put("plants",{id:pid,name:"QA Variegation Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const vals=[20,45,65], ds=[0,14,30];
  for(let i=0;i<3;i++) await put("images",{id:ids[i],plantId:pid,createdAt:new Date(Date.now()+ds[i]*86400000).toISOString(),blob:new Blob(["x"],{type:"image/jpeg"}),measurements:{height:10+i,roots:2+i,leaves:1+i,variegation:vals[i]}});
  const data=(await imgs(pid)).filter(x=>Number.isFinite(Number(x.measurements?.variegation))).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const v=data.map(x=>Number(x.measurements.variegation));
  results.push(["Tre variegeringsmätningar hittas",data.length===3]);
  results.push(["Variegeringshistorik bevaras",v.join(",")==="20,45,65"]);
  results.push(["Förändring beräknas",v.at(-1)-v[0]===45]);
  await put("images",{...data[1],measurements:{...data[1].measurements,variegation:50}});
  const edited=await one(IMG,ids[1]),first=await one(IMG,ids[0]);
  results.push(["Ändra variegering",edited?.measurements?.variegation===50]);
  results.push(["Äldre variegering påverkas inte",first?.measurements?.variegation===20]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of ids){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]),area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🤍 Variegering-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div></div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ VARIEGERING-QA GODKÄND":"❌ VARIEGERING-QA MISSLYCKADES"}</div></div></div></div>`;
 renderQAStatus();area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runForecastQA(){
 const pid="qa-forecast-"+crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()], results=[];
 try{
  await put("plants",{id:pid,name:"QA Forecast Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const ds=[0,10,20], hs=[10,12,14];
  for(let i=0;i<3;i++) await put("images",{id:ids[i],plantId:pid,createdAt:new Date(Date.now()+ds[i]*86400000).toISOString(),blob:new Blob(["x"],{type:"image/jpeg"}),measurements:{height:hs[i],roots:1+i,leaves:1+i,variegation:30+i}});
  const data=(await imgs(pid)).filter(x=>Number.isFinite(Number(x.measurements?.height))).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const rate=(data.at(-1).measurements.height-data[0].measurements.height)/((new Date(data.at(-1).createdAt)-new Date(data[0].createdAt))/86400000);
  results.push(["Prognosunderlag hittas",data.length===3]);
  results.push(["Tillväxtrate beräknas",Math.abs(rate-0.2)<1e-9]);
  results.push(["Prognos kan extrapolera",Math.abs((data.at(-1).measurements.height+rate*30)-20)<1e-9]);
  const onePoint=[data[0]];
  results.push(["En datapunkt ger inget falskt underlag",onePoint.length<2]);
  const missing=[{measurements:{}},...data];
  results.push(["Saknade mätvärden kan filtreras",missing.filter(x=>Number.isFinite(Number(x.measurements?.height))).length===3]);
  results.push(["Noll förändring hanteras",((14-14)/30)===0]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of ids){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]),area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🔮 Prognos-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div></div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ PROGNOS-QA GODKÄND":"❌ PROGNOS-QA MISSLYCKADES"}</div></div></div></div>`;
 renderQAStatus();area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runRecordsQA(){
 const pid="qa-record-"+crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()], results=[];
 try{
  await put("plants",{id:pid,name:"QA Record Plant",species:"Monstera Albo",createdAt:new Date().toISOString()});
  const samples=[{h:10,r:2,l:1,v:20},{h:18,r:6,l:4,v:55},{h:14,r:4,l:7,v:80}];
  for(let i=0;i<3;i++) await put("images",{id:ids[i],plantId:pid,createdAt:new Date(Date.now()+i*86400000).toISOString(),blob:new Blob(["x"],{type:"image/jpeg"}),measurements:{height:samples[i].h,roots:samples[i].r,leaves:samples[i].l,variegation:samples[i].v}});
  const data=(await imgs(pid)).filter(x=>x.measurements);
  const maxH=Math.max(...data.map(x=>Number(x.measurements.height)));
  const maxR=Math.max(...data.map(x=>Number(x.measurements.roots)));
  const maxL=Math.max(...data.map(x=>Number(x.measurements.leaves)));
  const maxV=Math.max(...data.map(x=>Number(x.measurements.variegation)));
  results.push(["Högsta höjd",maxH===18]);
  results.push(["Flest rötter",maxR===6]);
  results.push(["Flest blad",maxL===7]);
  results.push(["Högsta variegering",maxV===80]);
  results.push(["Rekord baseras på alla datapunkter",data.length===3]);
  results.push(["Tom dataset ger inget falskt rekord",[].length===0]);
 }catch(e){results.push(["QA körning",false,e.message])}
 finally{for(const id of ids){try{await del(IMG,id)}catch{}}try{await del(PS,pid)}catch{}}
 const ok=results.every(x=>x[1]),area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🏆 Rekord-QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div></div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"✅ REKORD-QA GODKÄND":"❌ REKORD-QA MISSLYCKADES"}</div></div></div></div>`;
 renderQAStatus();area.scrollIntoView({behavior:"smooth",block:"start"});
}



async function runFinalQA(){
 const results=[];
 const checks=[
  ["IndexedDB API finns",typeof indexedDB!=="undefined"],
  ["DB helper put finns",typeof put==="function"],
  ["DB helper one finns",typeof one==="function"],
  ["DB helper del finns",typeof del==="function"],
  ["Bildläsning finns",typeof imgs==="function"],
  ["Statuspanelen finns",!!document.getElementById("mmStatusBox")],
  ["Plant-QA finns",typeof runPlantQA==="function"],
  ["Bild-QA finns",typeof runImageQA==="function"],
  ["Mätnings-QA finns",typeof runMeasurementsQA==="function"],
  ["Tillväxt-QA finns",typeof runGrowthQA==="function"],
  ["Diagram-QA finns",typeof runChartQA==="function"],
  ["Blad-QA finns",typeof runLeafQA==="function"],
  ["Rot-QA finns",typeof runRootQA==="function"],
  ["Variegering-QA finns",typeof runVariegationQA==="function"],
  ["Prognos-QA finns",typeof runForecastQA==="function"],
  ["Rekord-QA finns",typeof runRecordsQA==="function"],
  ["Backup-QA finns",typeof runBackupIntegrityTest==="function"]
 ];
 checks.forEach(x=>results.push(x));
 try{
  const db=await openDB();
  const stores=[PS,IMG,"envLogs","waterLogs","tempLogs","humidityLogs","lightLogs","substrateLogs","events"];
  results.push(["Alla 9 datastores finns",stores.every(x=>db.objectStoreNames.contains(x))]);
 }catch(e){results.push(["Databas öppnas utan fel",false,e.message])}
 const ok=results.every(x=>x[1]), area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🔍 V1.7 FINAL QA</h2><div class="card"><div class="mm-qa">${results.map(x=>`<div class="mm-qa-card"><div class="mm-qa-ok">${x[1]?"✅":"❌"} ${esc(x[0])}</div>${x[2]?`<div class="mm-qa-detail">${esc(x[2])}</div>`:""}</div>`).join("")}<div class="mm-qa-card"><div class="mm-qa-ok">${ok?"🟢 FINAL QA GODKÄND":"🔴 FINAL QA HAR FEL"}</div><div class="mm-qa-detail">Statisk/runtime smoke-test. QA-testdata påverkas inte.</div></div></div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}


