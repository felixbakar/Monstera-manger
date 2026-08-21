const DB="MonsteraManagerDB",
      VER=10,
      PS="plants",
      IS="images",
      IMG=IS;

let db=null;

const $=id=>document.getElementById(id);

function openDB(){

  if(db)
    return Promise.resolve(db);

  return new Promise((ok,no)=>{

    const r=indexedDB.open(DB,VER);

    r.onupgradeneeded=e=>{

      const d=e.target.result;

      if(!d.objectStoreNames.contains(PS))
        d.createObjectStore(PS,{keyPath:"id"});

      if(!d.objectStoreNames.contains(IS)){
        const s=d.createObjectStore(IS,{keyPath:"id"});
        s.createIndex("plantId","plantId");
      }

      [
        "envLogs",
        "waterLogs",
        "tempLogs",
        "humidityLogs",
        "lightLogs",
        "substrateLogs",
        "events"
      ].forEach(n=>{
        if(!d.objectStoreNames.contains(n))
          d.createObjectStore(n,{keyPath:"id"});
      });

    };

    r.onsuccess=e=>{
      db=e.target.result;

      db.onversionchange=()=>{
        db.close();
        db=null;
      };

      ok(db);
    };

    r.onerror=()=>{
      no(r.error);
    };

  });

}

function store(n,m="readonly"){

  if(!db)
    throw Error("Databasen är inte öppen.");

  return db.transaction(n,m).objectStore(n);
}

function put(n,v){

  return new Promise((ok,no)=>{

    try{

      const r=store(n,"readwrite").put(v);

      r.onsuccess=()=>{
        ok(v);
      };

      r.onerror=()=>{
        no(r.error);
      };

    }catch(e){
      no(e);
    }

  });

}

function all(n){

  return new Promise((ok,no)=>{

    try{

      const r=store(n).getAll();

      r.onsuccess=()=>{
        ok(r.result||[]);
      };

      r.onerror=()=>{
        no(r.error);
      };

    }catch(e){
      no(e);
    }

  });

}

function one(n,id){

  return new Promise((ok,no)=>{

    try{

      const r=store(n).get(id);

      r.onsuccess=()=>{
        ok(r.result);
      };

      r.onerror=()=>{
        no(r.error);
      };

    }catch(e){
      no(e);
    }

  });

}

function del(n,id){

  return new Promise((ok,no)=>{

    try{

      const r=store(n,"readwrite").delete(id);

      r.onsuccess=()=>{
        ok(true);
      };

      r.onerror=()=>{
        no(r.error);
      };

    }catch(e){
      no(e);
    }

  });

}

function imgs(id){

  return new Promise((ok,no)=>{

    try{

      const r=store(IS)
        .index("plantId")
        .getAll(id);

      r.onsuccess=()=>{
        ok(r.result||[]);
      };

      r.onerror=()=>{
        no(r.error);
      };

    }catch(e){
      no(e);
    }

  });

}

function esc(x){

  return String(x??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}

function ageDays(s,d=new Date()){

  return s
    ? Math.floor(
        (d-new Date(s+"T00:00:00"))/86400000
      )
    : 0;

}

function age(s){

  const d=ageDays(s);

  return d<0
    ? "Inte ännu"
    : "Dag "+d;

}

function fmt(s){

  return s
    ? new Date(s+"T00:00:00")
        .toLocaleDateString(
          "sv-SE",
          {
            year:"numeric",
            month:"long",
            day:"numeric"
          }
        )
    : "—";

}

async function optimizeImage(f){

  if(!f?.type?.startsWith("image/"))
    return f;

  const u=URL.createObjectURL(f);

  try{

    const im=await new Promise((r,j)=>{

      const i=new Image();

      i.onload=()=>{
        r(i);
      };

      i.onerror=j;

      i.src=u;

    });

    const scale=Math.min(
      1,
      1800/Math.max(
        im.naturalWidth,
        im.naturalHeight
      )
    );

    const c=document.createElement("canvas");

    c.width=Math.round(
      im.naturalWidth*scale
    );

    c.height=Math.round(
      im.naturalHeight*scale
    );

    c.getContext("2d")
      .drawImage(
        im,
        0,
        0,
        c.width,
        c.height
      );

    return await new Promise(r=>
      c.toBlob(
        b=>r(b||f),
        "image/jpeg",
        .82
      )
    );

  }finally{

    URL.revokeObjectURL(u);

  }

}