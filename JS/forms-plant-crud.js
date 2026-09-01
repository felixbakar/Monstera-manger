function takePhoto(){$("photoInput").value="";$("photoInput").click()}

async function optimizeImage(file,maxSide=1800,quality=.82){
  if(!file.type.startsWith("image/"))return file;
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
    const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
    const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
    const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",quality));
    return blob||file;
  }finally{URL.revokeObjectURL(url)}
}
$("photoInput").onchange=async e=>{let f=e.target.files[0];if(!f||!current)return;f=await optimizeImage(f);let data=await documentationForm();if(!data)return;await put(IS,{id:crypto.randomUUID(),plantId:current,blob:f,createdAt:new Date().toISOString(),note:data.note,measurements:data.measurements});let pp=await one(PS,current);if(pp.reminder&&pp.reminder.enabled!==false){let days=Math.max(1,parseInt(pp.reminder.days||3,10));pp.reminder.nextDate=new Date(Date.now()+days*86400000).toISOString().slice(0,10);await put(PS,pp)}await renderDetail();await renderHome();await renderDashboard()}

function documentationForm(existing={}){
  return new Promise(resolve=>{
    let b=document.createElement("div");b.className="modalBg open";
    b.innerHTML=`<div class="modal"><div class="modalHead"><h2>📸 Ny dokumentation</h2><button class="close">×</button></div>
    <div class="field"><label>Anteckning (valfritt)</label><textarea id="docNote" placeholder="T.ex. ny rot, nytt blad, ändrad färg..."></textarea></div>
    <h3 style="margin:8px 0 10px">📏 Mätningar <span class="muted">(valfria)</span></h3>
    ${field("Höjd (cm)","height",existing.measurements?.height)}${field("Antal blad","leaves",existing.measurements?.leaves)}${field("Antal rötter","roots",existing.measurements?.roots)}${field("Längsta rot (cm)","longestRoot",existing.measurements?.longestRoot)}${field("Bladstorlek (cm)","leafSize",existing.measurements?.leafSize)}
    <button class="save" id="docSave">💾 Spara dokumentation</button></div>`;
    document.body.appendChild(b);
    b.querySelector(".close").onclick=()=>{b.remove();resolve(null)};
    b.querySelector("#docSave").onclick=()=>{
      const m={};["height","leaves","roots","longestRoot","leafSize"].forEach(k=>m[k]=b.querySelector("#m_"+k).value.trim());
      const note=b.querySelector("#docNote").value.trim();b.remove();resolve({note,measurements:m});
    };
  })
}
function measurementForm(existing={}){return new Promise(resolve=>{let b=document.createElement("div");b.className="modalBg open";b.innerHTML=`<div class="modal"><div class="modalHead"><h2>📏 Mätning</h2><button class="close">×</button></div><p class="muted">Alla fält är valfria.</p>${field("Höjd (cm)","height",existing.height)}${field("Antal blad","leaves",existing.leaves)}${field("Antal rötter","roots",existing.roots)}${field("Längsta rot (cm)","longestRoot",existing.longestRoot)}${field("Bladstorlek (cm)","leafSize",existing.leafSize)}<button class="save" id="measurementSave">💾 Spara dokumentation</button></div>`;document.body.appendChild(b);b.querySelector(".close").onclick=()=>{b.remove();resolve(null)};b.querySelector("#measurementSave").onclick=()=>{let m={};["height","leaves","roots","longestRoot","leafSize"].forEach(k=>m[k]=b.querySelector("#m_"+k).value.trim());b.remove();resolve(m)} })}
function field(label,key,val=""){return `<div class="field"><label>${label}</label><input id="m_${key}" type="number" step="0.1" min="0" value="${esc(val)}" placeholder="Valfritt"></div>`}
async function editDoc(id){let im=await imgs(current),x=im.find(v=>v.id===id);if(!x)return;let data=await documentationForm({note:x.note||"",measurements:x.measurements||{}});if(!data)return;x.note=data.note;x.measurements=data.measurements;await put(IS,x);renderDetail()}
async function removeDoc(id){if(!confirm("Ta bort den här dokumentationen?"))return;await del(IS,id);renderDetail();renderHome()}
async function removePlant(){
  const id=current;
  const p=await one(PS,id);
  if(!p)return;

  // Egen bekräftelseruta i stället för window.confirm(), som kan bete sig
  // opålitligt när HTML-filen körs som external-file på iPhone/iPad.
  const bg=document.createElement("div");
  bg.className="modalBg open";
  bg.style.zIndex="9999";
  bg.innerHTML=`<div class="modal" style="padding-bottom:24px">
    <div class="modalHead"><h2>🗑️ Ta bort planta?</h2><button type="button" class="close" id="cancelDelete">×</button></div>
    <p style="font-size:15px;line-height:1.5;margin:0 0 8px"><b>${esc(p.name||"Namnlös planta")}</b> (${esc(p.displayId||"")})</p>
    <p class="muted" style="line-height:1.5;margin-top:0">Detta tar bort plantan och all dokumentation/bilder som hör till den. Åtgärden går inte att ångra.</p>
    <button type="button" id="confirmDelete" style="width:100%;margin-top:10px;padding:15px;border:0;border-radius:14px;background:var(--dangerbg);color:var(--danger);font-weight:800;font-size:15px">🗑️ Ja, ta bort plantan</button>
    <button type="button" id="cancelDelete2" class="small" style="width:100%;margin-top:8px;background:#eef4ef">Avbryt</button>
  </div>`;
  document.body.appendChild(bg);

  const close=()=>bg.remove();
  bg.querySelector("#cancelDelete").onclick=close;
  bg.querySelector("#cancelDelete2").onclick=close;
  bg.onclick=e=>{if(e.target===bg)close()};

  bg.querySelector("#confirmDelete").onclick=async()=>{
    const btn=bg.querySelector("#confirmDelete");
    btn.disabled=true;btn.textContent="⏳ Tar bort...";
    try{
      const pictures=await imgs(id);
      for(const x of pictures) await del(IS,x.id);
      await del(PS,id);
      if(current===id) current=null;
      close();
      $("detail").classList.remove("active");
      $("home").style.display="block";
      await renderHome();
      await renderDashboard();
    }catch(err){
      console.error("removePlant failed",err);
      btn.disabled=false;btn.textContent="🗑️ Ja, ta bort plantan";
      alert("❌ Plantan kunde inte tas bort just nu. Försök igen.\n\n"+(err?.message||err));
    }
  };
}
openDB().then(async()=>{await renderHome();await renderDashboard();document.getElementById("plantSearch")?.addEventListener("input",applyPlantFilter);document.getElementById("plantFilter")?.addEventListener("change",applyPlantFilter);checkReminders()});




(()=> {
  const icon=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#234d2d"/><text x="256" y="330" text-anchor="middle" font-size="250">🌿</text></svg>`;
  const iconUrl="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(icon);
  document.getElementById("appIcon").href=iconUrl;
  const manifest={name:"Monstera Manager",short_name:"Monstera",start_url:location.href,display:"standalone",background_color:"#f7faf6",theme_color:"#234d2d",icons:[{src:iconUrl,sizes:"512x512",type:"image/svg+xml"}]};
  const link=document.createElement("link");link.rel="manifest";link.href=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:"application/manifest+json"}));document.head.appendChild(link);
})();


