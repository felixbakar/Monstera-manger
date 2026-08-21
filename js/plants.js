const MONSTERA_VARIANTS=[
  "Monstera deliciosa",
  "Monstera Albo",
  "Monstera Thai Constellation",
  "Monstera Aurea",
  "Monstera Mint",
  "Monstera Burle Marx Flame",
  "Monstera Esqueleto",
  "Monstera adansonii",
  "Monstera dubia"
];

async function nextPlantName(variant,cut){

  const p=await all(PS);

  const pre=String(variant);

  const re=new RegExp(
    "^"+
    pre.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )+
    " "+
    (cut?"S":"M")+
    "(\\d+)$",
    "i"
  );

  const nums=p
    .map(x=>String(x.name||"").match(re))
    .filter(Boolean)
    .map(x=>+x[1]);

  let n=1;

  while(nums.includes(n))
    n++;

  return pre+" "+(cut?"S":"M")+n;

}

async function nextDisplayId(){

  const p=await all(PS);

  let n=1;

  while(
    p.some(
      x=>x.displayId==="Albo #"+
        String(n).padStart(3,"0")
    )
  )
    n++;

  return "Albo #"+
    String(n).padStart(3,"0");

}

async function createPlant(x){

  return put(
    PS,
    {
      id:crypto.randomUUID(),
      displayId:await nextDisplayId(),
      name:x.name,
      category:x.category,
      variant:x.variant||null,
      originDate:x.originDate,
      purchaseDate:x.purchaseDate||null,
      description:x.description||"",
      isCutting:!!x.isCutting,
      motherPlantId:x.motherPlantId||null,
      createdAt:new Date().toISOString(),
      favorite:false,
      archived:false,
      status:"Aktiv",
      tags:[],
      economy:{
        costs:[],
        sales:[]
      },
      docInterval:0
    }
  );

}

async function updatePlant(id,x){

  const p=await one(PS,id);

  Object.assign(p,x);

  return put(PS,p);

}

async function populateMotherPlants(){

  const s=$("pMother");

  const p=await all(PS);

  s.innerHTML=
    '<option value="">Välj moderplanta...</option>'+
    p
      .filter(x=>!x.isCutting)
      .map(
        x=>
          `<option value="${x.id}">
            ${esc(x.name)}
          </option>`
      )
      .join("");

}

function toggleCutting(){

  const c=$("isCutting").checked;

  $("motherWrap")
    .classList
    .toggle("open",c);

  $("pMother").required=c;

}