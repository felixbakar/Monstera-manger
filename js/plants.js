/* =========================================================
   MONSTERA MANAGER
   plants.js
   Plantor, kategorier, varianter, sticklingar och startsida
   ========================================================= */


/* ---------------------------------------------------------
   Monstera-varianter
   --------------------------------------------------------- */

const MONSTERA_VARIANTS = [
  {
    name: "Deliciosa",
    label: "Monstera deliciosa"
  },
  {
    name: "Albo",
    label: "Monstera Albo"
  },
  {
    name: "Thai Constellation",
    label: "Monstera Thai Constellation"
  },
  {
    name: "Aurea",
    label: "Monstera Aurea"
  },
  {
    name: "Mint",
    label: "Monstera Mint"
  },
  {
    name: "Burle Marx Flame",
    label: "Monstera Burle Marx Flame"
  },
  {
    name: "Esqueleto",
    label: "Monstera Esqueleto"
  },
  {
    name: "Adansonii",
    label: "Monstera adansonii"
  },
  {
    name: "Dubia",
    label: "Monstera dubia"
  },
  {
    name: "Siltepecana",
    label: "Monstera siltepecana"
  },
  {
    name: "Standleyana",
    label: "Monstera standleyana"
  },
  {
    name: "Övrig",
    label: "Monstera – Övrig variant"
  }
];


/* ---------------------------------------------------------
   Identifiera variant
   --------------------------------------------------------- */

function monsteraVariantOf(p) {

  if (p?.variant) {
    return p.variant;
  }


  const text =
    String(
      (p?.name || "") +
      " " +
      (p?.displayId || "")
    ).toLowerCase();


  if (text.includes("thai")) {
    return "Thai Constellation";
  }

  if (text.includes("albo")) {
    return "Albo";
  }

  if (text.includes("aurea")) {
    return "Aurea";
  }

  if (text.includes("mint")) {
    return "Mint";
  }

  if (text.includes("burle marx")) {
    return "Burle Marx Flame";
  }

  if (text.includes("esqueleto")) {
    return "Esqueleto";
  }

  if (text.includes("adansonii")) {
    return "Adansonii";
  }

  if (text.includes("dubia")) {
    return "Dubia";
  }

  if (text.includes("siltepecana")) {
    return "Siltepecana";
  }

  if (text.includes("standleyana")) {
    return "Standleyana";
  }


  return "Deliciosa";
}


/* ---------------------------------------------------------
   Snyggt visningsnamn
   --------------------------------------------------------- */

function monsteraDisplayName(v) {

  const found =
    MONSTERA_VARIANTS.find(
      x => x.name === v
    );


  return found?.label ||
    ("Monstera " + v);

}


/* ---------------------------------------------------------
   Nästa automatiska Monstera-namn
   M = vanlig planta
   S = stickling
   --------------------------------------------------------- */

async function nextMonsteraName(
  variant,
  isCutting
) {

  const ps =
    await all(PS);


  const prefix =
    `Monstera ${variant}`;


  const letter =
    isCutting
      ? "S"
      : "M";


  let max = 0;


  const escapedPrefix =
    prefix.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );


  const re =
    new RegExp(
      "^" +
      escapedPrefix +
      " " +
      letter +
      "(\\d+)$",
      "i"
    );


  for (
    const p
    of ps
  ) {

    const plantVariant =
      String(
        p.variant ||
        monsteraVariantOf(p)
      );


    if (
      plantVariant !==
      variant
    ) {
      continue;
    }


    const match =
      String(
        p.name || ""
      ).match(re);


    if (match) {

      max =
        Math.max(
          max,
          Number(match[1]) || 0
        );

    }

  }


  return (
    `${prefix} ${letter}${max + 1}`
  );

}


/* ---------------------------------------------------------
   Visa automatiskt namn i formuläret
   --------------------------------------------------------- */

window.MM_refreshAutoName =
  async function () {

    const category =
      $("mmAddCategory")?.value;


    const variant =
      $("mmAddVariant")?.value;


    const name =
      $("mmAddName");


    if (!name) {
      return;
    }


    if (
      category !== "Monstera" ||
      !variant
    ) {

      name.readOnly = false;

      return;

    }


    name.value =
      await nextMonsteraName(
        variant,
        !!$("mmAddCutting")?.checked
      );


    name.readOnly = true;

  };


/* ---------------------------------------------------------
   Stickling → moderplanta
   --------------------------------------------------------- */

window.MM_toggleMotherPlant =
  function () {

    const checked =
      $("mmAddCutting")?.checked;


    const wrap =
      $("mmMotherWrap");


    if (wrap) {

      wrap.style.display =
        checked
          ? "block"
          : "none";

    }

  };


/* ---------------------------------------------------------
   Förbered "Lägg till planta"
   --------------------------------------------------------- */

window.MM_prepareAddPlantSheet =
  async function () {

    const categorySelect =
      $("mmAddCategory");


    const motherSelect =
      $("mmMotherPlant");


    /* -----------------------------------------------------
       Kategorier
       ----------------------------------------------------- */

    if (categorySelect) {

      let plants = [];


      try {

        plants =
          await all(PS);

      } catch (e) {

        plants = [];

      }


      const categories = [];


      /*
       * Ta med befintliga egna kategorier.
       */

      for (
        const p
        of plants
      ) {

        const c =
          String(
            p.category || ""
          ).trim();


        if (
          c &&
          !categories.some(
            x =>
              x.toLowerCase() ===
              c.toLowerCase()
          )
        ) {

          categories.push(c);

        }

      }


      /*
       * Dessa ska alltid finnas.
       */

      [
        "Monstera",
        "Fikus",
        "Övriga"
      ].forEach(c => {

        if (
          !categories.some(
            x =>
              x.toLowerCase() ===
              c.toLowerCase()
          )
        ) {

          categories.push(c);

        }

      });


      categorySelect.innerHTML =

        categories
          .map(
            c =>
              `<option value="${esc(c)}">${esc(c)}</option>`
          )
          .join("")

        +

        `<option value="__custom__">
          ➕ Lägg till egen kategori…
        </option>`;


      categorySelect.value =
        categories.includes(
          "Monstera"
        )
          ? "Monstera"
          : (
              categories[0] ||
              "Monstera"
            );


      const variantSelect =
        $("mmAddVariant");


      if (variantSelect) {

        variantSelect.innerHTML =
          MONSTERA_VARIANTS
            .map(
              v =>
                `<option value="${esc(v.name)}">${esc(v.label)}</option>`
            )
            .join("");


        variantSelect.value =
          "Deliciosa";

      }


      const custom =
        $("mmCustomCategory");


      if (custom) {
        custom.value = "";
      }


      MM_toggleCustomCategory();

    }


    /* -----------------------------------------------------
       Moderplantor
       ----------------------------------------------------- */

    if (motherSelect) {

      let plants = [];


      try {

        plants =
          await all(PS);

      } catch (e) {

        plants = [];

      }


      motherSelect.innerHTML =

        `<option value="">
          Välj moderplanta…
        </option>`

        +

        plants
          .map(
            p =>
              `<option value="${esc(p.id)}">
                ${esc(p.name || "Namnlös planta")}
                — ${esc(p.displayId || "")}
              </option>`
          )
          .join("");

    }


    MM_toggleMotherPlant();


    /* -----------------------------------------------------
       När moderplanta väljs:
       använd samma Monstera-variant
       ----------------------------------------------------- */

    if (
      motherSelect &&
      !motherSelect.dataset.bound
    ) {

      motherSelect.dataset.bound =
        "1";


      motherSelect.addEventListener(
        "change",
        async () => {

          const mother =
            await one(
              PS,
              motherSelect.value
            );


          if (
            mother?.category ===
              "Monstera" &&
            $("mmAddVariant")
          ) {

            $("mmAddVariant").value =
              monsteraVariantOf(
                mother
              );


            await MM_refreshAutoName();

          }

        }
      );

    }


    await MM_refreshAutoName();

  };


/* ---------------------------------------------------------
   Skapa planta från bottom sheet
   --------------------------------------------------------- */

window.MM_submitAddPlant =
  async function (ev) {

    ev.preventDefault();


    const selected =
      $("mmAddCategory")?.value ||
      "Monstera";


    const variant =
      selected === "Monstera"
        ? (
            $("mmAddVariant")?.value ||
            "Deliciosa"
          )
        : null;


    const isCutting =
      !!$("mmAddCutting")?.checked;


    /*
     * Monstera får automatiskt namn.
     * Övriga kategorier får manuellt namn.
     */

    const name =
      selected === "Monstera"

        ? await nextMonsteraName(
            variant,
            isCutting
          )

        : $("mmAddName")
            ?.value
            .trim();


    if (!name) {

      $("mmAddName")?.focus();

      return false;

    }


    const custom =
      $("mmCustomCategory")
        ?.value
        .trim();


    const category =
      selected === "__custom__"
        ? custom
        : selected;


    if (!category) {

      alert(
        "Skriv ett namn på den egna kategorin."
      );


      $("mmCustomCategory")
        ?.focus();


      return false;

    }


    const motherPlantId =
      $("mmMotherPlant")
        ?.value ||
      null;


    if (
      isCutting &&
      !motherPlantId
    ) {

      alert(
        "Välj vilken planta sticklingen kommer från."
      );


      return false;

    }


    try {

      const originDate =
        $("mmAddOrigin")
          ?.value;


      const purchaseDate =
        $("mmAddPurchase")
          ?.value ||
        null;


      if (!originDate) {

        alert(
          "Välj ursprungsdatum."
        );


        $("mmAddOrigin")
          ?.focus();


        return false;

      }


      await put(
        PS,
        {

          id:
            crypto.randomUUID(),

          displayId:
            await idFor(),

          name,

          category,

          variant:
            category === "Monstera"
              ? variant
              : null,

          originDate,

          purchaseDate,

          description: "",

          isCutting,

          motherPlantId:
            isCutting
              ? motherPlantId
              : null,

          createdAt:
            new Date().toISOString()

        }
      );


      closeAddPlantSheet();


      await renderHome();


      return false;


    } catch (e) {

      console.error(e);


      alert(
        "Kunde inte skapa plantan. Försök igen."
      );


      return false;

    }

  };


/* ---------------------------------------------------------
   Egna kategorier i gamla plant-modal
   --------------------------------------------------------- */

function toggleCustomCategory() {

  const select =
    $("pCategory");


  const wrap =
    $("customCategoryWrap");


  const input =
    $("pCustomCategory");


  const custom =
    select?.value ===
    "__custom__";


  if (wrap) {

    wrap.classList.toggle(
      "open",
      custom
    );

  }


  if (input) {

    input.required =
      custom;


    if (!custom) {
      input.value = "";
    }

  }

}


/* Gör funktionen tillgänglig globalt */

window.toggleCustomCategory =
  toggleCustomCategory;


/* ---------------------------------------------------------
   Moderplantor i gamla formuläret
   --------------------------------------------------------- */

async function populateMotherPlants() {

  const select =
    $("pMother");


  if (!select) {
    return;
  }


  const ps =
    await all(PS);


  select.innerHTML =

    `<option value="">
      Välj moderplanta...
    </option>`

    +

    ps
      .map(
        p =>
          `<option value="${esc(p.id)}">
            ${esc(p.name || "Namnlös planta")}
            — ${esc(p.displayId || "")}
          </option>`
      )
      .join("");


  toggleCuttingFields();

}


window.populateMotherPlants =
  populateMotherPlants;


/* ---------------------------------------------------------
   Sticklingfält i gamla formuläret
   --------------------------------------------------------- */

function toggleCuttingFields() {

  const checked =
    $("isCutting")?.checked;


  const wrap =
    $("motherWrap");


  if (wrap) {

    wrap.classList.toggle(
      "open",
      !!checked
    );

  }


  const select =
    $("pMother");


  if (select) {

    select.required =
      !!checked;

  }

}


window.toggleCuttingFields =
  toggleCuttingFields;


/* ---------------------------------------------------------
   Kategorier i gamla formuläret
   --------------------------------------------------------- */

async function populateCategoryOptions() {

  const select =
    $("pCategory");


  if (!select) {
    return;
  }


  const ps =
    await all(PS);


  const customCategories =
    [
      ...new Set(
        ps
          .map(
            p =>
              p.category
          )
          .filter(Boolean)
      )
    ];


  const cats = [
    "Monstera",
    "Fikus",
    "Övriga",

    ...customCategories.filter(
      c =>
        ![
          "Monstera",
          "Fokus",
          "Fikus",
          "Övriga"
        ].includes(c)
    )

  ];


  select.innerHTML =

    cats
      .map(
        c =>
          `<option value="${esc(c)}">
            ${
              c === "Monstera"
                ? "🌿"
                : c === "Fikus"
                  ? "🌿"
                  : c === "Övriga"
                    ? "🪴"
                    : "🌱"
            }
            ${esc(c)}
          </option>`
      )
      .join("")

    +

    `<option value="__custom__">
      ➕ Lägg till egen kategori…
    </option>`;


  select.value =
    "Monstera";


  toggleCustomCategory();

}


window.populateCategoryOptions =
  populateCategoryOptions;


/* ---------------------------------------------------------
   Öppna gamla plantformuläret
   --------------------------------------------------------- */

async function openPlantForm() {

  const now =
    new Date()
      .toISOString()
      .slice(0, 10);


  $("plantForm")?.reset();


  if ($("pOrigin")) {
    $("pOrigin").value =
      now;
  }


  if ($("pPurchase")) {
    $("pPurchase").value =
      now;
  }


  await populateCategoryOptions();

  await populateMotherPlants();


  $("plantModal")
    ?.classList
    .add("open");

}


window.openPlantForm =
  openPlantForm;


/* ---------------------------------------------------------
   Stäng gamla plantformuläret
   --------------------------------------------------------- */

function closePlantForm() {

  $("plantModal")
    ?.classList
    .remove("open");


  $("plantForm")
    ?.reset();


  toggleCuttingFields();

  toggleCustomCategory();

}


window.closePlantForm =
  closePlantForm;


/* ---------------------------------------------------------
   Moderplanta / relationer
   --------------------------------------------------------- */

async function relationHTML(p) {

  const ps =
    await all(PS);


  const mother =
    p.motherPlantId
      ? ps.find(
          x =>
            x.id ===
            p.motherPlantId
        )
      : null;


  const children =
    ps.filter(
      x =>
        x.isCutting &&
        x.motherPlantId ===
          p.id
    );


  if (
    !p.isCutting &&
    !children.length
  ) {

    return "";

  }


  let html =
    `<div class="relation-card">`;


  if (p.isCutting) {

    html += `

      <div>

        <b>🌱 Stickling</b>

        <div class="muted">
          Den här plantan kommer från:
        </div>

        ${
          mother

            ? `

              <button
                type="button"
                class="relation-link"
                onclick="openDetail('${mother.id}')"
              >

                <strong>
                  ${esc(
                    mother.name ||
                    "Namnlös planta"
                  )}
                </strong>

                <span>
                  ${esc(
                    mother.displayId ||
                    ""
                  )}
                  · Tryck för att öppna moderplantan
                </span>

              </button>

            `

            : `

              <div
                class="muted"
                style="margin-top:7px"
              >
                Moderplantan finns inte längre i registret.
              </div>

            `
        }

      </div>

    `;

  }


  if (children.length) {

    html += `

      <div
        style="${
          p.isCutting
            ? "margin-top:13px;padding-top:13px;border-top:1px solid var(--border)"
            : ""
        }"
      >

        <b>
          🌿 Sticklingar från den här plantan
        </b>

        ${
          children
            .map(
              c =>
                `

                <button
                  type="button"
                  class="relation-link"
                  onclick="openDetail('${c.id}')"
                >

                  <strong>
                    ${esc(
                      c.name ||
                      "Namnlös planta"
                    )}
                  </strong>

                  <span>
                    ${esc(
                      c.displayId ||
                      ""
                    )}
                    · Stickling
                  </span>

                </button>

              `
            )
            .join("")
        }

      </div>

    `;

  }


  return (
    html +
    `</div>`
  );

}


window.relationHTML =
  relationHTML;


/* ---------------------------------------------------------
   Startsidan
   --------------------------------------------------------- */

async function renderHome() {

  let p =
    await all(PS);


  $("plantCount").textContent =
    p.length;


  $("imageCount").textContent =
    (
      await all(IS)
    ).length;


  if (!p.length) {

    $("plants").innerHTML = `

      <div class="card empty">

        <div>🌱</div>

        <h3>
          Inga plantor ännu
        </h3>

        <p>
          Lägg till din första planta.
        </p>

      </div>

    `;

    return;

  }


  /* Nyast först */

  p.sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );


  /*
   * Normalisera gamla data.
   */

  for (
    const x
    of p
  ) {

    x.category =
      x.category ||
      "Monstera";


    if (
      x.category ===
      "Fokus"
    ) {

      x.category =
        "Fikus";

    }


    if (
      x.category ===
      "Monstera"
    ) {

      x.variant =
        monsteraVariantOf(x);

    }


    const ximgs =
      await imgs(x.id);


    x._count =
      ximgs.length;


    x._latest =
      ximgs.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )[0] ||
      null;

  }


  const nameById =
    new Map(
      p.map(
        x =>
          [
            x.id,
            x.name ||
              "Namnlös planta"
          ]
      )
    );


  const categoryMeta = {

    Monstera:
      ["🌿", "Monstera"],

    Fikus:
      ["🌿", "Fikus"],

    Övriga:
      ["🪴", "Övriga"]

  };


  const order = [
    "Monstera",
    "Fikus",
    "Övriga"
  ];


  const cats = [

    ...order,

    ...[
      ...new Set(
        p.map(
          x =>
            x.category
        )
      )
    ]
      .filter(
        c =>
          !order.includes(c)
      )

  ];


  /* -------------------------------------------------------
     Plantkort
     ------------------------------------------------------- */

  const plantCard =
    x => {

      const mother =
        x.motherPlantId
          ? nameById.get(
              x.motherPlantId
            )
          : null;


      const cutting =
        x.isCutting

          ? `

            <div
              class="muted"
              style="margin-top:5px"
            >
              🌱 Stickling
              ${
                mother
                  ? ` från ${esc(mother)}`
                  : ""
              }
            </div>

          `

          : "";


      const thumb =
        x._latest?.blob

          ? `

            <img
              src="${URL.createObjectURL(
                x._latest.blob
              )}"
              alt="Senaste bild av ${esc(
                x.name ||
                "plantan"
              )}"
            >

          `

          : "🌱";


      return `

        <div
          class="plant"
          onclick="openDetail('${x.id}')"
        >

          <div class="plantIcon">
            ${thumb}
          </div>

          <div class="plantInfo">

            <h3>
              ${esc(x.name)}
            </h3>

            <div class="muted">
              ${esc(
                x.displayId ||
                ""
              )}
            </div>

            <div class="age">
              🌱 ${age(
                x.originDate
              )}
            </div>

            <div class="muted">
              📸 ${x._count}
              ${
                x._count === 1
                  ? "bild"
                  : "bilder"
              }
            </div>

            ${cutting}

          </div>

          <div class="arrow">
            ›
          </div>

        </div>

      `;

    };


  /* -------------------------------------------------------
     Swipe-carousel
     ------------------------------------------------------- */

  const carousel =
    items => `

      <div class="plantCarousel">

        ${
          items
            .map(
              plantCard
            )
            .join("")
        }

      </div>

    `;


  /* -------------------------------------------------------
     Bygg kategorier + Monstera-varianter
     ------------------------------------------------------- */

  $("plants").innerHTML =

    cats
      .map(
        cat => {

          const items =
            p.filter(
              x =>
                x.category ===
                cat
            );


          if (!items.length) {
            return "";
          }


          const meta =
            categoryMeta[cat] ||
            ["🌱", cat];


          /*
           * Monstera delas upp
           * ytterligare per variant.
           */

          if (
            cat ===
            "Monstera"
          ) {

            const variants =
              [
                ...new Set(
                  items.map(
                    x =>
                      monsteraVariantOf(x)
                  )
                )
              ];


            const preferred =
              MONSTERA_VARIANTS
                .map(
                  x =>
                    x.name
                );


            variants.sort(
              (a, b) => {

                const ai =
                  preferred.indexOf(a);

                const bi =
                  preferred.indexOf(b);


                return (

                  (
                    ai < 0
                      ? 999
                      : ai
                  )

                  -

                  (
                    bi < 0
                      ? 999
                      : bi
                  )

                )

                ||

                a.localeCompare(
                  b,
                  "sv"
                );

              }
            );


            return `

              <section
                class="categoryGroup"
              >

                <div
                  class="categoryHead"
                >

                  <h3
                    class="categoryTitle"
                  >
                    ${meta[0]}
                    ${esc(meta[1])}
                  </h3>

                  <span
                    class="categoryCount"
                  >
                    ${items.length}
                    ${
                      items.length === 1
                        ? "planta"
                        : "plantor"
                    }
                  </span>

                </div>


                ${

                  variants
                    .map(
                      v => {

                        const vi =
                          items.filter(
                            x =>
                              monsteraVariantOf(x) ===
                              v
                          );


                        return `

                          <div
                            class="mm-variantGroup"
                          >

                            <div
                              class="mm-variantHead"
                            >

                              <h4
                                class="mm-variantTitle"
                              >
                                ${esc(
                                  monsteraDisplayName(
                                    v
                                  )
                                )}
                              </h4>

                              <span
                                class="mm-variantCount"
                              >
                                ${vi.length}
                                ${
                                  vi.length === 1
                                    ? "planta"
                                    : "plantor"
                                }
                              </span>

                            </div>


                            ${
                              vi.length > 1

                                ? `

                                  <div
                                    class="categoryHint"
                                  >
                                    Svep åt sidan för att se fler →
                                  </div>

                                `

                                : ""
                            }


                            ${carousel(vi)}

                          </div>

                        `;

                      }
                    )
                    .join("")

                }

              </section>

            `;

          }


          /* -------------------------------------------------
             Övriga kategorier
             ------------------------------------------------- */

          return `

            <section
              class="categoryGroup"
            >

              <div
                class="categoryHead"
              >

                <h3
                  class="categoryTitle"
                >
                  ${meta[0]}
                  ${esc(meta[1])}
                </h3>

                <span
                  class="categoryCount"
                >
                  ${items.length}
                  ${
                    items.length === 1
                      ? "planta"
                      : "plantor"
                  }
                </span>

              </div>


              ${
                items.length > 1

                  ? `

                    <div
                      class="categoryHint"
                    >
                      Svep åt sidan för att se fler →
                    </div>

                  `

                  : ""
              }


              ${carousel(items)}

            </section>

          `;

        }
      )
      .join("");

}


window.renderHome =
  renderHome;


/* ---------------------------------------------------------
   Öppna planta
   --------------------------------------------------------- */

async function openDetail(id) {

  current =
    id;


  $("home")
    .style
    .display =
    "none";


  $("detail")
    .classList
    .add("active");


  await renderDetail();

}


window.openDetail =
  openDetail;


/* ---------------------------------------------------------
   Tillbaka till startsidan
   --------------------------------------------------------- */

function goHome() {

  current =
    null;


  $("detail")
    .classList
    .remove("active");


  $("home")
    .style
    .display =
    "block";


  renderHome();

}


window.goHome =
  goHome;


/* ---------------------------------------------------------
   Event handlers för nya bottom-sheet
   --------------------------------------------------------- */

$("mmAddVariant")
  ?.addEventListener(
    "change",
    MM_refreshAutoName
  );


$("mmAddCutting")
  ?.addEventListener(
    "change",
    MM_refreshAutoName
  );


$("mmAddName")
  ?.addEventListener(
    "input",
    () => {

      if (
        $("mmAddCategory")
          ?.value !==
        "Monstera"
      ) {

        $("mmAddName")
          .readOnly =
          false;

      }

    }
  );