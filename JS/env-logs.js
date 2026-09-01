async function getEnvLogs(){return await all("envLogs")}
async function showExperimentLog(){
 const logs=(await getEnvLogs()).sort((a,b)=>new Date(a.date)-new Date(b.date));
 const area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🧪 Experimentlogg</h2><div class="card"><div class="mm-env-form"><input id="envDate" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"><div class="mm-env"><div class="mm-env-card"><div class="mm-env-label">🌡️ Temperatur °C</div><input id="envTemp" type="number" step="0.1" placeholder="22"></div><div class="mm-env-card"><div class="mm-env-label">💦 Luftfuktighet %</div><input id="envHum" type="number" min="0" max="100" step="1" placeholder="60"></div><div class="mm-env-card"><div class="mm-env-label">💡 Ljus timmar/dag</div><input id="envLight" type="number" min="0" max="24" step="0.1" placeholder="12"></div><div class="mm-env-card"><div class="mm-env-label">💧 Vattning</div><input id="envWater" type="text" placeholder="T.ex. 250 ml"></div></div><textarea id="envNote" placeholder="Anteckning om miljö, substrat, placering eller annan förändring..."></textarea><div class="mm-env-actions"><button class="mm-milestone" onclick="saveExperimentLog()">💾 Spara logg</button></div></div></div><div class="card"><h3>Senaste loggar</h3>${logs.length?logs.slice(-10).reverse().map(x=>`<div class="mm-env-card" style="margin-top:7px"><b>${new Date(x.date).toLocaleString("sv-SE")}</b><div class="mm-env-label">🌡️ ${x.temp??"—"} °C · 💦 ${x.hum??"—"}% · 💡 ${x.light??"—"} h · 💧 ${esc(x.water||"—")}</div><div>${esc(x.note||"")}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen experimentlogg ännu.</div>"}</div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveExperimentLog(){
 const log={id:crypto.randomUUID(),date:document.getElementById("envDate").value||new Date().toISOString(),temp:document.getElementById("envTemp").value,hum:document.getElementById("envHum").value,light:document.getElementById("envLight").value,water:document.getElementById("envWater").value,note:document.getElementById("envNote").value};
 await put("envLogs",log);showExperimentLog();
}



async function getWaterLogs(){return await all("waterLogs")}
async function showWaterHistory(){
 const logs=(await getWaterLogs()).sort((a,b)=>new Date(a.date)-new Date(b.date));
 const area=document.getElementById("statsArea");
 const latest=logs.at(-1), gaps=[]; for(let i=1;i<logs.length;i++)gaps.push(Math.max(1,Math.round((new Date(logs[i].date)-new Date(logs[i-1].date))/86400000)));
 const amounts=logs.map(x=>Number(x.amount)).filter(Number.isFinite),avg=amounts.length?amounts.reduce((a,b)=>a+b,0)/amounts.length:null,avgGap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null;
 area.innerHTML=`<h2 class="timelineTitle">💧 Vattningshistorik</h2><div class="card"><div class="mm-water"><div class="mm-water-card"><div class="mm-water-label">Senaste vattning</div><div class="mm-water-big">${latest?new Date(latest.date).toLocaleDateString("sv-SE"):"—"}</div></div><div class="mm-water-card"><div class="mm-water-label">Genomsnittlig mängd</div><div class="mm-water-big">${avg===null?"—":avg.toFixed(0)+" ml"}</div></div><div class="mm-water-card"><div class="mm-water-label">Snitt mellan vattningar</div><div class="mm-water-big">${avgGap===null?"—":avgGap.toFixed(1)+" dagar"}</div></div><div class="mm-water-card"><div class="mm-water-label">Antal registreringar</div><div class="mm-water-big">${logs.length}</div></div></div><div class="mm-water-form"><input id="waterDate" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"><input id="waterAmount" type="number" min="0" step="1" placeholder="Mängd vatten i ml"><input id="waterNote" type="text" placeholder="Anteckning, t.ex. genomvattnad / bottenbevattning"><button class="mm-milestone" onclick="saveWater()">💾 Spara vattning</button></div></div><div class="card"><h3>Senaste vattningar</h3><div class="mm-water-list">${logs.length?logs.slice(-10).reverse().map(x=>`<div class="mm-water-item"><b>${new Date(x.date).toLocaleString("sv-SE")}</b> · ${x.amount?x.amount+" ml":"—"}<div class="mm-water-label">${esc(x.note||"")}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen vattning registrerad ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveWater(){
 const amount=Number(document.getElementById("waterAmount")?.value);if(!Number.isFinite(amount)||amount<0)return;
 await put("waterLogs",{id:crypto.randomUUID(),date:document.getElementById("waterDate").value||new Date().toISOString(),amount,note:document.getElementById("waterNote").value});
 showWaterHistory();
}



async function getTempLogs(){return await all("tempLogs")}
async function showTemperatureHistory(){
 const logs=(await getTempLogs()).sort((a,b)=>new Date(a.date)-new Date(b.date));
 const area=document.getElementById("statsArea"), vals=logs.map(x=>Number(x.temp)).filter(Number.isFinite);
 const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,min=vals.length?Math.min(...vals):null,max=vals.length?Math.max(...vals):null;
 area.innerHTML=`<h2 class="timelineTitle">🌡️ Temperaturhistorik</h2><div class="card"><div class="mm-temp"><div class="mm-temp-card"><div class="mm-temp-label">Senaste</div><div class="mm-temp-big">${logs.at(-1)?.temp??"—"} °C</div></div><div class="mm-temp-card"><div class="mm-temp-label">Genomsnitt</div><div class="mm-temp-big">${avg===null?"—":avg.toFixed(1)} °C</div></div><div class="mm-temp-card"><div class="mm-temp-label">Lägsta</div><div class="mm-temp-big">${min===null?"—":min} °C</div></div><div class="mm-temp-card"><div class="mm-temp-label">Högsta</div><div class="mm-temp-big">${max===null?"—":max} °C</div></div></div><div class="mm-temp-form"><input id="tempDate" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"><input id="tempValue" type="number" step="0.1" placeholder="Temperatur °C"><input id="tempNote" type="text" placeholder="Anteckning, t.ex. dag/natt eller placering"><button class="mm-milestone" onclick="saveTemperature()">💾 Spara temperatur</button></div></div><div class="card"><h3>Senaste mätningar</h3><div class="mm-temp-list">${logs.length?logs.slice(-10).reverse().map(x=>`<div class="mm-temp-item"><b>${new Date(x.date).toLocaleString("sv-SE")}</b> · ${x.temp} °C<div class="mm-temp-label">${esc(x.note||"")}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen temperaturmätning registrerad ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveTemperature(){
 const temp=Number(document.getElementById("tempValue")?.value);if(!Number.isFinite(temp))return;
 await put("tempLogs",{id:crypto.randomUUID(),date:document.getElementById("tempDate").value||new Date().toISOString(),temp,note:document.getElementById("tempNote").value});
 showTemperatureHistory();
}



async function getHumidityLogs(){return await all("humidityLogs")}
async function showHumidityHistory(){
 const logs=(await getHumidityLogs()).sort((a,b)=>new Date(a.date)-new Date(b.date));
 const area=document.getElementById("statsArea"), vals=logs.map(x=>Number(x.hum)).filter(Number.isFinite);
 const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,min=vals.length?Math.min(...vals):null,max=vals.length?Math.max(...vals):null;
 area.innerHTML=`<h2 class="timelineTitle">💦 Luftfuktighet</h2><div class="card"><div class="mm-hum"><div class="mm-hum-card"><div class="mm-hum-label">Senaste</div><div class="mm-hum-big">${logs.at(-1)?.hum??"—"} %</div></div><div class="mm-hum-card"><div class="mm-hum-label">Genomsnitt</div><div class="mm-hum-big">${avg===null?"—":avg.toFixed(1)} %</div></div><div class="mm-hum-card"><div class="mm-hum-label">Lägsta</div><div class="mm-hum-big">${min===null?"—":min} %</div></div><div class="mm-hum-card"><div class="mm-hum-label">Högsta</div><div class="mm-hum-big">${max===null?"—":max} %</div></div></div><div class="mm-hum-form"><input id="humDate" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"><input id="humValue" type="number" min="0" max="100" step="1" placeholder="Luftfuktighet %"><input id="humNote" type="text" placeholder="Anteckning, t.ex. rum eller placering"><button class="mm-milestone" onclick="saveHumidity()">💾 Spara luftfuktighet</button></div></div><div class="card"><h3>Senaste mätningar</h3><div class="mm-hum-list">${logs.length?logs.slice(-10).reverse().map(x=>`<div class="mm-hum-item"><b>${new Date(x.date).toLocaleString("sv-SE")}</b> · ${x.hum} %<div class="mm-hum-label">${esc(x.note||"")}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen luftfuktighet registrerad ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveHumidity(){
 const hum=Number(document.getElementById("humValue")?.value);if(!Number.isFinite(hum)||hum<0||hum>100)return;
 await put("humidityLogs",{id:crypto.randomUUID(),date:document.getElementById("humDate").value||new Date().toISOString(),hum,note:document.getElementById("humNote").value});
 showHumidityHistory();
}



async function getLightLogs(){return await all("lightLogs")}
async function showLightHistory(){
 const logs=(await getLightLogs()).sort((a,b)=>new Date(a.date)-new Date(b.date));
 const area=document.getElementById("statsArea"), hours=logs.map(x=>Number(x.hours)).filter(Number.isFinite), lux=logs.map(x=>Number(x.lux)).filter(Number.isFinite);
 const avgH=hours.length?hours.reduce((a,b)=>a+b,0)/hours.length:null, avgLux=lux.length?lux.reduce((a,b)=>a+b,0)/lux.length:null;
 area.innerHTML=`<h2 class="timelineTitle">💡 Ljusdata</h2><div class="card"><div class="mm-lightdata"><div class="mm-light-card"><div class="mm-light-label">Senaste ljustid</div><div class="mm-light-big">${logs.at(-1)?.hours??"—"} h/dag</div></div><div class="mm-light-card"><div class="mm-light-label">Snitt ljustid</div><div class="mm-light-big">${avgH===null?"—":avgH.toFixed(1)} h/dag</div></div><div class="mm-light-card"><div class="mm-light-label">Senaste ljusnivå</div><div class="mm-light-big">${logs.at(-1)?.lux?logs.at(-1).lux+" lux":"—"}</div></div><div class="mm-light-card"><div class="mm-light-label">Snitt ljusnivå</div><div class="mm-light-big">${avgLux===null?"—":avgLux.toFixed(0)+" lux"}</div></div></div><div class="mm-light-form"><input id="lightDate" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"><input id="lightHours" type="number" min="0" max="24" step="0.1" placeholder="Ljustimmar per dag"><input id="lightLux" type="number" min="0" step="1" placeholder="Lux (valfritt)"><input id="lightNote" type="text" placeholder="Placering eller anteckning, t.ex. östfönster"><button class="mm-milestone" onclick="saveLight()">💾 Spara ljusdata</button></div></div><div class="card"><h3>Senaste registreringar</h3><div class="mm-light-list">${logs.length?logs.slice(-10).reverse().map(x=>`<div class="mm-light-item"><b>${new Date(x.date).toLocaleString("sv-SE")}</b> · ${x.hours??"—"} h/dag · ${x.lux?x.lux+" lux":"lux —"}<div class="mm-light-label">${esc(x.note||"")}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen ljusdata registrerad ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveLight(){
 const hours=Number(document.getElementById("lightHours")?.value),luxRaw=document.getElementById("lightLux")?.value;
 if(!Number.isFinite(hours)||hours<0||hours>24)return;
 await put("lightLogs",{id:crypto.randomUUID(),date:document.getElementById("lightDate").value||new Date().toISOString(),hours,lux:luxRaw===""?null:Number(luxRaw),note:document.getElementById("lightNote").value});
 showLightHistory();
}



async function getSubstrateLogs(){return await all("substrateLogs")}
async function showSubstrateLog(){
 const logs=(await getSubstrateLogs()).sort((a,b)=>new Date(a.date)-new Date(b.date)), latest=logs.at(-1), area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">🪴 Substratlogg</h2><div class="card"><div class="mm-substrate"><div class="mm-sub-card"><div class="mm-sub-label">Senaste registrering</div><div class="mm-sub-big">${latest?new Date(latest.date).toLocaleDateString("sv-SE"):"—"}</div><div class="mm-sub-label">${latest?esc(latest.mix||"Ingen blandning angiven"):"Ingen substratdata ännu"}</div></div>${latest?`<div class="mm-sub-card"><div class="mm-sub-label">Krukstorlek</div><div class="mm-sub-big">${esc(latest.pot||"—")}</div><div class="mm-sub-label">Perlit: ${esc(latest.perlite||"—")} · Bark: ${esc(latest.bark||"—")}</div></div>`:""}<div class="mm-sub-form"><input id="subDate" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"><input id="subMix" type="text" placeholder="Substrat, t.ex. jord + perlit + bark"><div class="mm-sub-parts"><input id="subPerlite" type="text" placeholder="Perlit, t.ex. 30%"><input id="subBark" type="text" placeholder="Bark/chips, t.ex. 20%"><input id="subPot" type="text" placeholder="Krukstorlek, t.ex. 12 cm"><input id="subDrain" type="text" placeholder="Dränering, t.ex. hål i botten"></div><textarea id="subNote" placeholder="Anteckning om substrat, omplantering eller rotmiljö..."></textarea><button class="mm-milestone" onclick="saveSubstrate()">💾 Spara substrat</button></div></div></div><div class="card"><h3>Historik</h3>${logs.length?logs.slice(-10).reverse().map(x=>`<div class="mm-sub-card" style="margin-top:7px"><b>${new Date(x.date).toLocaleDateString("sv-SE")}</b> · ${esc(x.mix||"—")}<div class="mm-sub-label">Perlit: ${esc(x.perlite||"—")} · Bark: ${esc(x.bark||"—")} · Kruka: ${esc(x.pot||"—")} · Dränering: ${esc(x.drain||"—")}</div><div>${esc(x.note||"")}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen substratlogg ännu.</div>"}</div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveSubstrate(){
 await put("substrateLogs",{id:crypto.randomUUID(),date:document.getElementById("subDate").value||new Date().toISOString(),mix:document.getElementById("subMix").value,perlite:document.getElementById("subPerlite").value,bark:document.getElementById("subBark").value,pot:document.getElementById("subPot").value,drain:document.getElementById("subDrain").value,note:document.getElementById("subNote").value});
 showSubstrateLog();
}



async function getEvents(){return await all("events")}
async function showEventLog(){
 const logs=(await getEvents()).sort((a,b)=>new Date(a.date)-new Date(b.date)),area=document.getElementById("statsArea");
 area.innerHTML=`<h2 class="timelineTitle">✂️ Händelselogg</h2><div class="card"><div class="mm-event-form"><input id="eventDate" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"><select id="eventType"><option>🌱 Planterad</option><option>💧 Vattning</option><option>🪴 Omplantering</option><option>✂️ Beskärning</option><option>🍃 Nytt blad</option><option>🌱 Ny rot</option><option>🤍 Variegering</option><option>📦 Flyttad</option><option>🧪 Experiment</option><option>📸 Dokumentation</option><option>📝 Annat</option></select><input id="eventTitle" type="text" placeholder="Kort rubrik"><textarea id="eventNote" placeholder="Vad hände? Vad ändrades och varför?"></textarea><button class="mm-milestone" onclick="saveEvent()">💾 Spara händelse</button></div></div><div class="card"><h3>Tidslinje</h3><div class="mm-events">${logs.length?logs.slice().reverse().map(x=>`<div class="mm-event-card"><div class="mm-event-type">${esc(x.type)}${x.title?" · "+esc(x.title):""}</div><div class="mm-event-date">${new Date(x.date).toLocaleString("sv-SE")}</div><div>${esc(x.note||"")}</div></div>`).join(""):"<div class='mm-growth-empty'>Ingen händelse registrerad ännu.</div>"}</div></div>`;
 area.scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveEvent(){
 await put("events",{id:crypto.randomUUID(),date:document.getElementById("eventDate").value||new Date().toISOString(),type:document.getElementById("eventType").value,title:document.getElementById("eventTitle").value,note:document.getElementById("eventNote").value});
 showEventLog();
}


