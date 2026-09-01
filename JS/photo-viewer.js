let mmZoom=1,mmX=0,mmY=0,mmStartDist=0,mmStartZoom=1,mmDragging=false,mmLastX=0,mmLastY=0;
function openViewer(blob){const v=document.getElementById("mmViewer"),i=document.getElementById("mmViewerImg");i.src=URL.createObjectURL(blob);mmZoom=1;mmX=0;mmY=0;applyViewer();v.classList.add("show")}
function closeViewer(){document.getElementById("mmViewer").classList.remove("show")}
function applyViewer(){document.getElementById("mmViewerImg").style.transform=`translate(${mmX}px,${mmY}px) scale(${mmZoom})`}
function dist(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
const vv=document.getElementById("mmViewer");
vv.addEventListener("touchstart",e=>{if(e.touches.length===2){mmStartDist=dist(e.touches[0],e.touches[1]);mmStartZoom=mmZoom}else if(e.touches.length===1){mmDragging=true;mmLastX=e.touches[0].clientX;mmLastY=e.touches[0].clientY}});
vv.addEventListener("touchmove",e=>{e.preventDefault();if(e.touches.length===2){mmZoom=Math.max(1,Math.min(5,mmStartZoom*dist(e.touches[0],e.touches[1])/mmStartDist));applyViewer()}else if(mmDragging&&e.touches.length===1){mmX+=e.touches[0].clientX-mmLastX;mmY+=e.touches[0].clientY-mmLastY;mmLastX=e.touches[0].clientX;mmLastY=e.touches[0].clientY;applyViewer()}},{passive:false});
vv.addEventListener("touchend",()=>mmDragging=false);
vv.addEventListener("wheel",e=>{e.preventDefault();mmZoom=Math.max(1,Math.min(5,mmZoom*(e.deltaY<0?1.1:.9)));applyViewer()},{passive:false});



async function addPlantTag(id,input){
 const tag=input.value.trim().replace(/^#/,""); if(!tag)return;
 const p=await one(PS,id); if(!p)return;
 p.tags=Array.isArray(p.tags)?p.tags:[]; if(!p.tags.some(t=>t.toLowerCase()===tag.toLowerCase()))p.tags.push(tag);
 await put(PS,p); input.value=""; showPlantRegistry(window.mmRegSort||"name",window.mmRegFilter||"all",window.mmRegSearch||"");
}
async function removePlantTag(id,tag){
 const p=await one(PS,id); if(!p)return; p.tags=(p.tags||[]).filter(t=>t!==tag); await put(PS,p);
 showPlantRegistry(window.mmRegSort||"name",window.mmRegFilter||"all",window.mmRegSearch||"");
}



async function toggleFavorite(id){
 const p=await one(PS,id); if(!p)return;
 p.favorite=!p.favorite; await put(PS,p);
 showPlantRegistry(window.mmRegSort||"name",window.mmRegFilter||"all",window.mmRegSearch||"");
}



async function toggleArchived(id){
 const p=await one(PS,id); if(!p)return;
 p.archived=!p.archived;
 if(p.archived){p.status="Arkiverad";p.favorite=false}
 else if(p.status==="Arkiverad")p.status="Aktiv";
 await put(PS,p);
 showPlantRegistry(window.mmRegSort||"name",window.mmRegFilter||"all",window.mmRegSearch||"");
}



async function duplicatePlant(id){
 const p=await one(PS,id); if(!p)return;
 const name=prompt("Namn på den nya plantan:",`${p.name||"Planta"} — Kopia`);
 if(!name)return;
 const copy={...p,id:crypto.randomUUID(),name:name.trim(),favorite:false,archived:false,
   originDate:new Date().toISOString(),status:"Aktiv",tags:[...(p.tags||[]), "kopia"]};
 await put(PS,copy);
 alert("🌱 Plantan har duplicerats. Den nya plantan har fått en egen historik.");
 showPlantRegistry(window.mmRegSort||"name",window.mmRegFilter||"all",window.mmRegSearch||"");
}



async function moveLatestDocumentation(id){
 const source=await one(PS,id); if(!source)return;
 const plants=(await all(PS)).filter(p=>p.id!==id);
 if(!plants.length){alert("Det finns ingen annan planta att flytta dokumentationen till.");return}
 const targetId=prompt("Ange ID för mottagande planta:\n"+plants.map(p=>`${p.id} = ${p.name}`).join("\n"));
 if(!targetId||!plants.some(p=>p.id===targetId))return;
 const ims=await imgs(id); if(!ims.length){alert("Plantan har ingen dokumentation att flytta.");return}
 const latest=ims.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
 latest.plantId=targetId; await put(IMG,latest);
 showPlantRegistry(window.mmRegSort||"name",window.mmRegFilter||"all",window.mmRegSearch||"");
}



async function showPhotoTimeline(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const area=document.getElementById("statsArea");
 if(!ims.length){area.innerHTML='<div class="card"><h2 class="timelineTitle">📸 Fototidslinje</h2><p class="muted">Inga bilder ännu.</p></div>';return}
 const cards=[];
 for(let i=0;i<ims.length;i++){
   const im=ims[i], d=new Date(im.createdAt), age=ageDays(p.originDate,d);
   cards.push(`<div class="mm-time-card" data-mm-img="${im.id}"><img class="mm-time-img" src="${URL.createObjectURL(im.blob)}" onclick='openPhotoLarge(this.src,"Dag ${age} · ${d.toLocaleDateString("sv-SE")} ${d.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}")'><div><b>🌱 Dag ${age}</b><div class="muted">${d.toLocaleDateString("sv-SE")} ${d.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}</div><div class="muted">${esc(im.note||"Dokumentation")}</div><button class="small" onclick="editPhotoDate('${im.id}')">📅 Redigera datum/tid</button><button class="small" onclick="editPhotoNote('${im.id}')">📝 Redigera anteckning</button><button class="mm-milestone ${im.milestone?"active":""}" onclick="toggleMilestone('${im.id}')">${im.milestone?"📌 Viktig händelse":"📌 Markera som viktig"}</button>${im.milestone?`<select class="mm-milestone" onchange="setMilestoneType('${im.id}',this.value)"><option ${im.milestoneType==="Viktig händelse"?"selected":""}>Viktig händelse</option><option ${im.milestoneType==="Första roten"?"selected":""}>Första roten</option><option ${im.milestoneType==="Första bladet"?"selected":""}>Första bladet</option><option ${im.milestoneType==="Variegering"?"selected":""}>Variegering</option><option ${im.milestoneType==="Omplantering"?"selected":""}>Omplantering</option><option ${im.milestoneType==="Såld"?"selected":""}>Såld</option></select>`:""}<div class="mm-img-tags">${(im.tags||[]).map(t=>`<span class="mm-img-tag">#${esc(t)} <button onclick="removePhotoTag('${im.id}','${esc(t)}')" style="border:0;background:none;padding:0">×</button></span>`).join("")}</div><div class="mm-img-tag-editor"><input placeholder="#ny bildtagg" onkeydown="if(event.key==='Enter')addPhotoTag('${im.id}',this)"><button class="small" onclick="addPhotoTag('${im.id}',this.previousElementSibling)">+</button></div></div></div></div>`);
   if(i<ims.length-1){const next=new Date(ims[i+1].createdAt);const gap=Math.round((next-d)/86400000);cards.push(`<div class="mm-gap">↓ ⏱️ ${gap} ${gap===1?"dag":"dagar"} senare ↓</div>`)}
 }
 area.innerHTML=`<h2 class="timelineTitle">📸 Fototidslinje — ${esc(p.name||"Planta")}</h2><div class="card"><div class="mm-timeline">${cards.join("")}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



function openPhotoLarge(src,info=""){
 const box=document.getElementById("mmLightbox"); box.querySelector("img").src=src; box.querySelector(".mm-lightbox-info").textContent=info; box.classList.add("show"); resetMMZoom();
}
function closePhotoLarge(){document.getElementById("mmLightbox").classList.remove("show")}



let mmLbZoom=1,mmLbPanX=0,mmLbPanY=0,mmLbDrag=false,mmLbSX=0,mmLbSY=0;
function applyMMZoom(){const img=document.querySelector("#mmLightbox img");img.style.transform=`translate(${mmLbPanX}px,${mmLbPanY}px) scale(${mmLbZoom})`}
function resetMMZoom(){mmLbZoom=1;mmLbPanX=0;mmLbPanY=0;applyMMZoom()}
function setupMMZoom(){
 const img=document.querySelector("#mmLightbox img");
 img.addEventListener("wheel",e=>{e.preventDefault();mmLbZoom=Math.min(5,Math.max(1,mmLbZoom+(e.deltaY<0?.25:-.25)));applyMMZoom()},{passive:false});
 img.addEventListener("dblclick",e=>{mmLbZoom=mmLbZoom>1?1:2.5;mmLbPanX=mmLbPanY=0;applyMMZoom()});
 img.addEventListener("pointerdown",e=>{if(mmLbZoom<=1)return;mmLbDrag=true;mmLbSX=e.clientX;mmLbSY=e.clientY;img.setPointerCapture(e.pointerId)});
 img.addEventListener("pointermove",e=>{if(!mmLbDrag)return;mmLbPanX+=e.clientX-mmLbSX;mmLbPanY+=e.clientY-mmLbSY;mmLbSX=e.clientX;mmLbSY=e.clientY;applyMMZoom()});
 img.addEventListener("pointerup",()=>mmLbDrag=false);
}
document.addEventListener("DOMContentLoaded",setupMMZoom);


