async function showPhotoCompare(){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 if(ims.length<2){alert("📸 Du behöver minst två bilder för att jämföra.");return}
 const opts=ims.map((im,i)=>`<option value="${i}">Dag ${ageDays(p.originDate,new Date(im.createdAt))} · ${new Date(im.createdAt).toLocaleDateString("sv-SE")}</option>`).join("");
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">↔️ Bildjämförelse — ${esc(p.name||"Planta")}</h2><div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><select id="mmBefore">${opts}</select><select id="mmAfter">${opts}</select></div><button class="primary" style="width:100%;margin-top:8px;padding:13px" onclick="renderPhotoCompare()">🔍 Jämför bilder</button><div id="mmCompareResult" style="margin-top:12px"></div></div>`;
 document.getElementById("mmBefore").value="0"; document.getElementById("mmAfter").value=String(ims.length-1);
 window.mmCompareImgs=ims; window.mmComparePlant=p;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
function renderPhotoCompare(){
 const ims=window.mmCompareImgs||[], a=ims[Number(document.getElementById("mmBefore").value)], b=ims[Number(document.getElementById("mmAfter").value)];
 if(!a||!b)return;
 const da=new Date(a.createdAt),db=new Date(b.createdAt),gap=Math.round((db-da)/86400000);
 document.getElementById("mmCompareResult").innerHTML=`<div class="mm-compare"><div class="mm-compare-card"><div class="mm-compare-label">Före · Dag ${ageDays(window.mmComparePlant.originDate,da)}</div><img class="mm-compare-img" src="${URL.createObjectURL(a.blob)}"></div><div class="mm-compare-card"><div class="mm-compare-label">Efter · Dag ${ageDays(window.mmComparePlant.originDate,db)}</div><img class="mm-compare-img" src="${URL.createObjectURL(b.blob)}"></div></div><div class="mm-compare-gap">⏱️ ${gap} ${gap===1?"dag":"dagar"} mellan bilderna</div>`;
}



async function editPhotoDate(id){
 const im=await one(IMG,id); if(!im)return;
 const d=new Date(im.createdAt);
 const value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
 const wrap=document.createElement("div"); wrap.className="mm-edit-date";
 wrap.innerHTML=`<input id="mmDate_${id}" type="datetime-local" value="${value}"><button class="mm-save-date" onclick="savePhotoDate('${id}')">💾 Spara datum & tid</button>`;
 const old=document.getElementById("mmEdit_"+id); if(old){old.replaceWith(wrap);wrap.id="mmEdit_"+id}else{wrap.id="mmEdit_"+id;document.body.appendChild(wrap)}
}
async function savePhotoDate(id){
 const im=await one(IMG,id), input=document.getElementById("mmDate_"+id); if(!im||!input)return;
 const d=new Date(input.value); if(Number.isNaN(d.getTime()))return;
 im.createdAt=d.toISOString(); await put(IMG,im); showPhotoTimeline();
}



async function editPhotoNote(id){
 const im=await one(IMG,id); if(!im)return;
 const wrap=document.getElementById("mmNote_"+id);
 if(wrap){wrap.remove();return}
 const holder=document.createElement("div"); holder.id="mmNote_"+id;
 holder.innerHTML=`<textarea class="mm-note" id="mmNoteInput_${id}" placeholder="Vad hände på den här bilden?">${esc(im.note||"")}</textarea><button class="mm-save-note" onclick="savePhotoNote('${id}')">💾 Spara anteckning</button>`;
 const card=document.querySelector(`[data-mm-img="${id}"]`); if(card)card.appendChild(holder);
}
async function savePhotoNote(id){
 const im=await one(IMG,id), input=document.getElementById("mmNoteInput_"+id); if(!im||!input)return;
 im.note=input.value.trim(); await put(IMG,im); showPhotoTimeline();
}



async function addPhotoTag(id,input){
 const tag=input.value.trim().replace(/^#/,""); if(!tag)return;
 const im=await one(IMG,id); if(!im)return;
 im.tags=Array.isArray(im.tags)?im.tags:[]; if(!im.tags.some(t=>t.toLowerCase()===tag.toLowerCase()))im.tags.push(tag);
 await put(IMG,im); input.value=""; showPhotoTimeline();
}
async function removePhotoTag(id,tag){
 const im=await one(IMG,id); if(!im)return;
 im.tags=(im.tags||[]).filter(t=>t!==tag); await put(IMG,im); showPhotoTimeline();
}
async function filterPhotoTag(tag){
 const p=await one(PS,current); if(!p)return;
 const ims=(await imgs(current)).filter(im=>(im.tags||[]).some(t=>t.toLowerCase()===tag.toLowerCase())).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🏷️ ${esc(tag)} — ${ims.length} bilder</h2><div class="card"><div class="mm-timeline">${ims.map(im=>{const d=new Date(im.createdAt),age=ageDays(p.originDate,d);return `<div class="mm-time-card"><img class="mm-time-img" src="${URL.createObjectURL(im.blob)}"><div><b>🌱 Dag ${age}</b><div class="muted">${d.toLocaleDateString("sv-SE")}</div><div class="mm-img-tags">${(im.tags||[]).map(t=>`<span class="mm-img-tag">#${esc(t)}</span>`).join("")}</div></div></div>`}).join("")||"<div class='muted'>Inga bilder med den taggen.</div>"}</div></div>`;
}



async function toggleMilestone(id){
 const im=await one(IMG,id); if(!im)return;
 im.milestone=!im.milestone;
 if(im.milestone&&!im.milestoneType)im.milestoneType="Viktig händelse";
 await put(IMG,im); showPhotoTimeline();
}
async function setMilestoneType(id,type){
 const im=await one(IMG,id); if(!im)return;
 im.milestone=true; im.milestoneType=type; await put(IMG,im); showPhotoTimeline();
}


