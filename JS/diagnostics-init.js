(function(){
  const MM_diagErrors=[];
  window.addEventListener("error",function(e){
    MM_diagErrors.push({type:"JavaScript",message:e.message||"Okänt JS-fel",source:e.filename||"",line:e.lineno||0});
    if(window.MM_runDiagnostics) window.MM_runDiagnostics();
  });
  window.addEventListener("unhandledrejection",function(e){
    MM_diagErrors.push({type:"Promise",message:e.reason?.message||String(e.reason||"Okänt Promise-fel")});
    if(window.MM_runDiagnostics) window.MM_runDiagnostics();
  });

  function D(v){return typeof esc==="function"?esc(String(v)):String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});}
  function C(label,ok,detail){return {label:label,ok:!!ok,detail:detail||""};}

  if(typeof window.runBackupIntegrityTest!=="function" && typeof window.MM_runBackupIntegrityTest==="function") window.runBackupIntegrityTest=window.MM_runBackupIntegrityTest;

window.MM_runDiagnostics=async function(){
    const checks=[];
    checks.push(C("JavaScript-fel",MM_diagErrors.length===0,MM_diagErrors.length?MM_diagErrors.map(function(x){return x.type+": "+x.message+(x.line?" (rad "+x.line+")":"");}).join(" | "):"Inga fångade JavaScript-fel."));
    checks.push(C("IndexedDB är tillgängligt",typeof indexedDB!=="undefined","Webbläsaren har IndexedDB."));
    checks.push(C("Databasfunktion finns",typeof openDB==="function","openDB är laddad."));
    let db=null;
    try{
      if(typeof openDB==="function") db=await openDB();
      checks.push(C("Databasen öppnas",!!db,db?"Anslutning till databasen lyckades.":"Databasen kunde inte öppnas."));
      if(db){
        const names=[PS,IS,"envLogs","waterLogs","tempLogs","humidityLogs","lightLogs","substrateLogs","events"];
        const missing=names.filter(function(n){return !db.objectStoreNames.contains(n);});
        checks.push(C("Alla datastores finns",missing.length===0,missing.length?"Saknas: "+missing.join(", "):names.length+" datastores hittades."));
      }
    }catch(e){checks.push(C("Databasen öppnas",false,e?.message||String(e)));}

    checks.push(C("Databasen hålls öppen",!!db && db.objectStoreNames.length>0,"Diagnostik stänger inte den delade databaskopplingen."));
    checks.push(C("Bildsystemet finns",typeof imgs==="function"&&typeof put==="function"&&typeof one==="function"&&typeof del==="function","Bild- och databasfunktionerna är laddade."));
    checks.push(C("Sticklingfält finns",!!document.getElementById("isCutting")&&!!document.getElementById("pMother"),"Stickling/modern-planta-kopplingen är laddad."));

    const required=[
      ["Plant-QA","runPlantQA"],["Bild-QA","runImageQA"],["Mätnings-QA","runMeasurementsQA"],
      ["Tillväxt-QA","runGrowthQA"],["Diagram-QA","runChartQA"],["Blad-QA","runLeafQA"],
      ["Rot-QA","runRootQA"],["Variegering-QA","runVariegationQA"],["Prognos-QA","runForecastQA"],
      ["Rekord-QA","runRecordsQA"],["Backup-QA","runBackupIntegrityTest"]
    ];
    required.forEach(function(x){checks.push(C(x[0]+" är laddad",typeof window[x[1]]==="function",typeof window[x[1]]==="function"?"Funktion hittad.":"Funktion saknas."));});

    const text=document.body?.innerText||"";
    const rawMarkers=["w.document.close()","${esc(","+results.map(x=>","area.innerHTML="];
    const raw=rawMarkers.filter(function(x){return text.indexOf(x)>=0;});
    checks.push(C("Ingen rå JavaScript-kod visas",raw.length===0,raw.length?"Hittade kodmarkör: "+raw.join(", "):"Ingen rå kodmarkör hittades i synlig text."));

    const broken=[...document.images].filter(function(img){
      if(!img.complete||img.naturalWidth!==0||!img.src)return false;
      const src=img.currentSrc||img.src||"";
      // Ignore the document itself / file URL used by the iOS file viewer.
      // This is not a broken plant image.
      try{
        const u=new URL(src,document.baseURI);
        const doc=new URL(document.baseURI);
        if(u.href===doc.href || (u.protocol==="file:" && u.pathname===doc.pathname))return false;
      }catch(e){}
      return true;
    });
    checks.push(C("Inga trasiga bilder",broken.length===0,
      broken.length
        ? broken.map(function(img){return (img.alt||"bild")+" → "+(img.currentSrc||img.src);}).join(" | ")
        : "Inga riktiga bildfiler verkar vara trasiga. Dokumentets egen file://-URL ignoreras."));

    checks.push(C("Dokument-URL filtreras från bildtest",true,"file://-referens till själva HTML-dokumentet räknas inte som trasig bild."));
    checks.push(C("Diagnosknappen fungerar",typeof window.MM_runDiagnostics==="function","Diagnosfunktionen är laddad."));
    checks.push(C("Kopieringsfunktionen finns",typeof navigator.clipboard!=="undefined"||document.queryCommandSupported?.("copy"),"Urklippskopiering stöds eller fallback kan användas."));

    const bad=checks.filter(function(x){return !x.ok;}).length;
    const good=checks.length-bad;
    const summary=document.getElementById("mmDiagSummary");
    const body=document.getElementById("mmDiagBody");
    const report=document.getElementById("mmDiagReport");
    summary.textContent=bad?"🔴 "+bad+" fel":"🟢 "+good+"/"+checks.length+" OK";
    summary.style.background=bad?"#fde4e2":"#e4f3e7";
    summary.style.color=bad?"#a32018":"#276b36";
    body.innerHTML=checks.map(function(x){
      return '<div class="mm-diag-row '+(x.ok?"good":"bad")+'"><div class="mm-diag-icon">'+(x.ok?"🟢":"🔴")+'</div><div class="mm-diag-main"><div class="mm-diag-label">'+D(x.label)+'</div><div class="mm-diag-detail">'+D(x.detail)+'</div></div></div>';
    }).join("");

    const textReport=[
      "MONSTERA MANAGER — DIAGNOSTIK",
      "Tid: "+new Date().toLocaleString("sv-SE"),
      "Resultat: "+(bad?(bad+" FEL, "+good+" OK"):("ALLT OK ("+good+" kontroller)")),
      "",
      ...checks.map(function(x){return (x.ok?"🟢 PASS":"🔴 FAIL")+" — "+x.label+(x.detail?" — "+x.detail:"");}),
      "",
      "Skicka gärna hela denna rapport till ChatGPT om något är rött."
    ].join("\n");
    window.MM_lastDiagnosticReport=textReport;
    report.textContent=textReport;
    report.style.display=bad?"block":"none";
    return {checks:checks,bad:bad,good:good,text:textReport};
  };

  
  window.MM_repairBrokenImage=async function(){
    const broken=[...document.images].filter(function(img){return img.complete&&img.naturalWidth===0&&img.src;});
    if(!broken.length){alert("Inga trasiga bilder hittades.");return;}
    broken.forEach(function(img){
      const src=img.getAttribute("src")||"";
      // Only repair obvious placeholder/empty sources. Never touch blob/data
      // images because those may be legitimate user photos.
      if(!src || src==="about:blank" || src==="undefined" || src==="null"){
        img.removeAttribute("src");
        img.style.display="none";
      }
    });
    await window.MM_runDiagnostics();
  };

window.MM_copyDiagnostics=async function(){
    let text=window.MM_lastDiagnosticReport;
    if(!text) text=(await window.MM_runDiagnostics()).text;
    let copied=false;
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);copied=true;}
    }catch(e){}
    if(!copied){
      const ta=document.createElement("textarea");
      ta.value=text;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.left="-9999px";
      document.body.appendChild(ta);ta.select();
      try{copied=document.execCommand("copy");}catch(e){}
      ta.remove();
    }
    const btn=document.getElementById("mmDiagCopy");
    if(btn){btn.textContent=copied?"✅ Kopierat!":"⚠️ Markera och kopiera";btn.classList.toggle("copied",copied);}
    document.getElementById("mmDiagReport").style.display="block";
  };

  setTimeout(function(){window.MM_runDiagnostics();},1200);
})();



function openPlantTools(){const x=document.getElementById('mmPlantTools');if(!x)return;x.classList.add('open');x.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closePlantTools(){const x=document.getElementById('mmPlantTools');if(!x)return;x.classList.remove('open');x.setAttribute('aria-hidden','true');document.body.style.overflow=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePlantTools()});


