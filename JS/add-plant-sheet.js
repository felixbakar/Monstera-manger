(function(){
  const $ = id => document.getElementById(id);

  window.openAddPlantSheet = async function(){
    const s = $("mmAddPlantSheet");
    if(!s) return;
    $("mmAddPlantForm")?.reset();
    const today = new Date().toISOString().slice(0,10);
    if($("mmAddOrigin")) $("mmAddOrigin").value = today;
    if($("mmAddPurchase")) $("mmAddPurchase").value = today;
    await MM_prepareAddPlantSheet();
    s.style.display = "flex";
    requestAnimationFrame(() => s.classList.add("mm-open"));
    document.body.style.overflow = "hidden";
    setTimeout(() => $("mmAddName")?.focus(), 280);
  };

  window.closeAddPlantSheet = function(){
    const s = $("mmAddPlantSheet");
    if(!s) return;
    s.classList.remove("mm-open");
    setTimeout(() => {
      s.style.display = "none";
      document.body.style.overflow = "";
    }, 220);
  };

  window.MM_toggleCustomCategory = function(){
    const select = $("mmAddCategory");
    const wrap = $("mmCustomCategoryWrap");
    const variantWrap = $("mmMonsteraVariantWrap");
    if(wrap) wrap.style.display = select?.value === "__custom__" ? "block" : "none";
    if(variantWrap) variantWrap.style.display = select?.value === "Monstera" ? "block" : "none";
    MM_refreshAutoName();
  };

  window.MM_refreshAutoName = async function(){
    const cat=$("mmAddCategory")?.value;
    const variant=$("mmAddVariant")?.value;
    const name=$("mmAddName");
    if(!name)return;
    if(cat!=="Monstera"||!variant){
      name.readOnly=false;
      return;
    }
    name.value=await nextMonsteraName(variant,!!$("mmAddCutting")?.checked);
    name.readOnly=true;
  };

  window.MM_toggleMotherPlant = function(){
    const checked = $("mmAddCutting")?.checked;
    const wrap = $("mmMotherWrap");
    if(wrap) wrap.style.display = checked ? "block" : "none";
  };

  window.MM_prepareAddPlantSheet = async function(){
    const cat = $("mmAddCategory");
    const mother = $("mmMotherPlant");

    if(cat){
      let plants = [];
      try { plants = await all(PS); } catch(e) {}

      const categories = [];
      (plants || []).forEach(p => {
        const c = String(p.category || "").trim();
        if(c && !categories.some(x => x.toLowerCase() === c.toLowerCase())) categories.push(c);
      });

      ["Monstera", "Fikus", "Övriga"].forEach(c => {
        if(!categories.some(x => x.toLowerCase() === c.toLowerCase())) categories.push(c);
      });

      cat.innerHTML = categories.map(c =>
        `<option value="${esc(c)}">${esc(c)}</option>`
      ).join("") + `<option value="__custom__">➕ Lägg till egen kategori…</option>`;

      cat.value = categories.includes("Monstera") ? "Monstera" : (categories[0] || "Monstera");
      const variant=$("mmAddVariant");
      if(variant){
        variant.innerHTML=MONSTERA_VARIANTS.map(v=>`<option value="${esc(v.name)}">${esc(v.label)}</option>`).join("");
        variant.value="Deliciosa";
      }
      $("mmCustomCategory").value = "";
      MM_toggleCustomCategory();
    }

    if(mother){
      let plants = [];
      try { plants = await all(PS); } catch(e) {}
      mother.innerHTML =
        `<option value="">Välj moderplanta…</option>` +
        (plants || []).map(p =>
          `<option value="${esc(p.id)}">${esc(p.name || "Namnlös planta")} — ${esc(p.displayId || "")}</option>`
        ).join("");
    }

    MM_toggleMotherPlant();
    const motherSelect=$("mmMotherPlant");
    if(motherSelect && !motherSelect.dataset.bound){
      motherSelect.dataset.bound="1";
      motherSelect.addEventListener("change",async()=>{
        const mother=await one(PS,motherSelect.value);
        if(mother?.category==="Monstera"&&$("mmAddVariant")){
          $("mmAddVariant").value=monsteraVariantOf(mother);
          await MM_refreshAutoName();
        }
      });
    }
  };

  window.MM_submitAddPlant = async function(ev){
    ev.preventDefault();

    const selected = $("mmAddCategory")?.value || "Monstera";
    const variant = selected === "Monstera" ? ($("mmAddVariant")?.value || "Deliciosa") : null;
    const isCutting = !!$("mmAddCutting")?.checked;
    const name = selected === "Monstera" ? await nextMonsteraName(variant,isCutting) : $("mmAddName")?.value.trim();
    if(!name){
      $("mmAddName")?.focus();
      return false;
    }
    const custom = $("mmCustomCategory")?.value.trim();
    const category = selected === "__custom__" ? custom : selected;

    if(!category){
      alert("Skriv ett namn på den egna kategorin.");
      $("mmCustomCategory")?.focus();
      return false;
    }

    const motherPlantId = $("mmMotherPlant")?.value || null;

    if(isCutting && !motherPlantId){
      alert("Välj vilken planta sticklingen kommer från.");
      return false;
    }

    try {
      const originDate = $("mmAddOrigin")?.value;
      const purchaseDate = $("mmAddPurchase")?.value || null;

      if(!originDate){
        alert("Välj ursprungsdatum.");
        $("mmAddOrigin")?.focus();
        return false;
      }

      await put(PS, {
        id: crypto.randomUUID(),
        displayId: await idFor(),
        name,
        category,
        variant: category === "Monstera" ? variant : null,
        originDate,
        purchaseDate,
        description: "",
        isCutting,
        motherPlantId: isCutting ? motherPlantId : null,
        createdAt: new Date().toISOString()
      });

      closeAddPlantSheet();
      await renderHome();
      return false;
    } catch(e) {
      console.error(e);
      alert("Kunde inte skapa plantan. Försök igen.");
      return false;
    }
  };

  $("mmAddName")?.addEventListener("input",()=>{
    if($("mmAddCategory")?.value!=="Monstera") $("mmAddName").readOnly=false;
  });
  $("mmAddVariant")?.addEventListener("change",MM_refreshAutoName);
  $("mmAddCutting")?.addEventListener("change",MM_refreshAutoName);

  document.addEventListener("keydown", e => {
    if(e.key === "Escape") closeAddPlantSheet();
  });
})();
