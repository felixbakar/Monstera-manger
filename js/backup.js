const BVER="2.0";

const BST=[
  PS,
  IS,
  "envLogs",
  "waterLogs",
  "tempLogs",
  "humidityLogs",
  "lightLogs",
  "substrateLogs",
  "events"
];

async function b64(b){

  if(!b)
    return null;

  const a=new Uint8Array(
    await b.arrayBuffer()
  );

  let s="";

  for(
    let i=0;
    i<a.length;
    i+=32768
  ){

    s+=String.fromCharCode(
      ...a.subarray(
        i,
        i+32768
      )
    );

  }

  return btoa(s);

}

function blob(s,t){

  const a=atob(s);

  const u=new Uint8Array(
    a.length
  );

  for(
    let i=0;
    i<a.length;
    i++
  )
    u[i]=a.charCodeAt(i);

  return new Blob(
    [u],
    {type:t}
  );

}

async function makeBackup(){

  const data={};

  for(
    const s of BST
  )
    data[s]=await all(s);

  data[IS]=
    await Promise.all(
      data[IS].map(
        async x=>{

          const y={...x};

          if(y.blob){

            y.blobBase64=
              await b64(y.blob);

            y.blobType=
              y.blob.type;

            delete y.blob;

          }

          return y;

        }
      )
    );

  return{
    app:"Monstera Manager",
    version:BVER,
    createdAt:
      new Date().toISOString(),
    data
  };

}

function valid(x){

  return !!x &&
    x.app==="Monstera Manager" &&
    x.data &&
    Array.isArray(
      x.data.plants
    ) &&
    Array.isArray(
      x.data.images
    );

}

async function exportBackup(){

  const x=
    await makeBackup();

  const a=
    document.createElement("a");

  a.href=
    URL.createObjectURL(
      new Blob(
        [JSON.stringify(x)],
        {
          type:"application/json"
        }
      )
    );

  a.download=
    "monstera-manager-backup.json";

  a.click();

}

function importBackup(){

  const i=$("backupInput");

  i.value="";

  i.onchange=
    async()=>{

      try{

        const x=
          JSON.parse(
            await i.files[0].text()
          );

        if(!valid(x))
          throw Error(
            "Ogiltig backup"
          );

        if(
          !confirm(
            "Återställa backup? Nuvarande data ersätts."
          )
        )
          return;

        for(
          const s of BST
        ){

          for(
            const r
            of await all(s)
          )
            await del(
              s,
              r.id
            );

          for(
            const r0
            of x.data[s]||[]
          ){

            const r={
              ...r0
            };

            if(
              s===IS &&
              r.blobBase64
            ){

              r.blob=
                blob(
                  r.blobBase64,
                  r.blobType||
                  "image/jpeg"
                );

              delete r.blobBase64;

            }

            await put(
              s,
              r
            );

          }

        }

        await renderHome();

        await renderDashboard();

        alert(
          "✅ Backup återställd"
        );

      }catch(e){

        alert(
          "❌ "+e.message
        );

      }

    };

  i.click();

}