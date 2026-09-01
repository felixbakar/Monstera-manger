async function runDBSelfTest(){
 const area=document.getElementById("statsArea"), stores=[PS,IS,"envLogs","waterLogs","tempLogs","humidityLogs","lightLogs","substrateLogs","events"], results=[];
 const suffix=crypto.randomUUID();
 try{
  for(const n of stores){
   const id="__dbtest_"+n+"_"+suffix, base={id,plantId:"__dbtest_plant_"+suffix,test:true,value:1};
   if(n===IS)base.blob=new Blob(["Monstera Manager DB test"],{type:"text/plain"});
   await put(n,base);
   const read=await one(n,id); if(!read||read.value!==1)throw new Error("read miss: "+n);
   read.value=2; await put(n,read);
   const updated=await one(n,id); if(!updated||updated.value!==2)throw new Error("update miss: "+n);
   await del(n,id); const gone=await one(n,id); if(gone!==undefined)throw new Error("delete miss: "+n);
   results.push({n,ok:true});
  }
 }catch(e){
  results.push({n:"TEST",ok:false,error:e?.message||String(e)});
  for(const n of stores){try{await del(n,"__dbtest_"+n+"_"+suffix)}catch{}}
 }
 area.innerHTML="<h2 class=\"timelineTitle\">🧪 Databasetest 1.7E</h2><div class=\"card\"><div class=\"mm-dbtest\">"+results.map(x=>"<div class=\"mm-dbtest-row\"><span>"+esc(x.n)+"</span><span class=\""+(x.ok?"mm-dbtest-ok":"mm-dbtest-bad")+"\">"+(x.ok?"✅ PASS":"❌ FAIL")+"</span></div>").join("")+"</div><div class=\"mm-dbtest-note\">Varje store testas med skriv → läs → uppdatera → radera. Testposterna ska vara helt borttagna efteråt.</div></div>";
 area.scrollIntoView({behavior:"smooth",block:"start"});
}

async function runBackupIntegrityTest(){
 const suffix=Date.now().toString(36),testPlantId="__backup_test_plant_"+suffix,stores=window.MM_BACKUP_STORES.slice(),results=[],area=document.getElementById("statsArea");
 const testRows={};
 try{
  for(const n of stores){
   const id="__backup_test_"+n+"_"+suffix,row={id,test:true,plantId:testPlantId,value:"BEFORE",date:new Date().toISOString()};
   if(n===PS){row.name="Backup Test Plant";row.origin=new Date().toISOString().slice(0,10)}
   if(n===IS){row.blob=new Blob(["Monstera Manager backup test"],{type:"text/plain"})}
   testRows[n]=row;await put(n,row);
  }
  results.push({label:"Skapa komplett testdata",ok:true});
  const payload=await MM_makeBackupPayload();
  results.push({label:"Exportera alla datastores",ok:MM_validateBackup(payload)&&stores.every(n=>Array.isArray(payload.data[n]))});
  for(const n of stores)await del(n,testRows[n].id);
  results.push({label:"Radera testdata",ok:true});
  await MM_restoreBackup(payload);
  let restored=true;
  for(const n of stores){const row=await one(n,testRows[n].id);if(!row)restored=false;if(n===IS&&!(row.blob instanceof Blob || (row.blob && typeof row.blob.size==="number")))restored=false}
  results.push({label:"Återställ exakt snapshot",ok:restored});
  for(const n of stores)await del(n,testRows[n].id);
  const clean=(await Promise.all(stores.map(async n=>!(await one(n,testRows[n].id))))).every(Boolean);
  results.push({label:"Städa testdata efteråt",ok:clean});
 }catch(e){
  results.push({label:"Oväntat fel: "+(e?.message||String(e)),ok:false});
  for(const n of stores){try{const rows=await all(n);for(const r of rows.filter(x=>x.test&&x.plantId===testPlantId))await del(n,r.id)}catch{}}
 }
 const allOk=results.every(x=>x.ok);
 area.innerHTML="<h2 class=\"timelineTitle\">🧪 Full backup/restore-test</h2><div class=\"card\"><div class=\"mm-dbtest\">"+results.map(x=>"<div class=\"mm-dbtest-row\"><span>"+esc(x.label)+"</span><span class=\""+(x.ok?"mm-dbtest-ok":"mm-dbtest-bad")+"\">"+(x.ok?"✅ PASS":"❌ FAIL")+"</span></div>").join("")+"</div><div class=\"mm-dbtest-note\">"+(allOk?"✅ Snapshot-testet passerade. Backupen återställs som en ersättning av databasen och bild-Blob återställs korrekt.":"❌ Testet misslyckades. Använd inte backupen som enda säkerhetskopia förrän felet är löst.")+"</div></div>";
 area.scrollIntoView({behavior:"smooth",block:"start"});
}



/* Monstera Manager — 1.7 backup/data safety layer */
(function(){
  window.MM_BACKUP_VERSION="1.7";
  window.MM_BACKUP_STORES=[PS,IS,"envLogs","waterLogs","tempLogs","humidityLogs","lightLogs","substrateLogs","events"];
  async function blobToBase64(blob){if(!blob)return null;const buf=await blob.arrayBuffer(),bytes=new Uint8Array(buf);let bin="";for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin)}
  function base64ToBlob(b64,type="application/octet-stream"){const bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new Blob([bytes],{type})}
  window.MM_makeBackupPayload=async function(){
    const payload={app:"Monstera Manager",version:MM_BACKUP_VERSION,createdAt:new Date().toISOString(),data:{}};
    for(const n of MM_BACKUP_STORES)payload.data[n]=await all(n);
    payload.data[IS]=await Promise.all(payload.data[IS].map(async x=>{const copy={...x};if(copy.blob instanceof Blob){copy.blobBase64=await blobToBase64(copy.blob);copy.blobType=copy.blob.type||"image/jpeg";delete copy.blob}return copy}));
    return payload;
  };
  window.MM_validateBackup=function(x){
    if(!x||x.app!=="Monstera Manager"||!x.data||!Array.isArray(x.data[PS])||!Array.isArray(x.data[IS]))return false;
    // Older backups may not contain stores introduced in later versions.
    // They are treated as empty during restore; core stores are still mandatory.
    for(const n of window.MM_BACKUP_STORES){
      if(x.data[n]!==undefined && !Array.isArray(x.data[n]))return false;
    }
    return true;
  };
  window.MM_restoreBackup=async function(x){
    if(!MM_validateBackup(x))throw new Error("Ogiltig backup");
    // Restore means replace, not merge. This makes a restored backup an exact snapshot.
    for(const n of MM_BACKUP_STORES){
      const rows=Array.isArray(x.data[n])?x.data[n]:[];
      const existing=await all(n);
      for(const row of existing)await del(n,row.id);
      for(const row of rows){
        const copy={...row};
        if(n===IS&&copy.blobBase64){copy.blob=base64ToBlob(copy.blobBase64,copy.blobType||"image/jpeg");delete copy.blobBase64;delete copy.blobType}
        await put(n,copy);
      }
    }
  };
})();



async function runLegacyBackupCompatibilityTest(){
  const legacy={app:"Monstera Manager",version:"1.5",createdAt:new Date().toISOString(),data:{plants:[],images:[]}};
  const ok=MM_validateBackup(legacy);
  const area=document.getElementById("statsArea");
  area.innerHTML=`<h2 class="timelineTitle">🧪 Äldre backup-kompatibilitet</h2><div class="card"><div class="mm-dbtest-row"><span>V1.5-liknande backup utan nya stores</span><span class="${ok?"mm-dbtest-ok":"mm-dbtest-bad"}">${ok?"✅ PASS":"❌ FAIL"}</span></div><div class="mm-dbtest-note">${ok?"Äldre backups accepteras och saknade nya datastores behandlas som tomma.":"Äldre backups avvisas fortfarande."}</div></div>`;
  area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function verifyBackupFile(){
  const input=document.createElement("input");input.type="file";input.accept=".json,application/json";
  input.onchange=async()=>{const f=input.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(MM_validateBackup(x)){const d=x.data;alert(`✅ Backup OK\\nVersion: ${x.version||"äldre"}\\nPlantor: ${d.plants.length}\\nBilder: ${d.images.length}\\nMiljöloggar: ${(d.envLogs||[]).length+(d.tempLogs||[]).length+(d.humidityLogs||[]).length+(d.lightLogs||[]).length}\\nHändelser: ${(d.events||[]).length}`)}else alert("❌ Filen ser inte ut som en giltig Monstera Manager-backup.")}catch(e){alert("❌ Kunde inte läsa backupfilen.")}};
  input.click();
}

