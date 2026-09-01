let mmStream=null;
async function openCamera(){
  try{
    const cam=document.getElementById("mmCamera"),video=document.getElementById("mmVideo");
    mmStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});
    video.srcObject=mmStream;cam.classList.add("show");
  }catch(e){alert("📷 Kameran kunde inte öppnas. Kontrollera kameratillåtelsen i Safari.");}
}
function closeCamera(){if(mmStream){mmStream.getTracks().forEach(t=>t.stop());mmStream=null}document.getElementById("mmCamera").classList.remove("show")}
async function takeCameraPhoto(){
  const v=document.getElementById("mmVideo"),c=document.getElementById("mmCanvas");
  if(!v.videoWidth)return;
  c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0);
  const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",.88));
  closeCamera();
  openEditor(blob,(edited)=>{
    const f=new File([edited],"monstera-"+Date.now()+".jpg",{type:"image/jpeg"});
    showCameraPreview(f);
  });
  const p=await one(PS,current),im=(await imgs(current)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)),prev=im[im.length-1],m=prev?.measurements||{};
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">📸 Kameradokumentation</h2><div class="card"><img src="${URL.createObjectURL(blob)}" style="width:100%;border-radius:16px"><div class="infoRow"><span>🌿 Planta</span><b>${esc(p.name)}</b></div><div class="infoRow"><span>🎂 Ålder</span><b>Dag ${ageDays(p.originDate,new Date())}</b></div><button class="save" style="width:100%;margin-top:10px" onclick="saveCameraDoc(window.mmCameraFile)">💾 Spara bilden</button></div>`;
  window.mmCameraFile={file:f,prev,m};
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveCameraDoc(x){
  if(!x)return;const data={plantId:current,createdAt:new Date().toISOString(),measurements:x.prev||{},note:"",tag:"normal",blob:await optimizeImage(x.file)};
  await put(IS,data);await renderDetail();await renderHome();await renderDashboard();alert("✅ Kamerabilden är sparad.");
}



let mmFacing="environment";
function toggleGuide(){const g=document.getElementById("mmGuide");g.style.display=g.style.display==="none"?"flex":"none"}
async function flipCamera(){
  mmFacing=mmFacing==="environment"?"user":"environment";
  if(mmStream){mmStream.getTracks().forEach(t=>t.stop());mmStream=null}
  try{
    const v=document.getElementById("mmVideo");
    mmStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:mmFacing,width:{ideal:1920},height:{ideal:1080}},audio:false});
    v.srcObject=mmStream;
  }catch(e){alert("📷 Kunde inte byta kamera.");}
}



let mmEditBlob=null,mmEditAngle=0,mmEditZoom=100,mmEditTarget=null;
function openEditor(blob,target){mmEditBlob=blob;mmEditTarget=target;mmEditAngle=0;mmEditZoom=100;document.getElementById("mmZoom").value=100;document.getElementById("mmEditImg").src=URL.createObjectURL(blob);applyEdit();document.getElementById("mmEditor").classList.add("show")}
function applyEdit(){const i=document.getElementById("mmEditImg");i.style.transform=`rotate(${mmEditAngle}deg) scale(${mmEditZoom/100})`}
function rotateEdit(d){mmEditAngle+=d;applyEdit()}
function resetEdit(){mmEditAngle=0;mmEditZoom=100;document.getElementById("mmZoom").value=100;applyEdit()}
function closeEditor(){document.getElementById("mmEditor").classList.remove("show")}
async function finishEdit(){
  const img=document.getElementById("mmEditImg"),c=document.createElement("canvas");
  const scale=Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);
  const ctx=c.getContext("2d");ctx.translate(c.width/2,c.height/2);ctx.rotate(mmEditAngle*Math.PI/180);const w=c.width,h=c.height;ctx.drawImage(img,-w/2,-h/2,w,h);
  const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",.9));closeEditor();
  if(mmEditTarget) mmEditTarget(blob);
}



function showCameraPreview(f){
  window.mmCameraFile={file:f};
  const area=document.getElementById("statsArea");
  one(PS,current).then(p=>{
    area.innerHTML=`<h2 class="timelineTitle">📸 Kameradokumentation</h2><div class="card"><img src="${URL.createObjectURL(f)}" style="width:100%;border-radius:16px"><div class="infoRow"><span>🌿 Planta</span><b>${esc(p.name)}</b></div><div class="infoRow"><span>🎂 Ålder</span><b>Dag ${ageDays(p.originDate,new Date())}</b></div><button class="save" style="width:100%;margin-top:10px" onclick="saveCameraDoc(window.mmCameraFile)">💾 Spara bilden</button></div>`;
    area.scrollIntoView({behavior:"smooth",block:"start"});
  });
}


