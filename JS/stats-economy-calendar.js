async function showCompare(){
  const p=await one(PS,current), im=await imgs(current);
  im.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const area=document.getElementById("statsArea");
  if(im.length<2){area.innerHTML='<h2 class="timelineTitle">🖼️ Bildjämförelse</h2><div class="card empty"><div>📸</div><h3>Minst två bilder behövs</h3><p>Ta några dokumentationer först så kan du jämföra utvecklingen.</p></div>';area.scrollIntoView({behavior:"smooth",block:"start"});return}
  const opts=im.map((x,i)=>`<option value="${x.id}">Bild #${i+1} — ${dt(x.createdAt).d} (${ageDays(p.originDate,new Date(x.createdAt))} dagar)</option>`).join("");
  area.innerHTML=`<h2 class="timelineTitle">🖼️ Bildjämförelse</h2><div class="card">
    <div class="field"><label>Äldre bild</label><select id="cmpA" style="width:100%;padding:13px;border:1px solid var(--border);border-radius:13px;background:#fafbf9">${opts}</select></div>
    <div class="field"><label>Nyare bild</label><select id="cmpB" style="width:100%;padding:13px;border:1px solid var(--border);border-radius:13px;background:#fafbf9">${opts}</select></div>
    <button class="save" onclick="renderCompare()">🔍 Jämför</button>
  </div><div id="compareResult"></div>`;
  $("cmpA").selectedIndex=0;$("cmpB").selectedIndex=im.length-1;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function renderCompare(){
  const im=await imgs(current),a=im.find(x=>x.id===document.getElementById("cmpA").value),b=im.find(x=>x.id===document.getElementById("cmpB").value),p=await one(PS,current);
  if(!a||!b)return;
  const za=dt(a.createdAt),zb=dt(b.createdAt),ma=a.measurements||{},mb=b.measurements||{};
  const row=(label,key,unit)=>{
    if(ma[key]===""||ma[key]==null||mb[key]===""||mb[key]==null)return "";
    const d=Number(mb[key])-Number(ma[key]);return `<div class="infoRow"><span>${label}</span><b>${ma[key]} → ${mb[key]} ${unit} (${d>=0?"+":""}${d})</b></div>`;
  };
  const r=document.getElementById("compareResult");
  r.innerHTML=`<div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div><img id="cmpImgA" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"><div style="font-weight:700;margin-top:7px">${za.d}</div><div class="muted">🌱 Dag ${ageDays(p.originDate,new Date(a.createdAt))}</div></div>
    <div><img id="cmpImgB" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px"><div style="font-weight:700;margin-top:7px">${zb.d}</div><div class="muted">🌱 Dag ${ageDays(p.originDate,new Date(b.createdAt))}</div></div>
  </div><div style="margin-top:15px"><b>📊 Förändring</b>${row("📏 Höjd","height","cm")}${row("🍃 Blad","leaves","st")}${row("🌱 Rötter","roots","st")}${row("📐 Längsta rot","longestRoot","cm")}${row("🍃 Bladstorlek","leafSize","cm")}</div>
  <div class="muted" style="margin-top:10px">⏱️ ${diff(a.createdAt,b.createdAt)||"Samma tidpunkt"}</div></div>`;
  $("cmpImgA").src=URL.createObjectURL(a.blob);$("cmpImgB").src=URL.createObjectURL(b.blob);
}
async function showEconomy(){
  const p=await one(PS,current);
  const e=p.economy||{costs:[],sales:[]};
  const costs=e.costs||[], sales=e.sales||[];
  const totalCosts=costs.reduce((a,x)=>a+Number(x.amount||0),0);
  const totalSales=sales.reduce((a,x)=>a+Number(x.amount||0),0);
  const result=totalSales-totalCosts;
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">💰 Ekonomi</h2>
  <div class="stats" style="margin-bottom:12px">
    <div class="stat"><small>Kostnader</small><b>${totalCosts.toFixed(2)} kr</b></div>
    <div class="stat"><small>Försäljning</small><b>${totalSales.toFixed(2)} kr</b></div>
    <div class="stat"><small>Resultat</small><b>${result>=0?"+":""}${result.toFixed(2)} kr</b></div>
    <div class="stat"><small>Poster</small><b>${costs.length+sales.length}</b></div>
  </div>
  <div class="card"><h3 style="margin-top:0">➕ Lägg till kostnad</h3>
    <div class="field"><label>Vad?</label><input id="costName" placeholder="T.ex. perlit"></div>
    <div class="field"><label>Belopp (kr)</label><input id="costAmount" type="number" step="0.01" min="0" placeholder="80"></div>
    <button class="save" onclick="addCost()">💾 Spara kostnad</button>
  </div>
  <div class="card"><h3 style="margin-top:0">💵 Lägg till försäljning</h3>
    <div class="field"><label>Vad såldes?</label><input id="saleName" placeholder="T.ex. Albo #002"></div>
    <div class="field"><label>Belopp (kr)</label><input id="saleAmount" type="number" step="0.01" min="0" placeholder="1200"></div>
    <button class="save" onclick="addSale()">💾 Spara försäljning</button>
  </div>
  <div class="card"><h3 style="margin-top:0">📋 Poster</h3>
    ${[...costs.map(x=>`<div class="infoRow"><span>🔻 ${esc(x.name)}</span><b>-${Number(x.amount).toFixed(2)} kr</b></div>`),...sales.map(x=>`<div class="infoRow"><span>🔺 ${esc(x.name)}</span><b>+${Number(x.amount).toFixed(2)} kr</b></div>`)].join("")||'<p class="muted">Inga ekonomiska poster ännu.</p>'}
  </div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function addCost(){
  const p=await one(PS,current),name=document.getElementById("costName").value.trim(),amount=Number(document.getElementById("costAmount").value);
  if(!name||!Number.isFinite(amount)||amount<0){alert("Fyll i vad kostnaden gäller och ett giltigt belopp.");return}
  p.economy=p.economy||{costs:[],sales:[]};p.economy.costs=p.economy.costs||[];p.economy.costs.push({id:crypto.randomUUID(),name,amount,date:new Date().toISOString()});
  await put(PS,p);showEconomy();
}
async function addSale(){
  const p=await one(PS,current),name=document.getElementById("saleName").value.trim(),amount=Number(document.getElementById("saleAmount").value);
  if(!name||!Number.isFinite(amount)||amount<0){alert("Fyll i vad som såldes och ett giltigt belopp.");return}
  p.economy=p.economy||{costs:[],sales:[]};p.economy.sales=p.economy.sales||[];p.economy.sales.push({id:crypto.randomUUID(),name,amount,date:new Date().toISOString()});
  await put(PS,p);showEconomy();
}
async function showCalendar(){
  const p=await one(PS,current), im=await imgs(current);
  im.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const dates={};
  im.forEach(x=>{const k=new Date(x.createdAt).toISOString().slice(0,10);(dates[k]??=[]).push(x)});
  const now=new Date(), y=now.getFullYear(), mo=now.getMonth(), first=new Date(y,mo,1), days=new Date(y,mo+1,0).getDate(), start=(first.getDay()+6)%7;
  const names=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];
  let cells=names.map(n=>`<div style="font-size:11px;color:var(--muted);text-align:center;font-weight:700;padding:6px">${n}</div>`).join("");
  for(let i=0;i<start;i++)cells+=`<div></div>`;
  for(let d=1;d<=days;d++){
    const key=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`, count=(dates[key]||[]).length;
    cells+=`<button onclick="calendarDay('${key}')" style="min-height:58px;border:1px solid ${count?"#b8cbb9":"var(--border)"};border-radius:12px;background:${count?"var(--light)":"#fff"};padding:6px;font-weight:700">${d}${count?`<div style="font-size:10px;color:var(--primary);margin-top:5px">📸 ${count}</div>`:""}</button>`;
  }
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🗓️ Kalender</h2><div class="card"><h3 style="margin-top:0">${now.toLocaleDateString("sv-SE",{month:"long",year:"numeric"})}</h3><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">${cells}</div><p class="muted" style="margin-bottom:0">Dagar med 📸 innehåller dokumentation.</p></div><div id="calendarDayArea"></div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function calendarDay(key){
  const im=(await imgs(current)).filter(x=>new Date(x.createdAt).toISOString().slice(0,10)===key).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const p=await one(PS,current), box=document.getElementById("calendarDayArea");
  box.innerHTML=`<div class="card"><b>📅 ${new Date(key+"T00:00:00").toLocaleDateString("sv-SE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</b>${im.length?im.map((x,i)=>{const z=dt(x.createdAt);return `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><b>📸 ${z.t}</b><div class="muted">🌱 Dag ${ageDays(p.originDate,new Date(x.createdAt))}${x.note?`<br>📝 ${esc(x.note)}`:""}</div></div>`}).join(""):"<p class='muted'>Ingen dokumentation den här dagen.</p>"}</div>`;
  box.scrollIntoView({behavior:"smooth",block:"start"});
}
async function showStats(){
  const p=await one(PS,current), im=await imgs(current);
  im.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const rows=im.map(x=>({d:new Date(x.createdAt),m:x.measurements||{}}));
  const metric=(key,label,unit)=>{
    const vals=rows.filter(x=>x.m[key]!==""&&x.m[key]!==null&&x.m[key]!==undefined&&x.m[key]!=="").map(x=>({d:x.d,v:Number(x.m[key])})).filter(x=>Number.isFinite(x.v));
    if(!vals.length)return `<div class="card"><b>${label}</b><p class="muted">Ingen data ännu.</p></div>`;
    const first=vals[0].v,last=vals[vals.length-1].v,delta=last-first;
    const max=Math.max(...vals.map(x=>x.v),0.0001);
    const bars=vals.map(x=>`<div style="display:flex;align-items:center;gap:7px;margin:8px 0"><span style="width:74px;font-size:10px;color:var(--muted)">${x.d.toLocaleDateString("sv-SE",{month:"short",day:"numeric"})}</span><div style="height:18px;background:var(--light);border-radius:8px;flex:1;overflow:hidden"><div style="height:100%;width:${Math.max(3,x.v/max*100)}%;background:var(--primary);border-radius:8px"></div></div><b style="font-size:11px;width:52px;text-align:right">${x.v} ${unit}</b></div>`).join("");
    return `<div class="card"><b>${label}</b><div style="font-size:12px;color:var(--muted);margin-top:5px">Första: ${first} ${unit} · Senaste: ${last} ${unit} · Förändring: ${delta>=0?"+":""}${delta} ${unit}</div><div style="margin-top:12px">${bars}</div></div>`;
  };
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">📊 Statistik</h2>${metric("height","📏 Höjd","cm")}${metric("leaves","🍃 Antal blad","st")}${metric("roots","🌱 Antal rötter","st")}${metric("longestRoot","📐 Längsta rot","cm")}${metric("leafSize","🍃 Bladstorlek","cm")}`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}