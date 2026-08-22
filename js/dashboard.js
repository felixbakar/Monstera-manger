/* =========================================================
   MONSTERA MANAGER
   dashboard.js

   Dashboard / statistik / analys
   ========================================================= */


/* ---------------------------------------------------------
   Tillväxtkurvor
   --------------------------------------------------------- */

async function showGrowthChart() {

  const p =
    await one(
      PS,
      current
    );

  if (!p) return;


  const im =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const area =
    document.getElementById(
      "statsArea"
    );


  const metric =
    (
      key,
      label,
      unit
    ) => {

      const vals =
        im
          .map(
            x => ({

              day:
                ageDays(
                  p.originDate,
                  new Date(
                    x.createdAt
                  )
                ),

              v:
                Number(
                  x.measurements?.[
                    key
                  ]
                )

            })
          )
          .filter(
            x =>
              Number.isFinite(
                x.v
              )
          );


      if (!vals.length) {

        return `
          <div class="card">

            <b>
              ${label}
            </b>

            <p class="muted">
              Ingen mätdata ännu.
            </p>

          </div>
        `;

      }


      const min =
        Math.min(
          ...vals.map(
            x => x.v
          )
        );


      const max =
        Math.max(
          ...vals.map(
            x => x.v
          )
        );


      const range =
        Math.max(
          max - min,
          1
        );


      const w =
        340;

      const h =
        150;

      const pad =
        28;


      const points =
        vals.map(
          (x, i) => {

            const xx =
              pad +
              (
                vals.length === 1

                  ? 0

                  : i *
                    (
                      w -
                      pad * 2
                    ) /
                    (
                      vals.length -
                      1
                    )
              );


            const yy =
              h -
              pad -
              (
                (
                  x.v -
                  min
                ) /
                range
              ) *
              (
                h -
                pad * 2
              );


            return [
              xx,
              yy,
              x
            ];

          }
        );


      const poly =
        points
          .map(
            x =>
              x[0].toFixed(1) +
              "," +
              x[1].toFixed(1)
          )
          .join(" ");


      const circles =
        points
          .map(
            x => `

              <circle
                cx="${x[0]}"
                cy="${x[1]}"
                r="4"
                fill="currentColor"
              >

                <title>
                  Dag ${x[2].day}:
                  ${x[2].v}
                  ${unit}
                </title>

              </circle>

            `
          )
          .join("");


      return `

        <div class="card">

          <b>
            ${label}
          </b>

          <div
            style="
              overflow:auto
            "
          >

            <svg
              viewBox="
                0 0
                ${w}
                ${h}
              "
              style="
                width:100%;
                min-width:300px;
                height:170px;
                color:var(--primary)
              "
            >

              <line
                x1="${pad}"
                y1="${h-pad}"
                x2="${w-pad}"
                y2="${h-pad}"
                stroke="#dbe5dc"
              />

              <line
                x1="${pad}"
                y1="${pad}"
                x2="${pad}"
                y2="${h-pad}"
                stroke="#dbe5dc"
              />

              <polyline
                points="${poly}"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              ${circles}

              <text
                x="${pad}"
                y="${h-7}"
                font-size="9"
                fill="#6d786f"
              >
                Dag ${vals[0].day}
              </text>

              <text
                x="${w-pad}"
                y="${h-7}"
                text-anchor="end"
                font-size="9"
                fill="#6d786f"
              >
                Dag ${vals.at(-1).day}
              </text>

            </svg>

          </div>

          <div class="muted">

            Min ${min} ${unit}
            ·
            Max ${max} ${unit}

          </div>

        </div>

      `;

    };


  area.innerHTML = `

    <h2 class="timelineTitle">
      📈 Tillväxtkurvor
    </h2>

    ${metric(
      "height",
      "📏 Höjd",
      "cm"
    )}

    ${metric(
      "leaves",
      "🍃 Antal blad",
      "st"
    )}

    ${metric(
      "roots",
      "🌱 Antal rötter",
      "st"
    )}

    ${metric(
      "longestRoot",
      "📐 Längsta rot",
      "cm"
    )}

    ${metric(
      "leafSize",
      "🍃 Bladstorlek",
      "cm"
    )}

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Avancerad tillväxtanalys
   --------------------------------------------------------- */

async function showGrowthAnalysis() {

  const p =
    await one(
      PS,
      current
    );

  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const points =
    ims.map(
      im => ({

        day:
          ageDays(
            p.originDate,
            new Date(
              im.createdAt
            )
          ),

        m:
          im.measurements ||
          {}

      })
    );


  const area =
    document.getElementById(
      "statsArea"
    );


  const avg =
    (
      key,
      n = points.length
    ) => {

      const a =
        points.slice(
          -n
        );


      const first =
        a[0];

      const last =
        a[a.length - 1];


      if (
        !first ||
        !last
      ) {

        return null;

      }


      const days =
        last.day -
        first.day;


      if (
        days <= 0
      ) {

        return null;

      }


      const value =
        Number(
          last.m[key]
        ) -
        Number(
          first.m[key]
        );


      return value /
        days;

    };


  const metrics = [

    [
      "height",
      "📏 Höjd",
      "cm"
    ],

    [
      "leaves",
      "🍃 Blad",
      "st"
    ],

    [
      "roots",
      "🌱 Rötter",
      "st"
    ]

  ];


  const cards =
    metrics
      .map(
        (
          [
            key,
            label,
            unit
          ]
        ) => {

          const data =
            points
              .map(
                x => Number(
                  x.m[key]
                )
              )
              .filter(
                Number.isFinite
              );


          if (!data.length) {

            return `

              <div
                class="mm-analysis-card"
              >

                <div
                  class="mm-analysis-label"
                >
                  ${label}
                </div>

                <div
                  class="mm-analysis-small"
                >
                  Ingen data ännu.
                </div>

              </div>

            `;

          }


          const rate =
            avg(
              key,
              Math.min(
                3,
                points.length
              )
            );


          return `

            <div
              class="mm-analysis-card"
            >

              <div
                class="mm-analysis-label"
              >
                ${label}
              </div>

              <div
                class="mm-analysis-big"
              >

                ${
                  rate === null
                    ? "—"
                    : (
                        rate >= 0
                          ? "+"
                          : ""
                      ) +
                      rate.toFixed(2)
                }

                ${unit}/dag

              </div>

              <div
                class="mm-analysis-small"
              >

                Senaste
                ${
                  Math.min(
                    3,
                    points.length
                  )
                }
                mätpunkter

              </div>

            </div>

          `;

        }
      )
      .join("");


  area.innerHTML = `

    <h2 class="timelineTitle">
      📈 Avancerad tillväxtanalys
    </h2>

    <div class="card">

      <div
        class="mm-analysis"
      >

        ${cards}

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Dokumentationshistorik
   --------------------------------------------------------- */

async function showHistory() {

  const p =
    await one(
      PS,
      current
    );


  const im =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );


  const area =
    document.getElementById(
      "statsArea"
    );


  const rows =
    im
      .map(
        (x, i) => {

          const m =
            x.measurements ||
            {};


          const prev =
            im[
              i + 1
            ]?.measurements ||
            null;


          const delta =
            key => {

              if (
                !prev ||
                !Number.isFinite(
                  Number(
                    prev[key]
                  )
                ) ||
                !Number.isFinite(
                  Number(
                    m[key]
                  )
                )
              ) {

                return null;

              }


              return Number(
                m[key]
              ) -
              Number(
                prev[key]
              );

            };


          const d =
            ageDays(
              p.originDate,
              new Date(
                x.createdAt
              )
            );


          const value =
            v =>
              Number.isFinite(
                Number(v)
              )
                ? v
                : "—";


          const deltaText =
            v =>
              v === null
                ? ""
                : (
                    v >= 0
                      ? " +"
                      : " "
                  ) +
                  v;


          return `

            <tr>

              <td>
                ${dt(
                  x.createdAt
                ).d}

                <small>
                  Dag ${d}
                </small>
              </td>

              <td>
                ${value(
                  m.height
                )}
                ${deltaText(
                  delta("height")
                )}
              </td>

              <td>
                ${value(
                  m.leaves
                )}
                ${deltaText(
                  delta("leaves")
                )}
              </td>

              <td>
                ${value(
                  m.roots
                )}
                ${deltaText(
                  delta("roots")
                )}
              </td>

              <td>
                ${value(
                  m.longestRoot
                )}
                ${deltaText(
                  delta("longestRoot")
                )}
              </td>

            </tr>

          `;

        }
      )
      .join("");


  area.innerHTML = `

    <h2 class="timelineTitle">
      📜 Dokumentationshistorik —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>

    <div class="card">

      <div
        class="mm-history-wrap"
      >

        <table
          class="mm-history"
        >

          <thead>

            <tr>

              <th>
                Dokumentation
              </th>

              <th>
                Höjd
              </th>

              <th>
                Blad
              </th>

              <th>
                Rötter
              </th>

              <th>
                Längsta rot
              </th>

            </tr>

          </thead>

          <tbody>

            ${
              rows ||
              `
                <tr>
                  <td colspan="5">
                    Ingen mätdata ännu.
                  </td>
                </tr>
              `
            }

          </tbody>

        </table>

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Livshistoria
   --------------------------------------------------------- */

async function showLifeHistory() {

  const p =
    await one(
      PS,
      current
    );


  const im =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const first =
    im[0];

  const latest =
    im[im.length - 1];


  const milestones =
    p.milestones ||
    {};


  const fmt =
    value =>

      value

        ? new Date(
            value
          ).toLocaleDateString(
            "sv-SE",
            {
              year:
                "numeric",

              month:
                "long",

              day:
                "numeric"

            }
          )

        : "Inte registrerat";


  const findDate =
    test => {

      const x =
        im.find(
          test
        );

      return x
        ? x.createdAt
        : null;

    };


  const firstRoot =
    milestones.firstRoot ||
    findDate(
      i =>
        Number(
          i.measurements?.roots ||
          0
        ) > 0
    );


  const firstLeaf =
    milestones.firstLeaf ||
    findDate(
      i =>
        Number(
          i.measurements?.leaves ||
          0
        ) > 0
    );


  const planted =
    milestones.plantedDate;


  const rows = [

    [
      "🌱 Ursprung",
      p.originDate
    ],

    [
      "📸 Första dokumentation",
      first?.createdAt
    ],

    [
      "🌱 Första rot dokumenterad",
      firstRoot
    ],

    [
      "🍃 Första blad dokumenterat",
      firstLeaf
    ],

    [
      "🪴 Planterad",
      planted
    ],

    [
      "📸 Senaste dokumentation",
      latest?.createdAt
    ]

  ];


  const area =
    document.getElementById(
      "statsArea"
    );


  area.innerHTML = `

    <h2 class="timelineTitle">
      🌱 Livshistoria
    </h2>

    <div class="card">

      <h3
        style="
          margin-top:0
        "
      >
        ${esc(
          p.name
        )}
      </h3>

      ${rows
        .map(
          r => `

            <div
              class="infoRow"
            >

              <span>
                ${r[0]}
              </span>

              <b>
                ${fmt(
                  r[1]
                )}
              </b>

            </div>

          `
        )
        .join("")}

    </div>


    <div class="card">

      <h3
        style="
          margin-top:0
        "
      >
        ✏️ Milstolpar
      </h3>

      <div
        class="field"
      >

        <label>
          🪴 Planterad datum
        </label>

        <input
          id="milPlanted"
          type="date"
          value="${
            planted
              ? String(
                  planted
                ).slice(
                  0,
                  10
                )
              : ""
          }"
        >

      </div>

      <button
        class="save"
        onclick="
          saveMilestones()
        "
      >
        💾 Spara milstolpe
      </button>

    </div>


    <div class="card">

      <h3
        style="
          margin-top:0
        "
      >
        📜 Tidslinje
      </h3>

      ${
        im.length

          ? im
              .map(
                (
                  x,
                  i
                ) => `

                  <div
                    class="infoRow"
                  >

                    <span>
                      📸
                      ${i + 1}.
                      ${
                        dt(
                          x.createdAt
                        ).d
                      }
                    </span>

                    <b>
                      Dag
                      ${
                        ageDays(
                          p.originDate,
                          new Date(
                            x.createdAt
                          )
                        )
                      }
                    </b>

                  </div>

                `
              )
              .join("")

          : `
              <div
                class="muted"
              >
                Ingen dokumentation ännu.
              </div>
            `
      }

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Spara livshistoria-milstolpe
   --------------------------------------------------------- */

async function saveMilestones() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  p.milestones =
    p.milestones ||
    {};


  p.milestones.plantedDate =
    document.getElementById(
      "milPlanted"
    )?.value ||
    null;


  await put(
    PS,
    p
  );


  await renderDetail();

  await renderHome();

}


/* ---------------------------------------------------------
   Bladstatistik
   --------------------------------------------------------- */

async function showLeafStats() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const vals =
    ims
      .map(
        im => ({

          im,

          d:
            new Date(
              im.createdAt
            ),

          v:
            Number(
              (
                im.measurements ||
                {}
              ).leaves
            )

        })
      )
      .filter(
        x =>
          Number.isFinite(
            x.v
          )
      );


  const area =
    document.getElementById(
      "statsArea"
    );


  if (!vals.length) {

    area.innerHTML = `

      <div class="card">

        <h2 class="timelineTitle">
          🍃 Bladstatistik
        </h2>

        <div
          class="mm-growth-empty"
        >
          Ingen bladmätning ännu.
        </div>

      </div>

    `;

    return;

  }


  const first =
    vals[0].v;


  const last =
    vals.at(-1).v;


  const delta =
    last -
    first;


  const events = [];


  for (
    let i = 1;
    i < vals.length;
    i++
  ) {

    const diff =
      vals[i].v -
      vals[i - 1].v;


    if (
      diff > 0
    ) {

      events.push({

        n:
          diff,

        d:
          Math.round(
            (
              vals[i].d -
              vals[i - 1].d
            ) /
            86400000
          ),

        date:
          vals[i].d

      });

    }

  }


  const avg =
    events.length

      ? events.reduce(
          (
            a,
            e
          ) =>
            a + e.d,
          0
        ) /
        events.length

      : null;


  area.innerHTML = `

    <h2 class="timelineTitle">
      🍃 Bladstatistik —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>

    <div class="card">

      <div
        class="mm-leaf-stats"
      >

        <div
          class="mm-leaf-card"
        >

          <div
            class="mm-leaf-sub"
          >
            Första mätning
          </div>

          <div
            class="mm-leaf-big"
          >
            ${first} 🍃
          </div>

        </div>


        <div
          class="mm-leaf-card"
        >

          <div
            class="mm-leaf-sub"
          >
            Senaste mätning
          </div>

          <div
            class="mm-leaf-big"
          >
            ${last} 🍃
          </div>

        </div>


        <div
          class="mm-leaf-card"
        >

          <div
            class="mm-leaf-sub"
          >
            Förändring
          </div>

          <div
            class="mm-leaf-big"
          >
            ${
              delta >= 0
                ? "+"
                : ""
            }${delta}
          </div>

        </div>


        <div
          class="mm-leaf-card"
        >

          <div
            class="mm-leaf-sub"
          >
            Snitt mellan ökningar
          </div>

          <div
            class="mm-leaf-big"
          >
            ${
              avg === null
                ? "—"
                : avg.toFixed(1) +
                  " dagar"
            }
          </div>

        </div>

      </div>


      <div
        class="mm-leaf-events"
      >

        ${
          events.length

            ? events
                .map(
                  e => `

                    <div
                      class="mm-leaf-event"
                    >
                      🍃 +${e.n}
                      blad ·
                      ${e.d}
                      dagar efter
                      föregående
                      ökning ·
                      ${e.date.toLocaleDateString(
                        "sv-SE"
                      )}
                    </div>

                  `
                )
                .join("")

            : `
                <div
                  class="mm-growth-empty"
                >
                  Ingen tydlig bladökning
                  mellan mätpunkterna ännu.
                </div>
              `
        }

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Rotstatistik
   --------------------------------------------------------- */

async function showRootStats() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const vals =
    ims.map(
      im => ({

        im,

        d:
          new Date(
            im.createdAt
          ),

        roots:
          Number(
            (
              im.measurements ||
              {}
            ).roots
          ),

        longest:
          Number(
            (
              im.measurements ||
              {}
            ).longestRoot
          )

      })
    );


  const rootVals =
    vals.filter(
      x =>
        Number.isFinite(
          x.roots
        )
    );


  const longVals =
    vals.filter(
      x =>
        Number.isFinite(
          x.longest
        )
    );


  const area =
    document.getElementById(
      "statsArea"
    );


  if (
    !rootVals.length &&
    !longVals.length
  ) {

    area.innerHTML = `

      <div class="card">

        <h2 class="timelineTitle">
          🌱 Rotstatistik
        </h2>

        <div
          class="mm-growth-empty"
        >
          Ingen rotmätning ännu.
        </div>

      </div>

    `;

    return;

  }


  const first =
    rootVals[0]?.roots;


  const last =
    rootVals.at(-1)?.roots;


  const delta =
    (
      first !== undefined &&
      last !== undefined
    )
      ? last - first
      : null;


  const lf =
    longVals[0]?.longest;


  const ll =
    longVals.at(-1)?.longest;


  const ld =
    (
      lf !== undefined &&
      ll !== undefined
    )
      ? ll - lf
      : null;


  const events = [];


  for (
    let i = 1;
    i < rootVals.length;
    i++
  ) {

    const diff =
      rootVals[i].roots -
      rootVals[i - 1].roots;


    if (
      diff > 0
    ) {

      events.push({

        n:
          diff,

        d:
          Math.round(
            (
              rootVals[i].d -
              rootVals[i - 1].d
            ) /
            86400000
          ),

        date:
          rootVals[i].d

      });

    }

  }


  const avg =
    events.length

      ? events.reduce(
          (
            a,
            e
          ) =>
            a + e.d,
          0
        ) /
        events.length

      : null;


  area.innerHTML = `

    <h2 class="timelineTitle">
      🌱 Rotstatistik —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>

    <div class="card">

      <div
        class="mm-root-stats"
      >

        <div
          class="mm-root-card"
        >

          <div
            class="mm-root-sub"
          >
            Första antal
          </div>

          <div
            class="mm-root-big"
          >
            ${
              first ??
              "—"
            }
          </div>

        </div>


        <div
          class="mm-root-card"
        >

          <div
            class="mm-root-sub"
          >
            Senaste antal
          </div>

          <div
            class="mm-root-big"
          >
            ${
              last ??
              "—"
            }
          </div>

        </div>


        <div
          class="mm-root-card"
        >

          <div
            class="mm-root-sub"
          >
            Förändring
          </div>

          <div
            class="mm-root-big"
          >
            ${
              delta === null
                ? "—"
                : (
                    delta >= 0
                      ? "+"
                      : ""
                  ) +
                  delta
            }
          </div>

        </div>


        <div
          class="mm-root-card"
        >

          <div
            class="mm-root-sub"
          >
            Längsta rot
          </div>

          <div
            class="mm-root-big"
          >
            ${
              ll === undefined
                ? "—"
                : ll +
                  " cm"
            }
          </div>

          <div
            class="mm-root-sub"
          >
            ${
              ld === null
                ? ""
                : (
                    ld >= 0
                      ? "+"
                      : ""
                  ) +
                  ld +
                  " cm"
            }
          </div>

        </div>

      </div>


      <div
        class="mm-root-events"
      >

        ${
          events.length

            ? events
                .map(
                  e => `

                    <div
                      class="mm-root-event"
                    >
                      🌱 +${e.n}
                      rötter ·
                      ${e.d}
                      dagar efter
                      föregående
                      ökning ·
                      ${e.date.toLocaleDateString(
                        "sv-SE"
                      )}
                    </div>

                  `
                )
                .join("")

            : `
                <div
                  class="mm-growth-empty"
                >
                  Ingen tydlig rotökning
                  mellan mätpunkterna ännu.
                </div>
              `
        }

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Variegering
   --------------------------------------------------------- */

async function showVariegation() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const vals =
    ims
      .map(
        im => ({

          im,

          d:
            new Date(
              im.createdAt
            ),

          v:
            Number(
              (
                im.measurements ||
                {}
              ).variegation
            )

        })
      )
      .filter(
        x =>
          Number.isFinite(
            x.v
          )
      );


  const area =
    document.getElementById(
      "statsArea"
    );


  if (!vals.length) {

    area.innerHTML = `

      <div class="card">

        <h2 class="timelineTitle">
          🤍 Variegering
        </h2>

        <div
          class="mm-growth-empty"
        >
          Ingen variegeringsmätning ännu.
        </div>

      </div>

    `;

    return;

  }


  const first =
    vals[0].v;


  const latest =
    vals.at(-1).v;


  const max =
    Math.max(
      ...vals.map(
        x => x.v
      )
    );


  const delta =
    latest -
    first;


  area.innerHTML = `

    <h2 class="timelineTitle">
      🤍 Variegering —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>

    <div class="card">

      <div
        class="mm-var"
      >

        <div
          class="mm-var-card"
        >

          <div
            class="mm-var-sub"
          >
            Första
          </div>

          <div
            class="mm-var-big"
          >
            ${first}%
          </div>

        </div>


        <div
          class="mm-var-card"
        >

          <div
            class="mm-var-sub"
          >
            Senaste
          </div>

          <div
            class="mm-var-big"
          >
            ${latest}%
          </div>

        </div>


        <div
          class="mm-var-card"
        >

          <div
            class="mm-var-sub"
          >
            Högsta
          </div>

          <div
            class="mm-var-big"
          >
            ${max}%
          </div>

        </div>


        <div
          class="mm-var-card"
        >

          <div
            class="mm-var-sub"
          >
            Förändring
          </div>

          <div
            class="mm-var-big"
          >
            ${
              delta >= 0
                ? "+"
                : ""
            }${delta}%
          </div>

        </div>

      </div>


      <div
        style="
          margin-top:10px
        "
      >

        ${
          vals
            .map(
              x => `

                <div
                  class="infoRow"
                >

                  <span>
                    🤍
                    ${x.d.toLocaleDateString(
                      "sv-SE"
                    )}
                  </span>

                  <b>
                    ${x.v}%
                  </b>

                </div>

              `
            )
            .join("")
        }

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Tillväxtintervall
   --------------------------------------------------------- */

async function showGrowthIntervals() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const area =
    document.getElementById(
      "statsArea"
    );


  const calc =
    (
      key,
      label
    ) => {

      const arr =
        ims
          .map(
            im => ({

              d:
                new Date(
                  im.createdAt
                ),

              v:
                Number(
                  (
                    im.measurements ||
                    {}
                  )[key]
                )

            })
          )
          .filter(
            x =>
              Number.isFinite(
                x.v
              )
          );


      const gaps = [];


      for (
        let i = 1;
        i < arr.length;
        i++
      ) {

        if (
          arr[i].v >
          arr[i - 1].v
        ) {

          gaps.push(
            Math.max(
              1,
              Math.round(
                (
                  arr[i].d -
                  arr[i - 1].d
                ) /
                86400000
              )
            )
          );

        }

      }


      if (!gaps.length) {

        return `

          <div
            class="mm-int-card"
          >

            <div
              class="mm-int-sub"
            >
              ${label}
            </div>

            <div
              class="mm-int-big"
            >
              —
            </div>

            <div
              class="mm-int-sub"
            >
              Inte tillräckligt
              med ökningar ännu
            </div>

          </div>

        `;

      }


      const avg =
        gaps.reduce(
          (a, b) =>
            a + b,
          0
        ) /
        gaps.length;


      return `

        <div
          class="mm-int-card"
        >

          <div
            class="mm-int-sub"
          >
            ${label}
          </div>

          <div
            class="mm-int-big"
          >
            ${avg.toFixed(1)}
            dagar
          </div>

          <div
            class="mm-int-sub"
          >
            Snabbast
            ${Math.min(
              ...gaps
            )}
            dagar ·

            Längst
            ${Math.max(
              ...gaps
            )}
            dagar ·

            ${gaps.length}
            intervall
          </div>

        </div>

      `;

    };


  area.innerHTML = `

    <h2 class="timelineTitle">
      ⏱️ Tillväxtintervall —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>

    <div class="card">

      <div
        class="mm-intervals"
      >

        ${calc(
          "height",
          "📏 Höjd"
        )}

        ${calc(
          "leaves",
          "🍃 Blad"
        )}

        ${calc(
          "roots",
          "🌱 Rötter"
        )}

        ${calc(
          "longestRoot",
          "📐 Längsta rot"
        )}

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Rekord
   --------------------------------------------------------- */

async function showRecords() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const vals =
    ims.map(
      im => ({

        im,

        d:
          new Date(
            im.createdAt
          ),

        m:
          im.measurements ||
          {}

      })
    );


  const records = [];


  const maxOf =
    (
      key,
      label,
      icon,
      unit
    ) => {

      const a =
        vals
          .map(
            x => ({

              x,

              v:
                Number(
                  x.m[key]
                )

            })
          )
          .filter(
            z =>
              Number.isFinite(
                z.v
              )
          );


      if (!a.length) {
        return;
      }


      const z =
        a.reduce(
          (
            q,
            r
          ) =>
            r.v >
            q.v
              ? r
              : q
        );


      records.push({

        icon,

        label,

        value:
          z.v +
          " " +
          unit,

        sub:
          z.x.d.toLocaleDateString(
            "sv-SE"
          ) +
          " · Dag " +
          ageDays(
            p.originDate,
            z.x.d
          )

      });

    };


  maxOf(
    "height",
    "Högsta dokumenterade höjd",
    "📏",
    "cm"
  );


  maxOf(
    "roots",
    "Flest rötter",
    "🌱",
    "rötter"
  );


  maxOf(
    "longestRoot",
    "Längsta rot",
    "📐",
    "cm"
  );


  maxOf(
    "leaves",
    "Flest blad",
    "🍃",
    "blad"
  );


  maxOf(
    "variegation",
    "Högsta registrerade variegering",
    "🤍",
    "%"
  );


  const growth =
    (
      key,
      label,
      icon,
      unit
    ) => {

      let best =
        null;


      for (
        let i = 1;
        i < vals.length;
        i++
      ) {

        const a =
          Number(
            vals[
              i - 1
            ].m[key]
          );


        const b =
          Number(
            vals[i].m[key]
          );


        if (
          Number.isFinite(a) &&
          Number.isFinite(b) &&
          b > a
        ) {

          const days =
            Math.max(
              (
                vals[i].d -
                vals[
                  i - 1
                ].d
              ) /
              86400000,
              1
            );


          const rate =
            (
              b -
              a
            ) /
            days;


          if (
            !best ||
            rate >
              best.rate
          ) {

            best = {

              rate,

              delta:
                b - a,

              days,

              date:
                vals[i].d

            };

          }

        }

      }


      if (best) {

        records.push({

          icon,

          label,

          value:
            "+" +
            best.delta.toFixed(
              2
            ) +
            " " +
            unit,

          sub:
            "på " +
            best.days.toFixed(
              1
            ) +
            " dagar · " +
            best.date.toLocaleDateString(
              "sv-SE"
            )

        });

      }

    };


  growth(
    "height",
    "Snabbaste höjdökning",
    "🚀",
    "cm"
  );


  growth(
    "roots",
    "Snabbaste rotökning",
    "⚡",
    "rötter"
  );


  growth(
    "leaves",
    "Snabbaste bladökning",
    "🍃",
    "blad"
  );


  const area =
    document.getElementById(
      "statsArea"
    );


  area.innerHTML = `

    <h2 class="timelineTitle">
      🏆 Rekord —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>

    <div class="card">

      <div
        class="mm-records"
      >

        ${
          records.length

            ? records
                .map(
                  r => `

                    <div
                      class="mm-record"
                    >

                      <div
                        class="mm-record-icon"
                      >
                        ${r.icon}
                      </div>

                      <div>

                        <div
                          class="mm-record-main"
                        >
                          ${r.label}
                        </div>

                        <div
                          class="mm-record-sub"
                        >
                          ${r.sub}
                        </div>

                      </div>

                      <div
                        class="mm-record-value"
                      >
                        ${r.value}
                      </div>

                    </div>

                  `
                )
                .join("")

            : `
                <div
                  class="mm-growth-empty"
                >
                  Ingen tillräcklig
                  mätdata ännu.
                </div>
              `
        }

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Tillväxtprognos
   --------------------------------------------------------- */

async function showForecast() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const area =
    document.getElementById(
      "statsArea"
    );


  const calc =
    (
      key,
      label,
      unit
    ) => {

      const a =
        ims
          .map(
            im => ({

              d:
                new Date(
                  im.createdAt
                ),

              v:
                Number(
                  (
                    im.measurements ||
                    {}
                  )[key]
                )

            })
          )
          .filter(
            x =>
              Number.isFinite(
                x.v
              )
          );


      if (
        a.length < 2
      ) {

        return `

          <div
            class="mm-forecast-card"
          >

            <div
              class="mm-f-big"
            >
              ${label}
            </div>

            <div
              class="mm-f-sub"
            >
              För lite data
              för prognos
            </div>

          </div>

        `;

      }


      const x =
        a[0];


      const y =
        a.at(-1);


      const days =
        Math.max(
          (
            y.d -
            x.d
          ) /
          86400000,
          1
        );


      const rate =
        (
          y.v -
          x.v
        ) /
        days;


      const days30 =
        y.v +
        rate *
        30;


      return `

        <div
          class="mm-forecast-card"
        >

          <div
            class="mm-f-big"
          >
            ${label}
          </div>

          <div
            class="mm-f-sub"
          >
            Senaste:
            ${y.v}
            ${unit}
          </div>

          <div
            class="mm-f-big"
          >
            ≈
            ${days30.toFixed(1)}
            ${unit}
          </div>

          <div
            class="mm-f-sub"
          >
            uppskattat om
            30 dagar
          </div>

        </div>

      `;

    };


  area.innerHTML = `

    <h2 class="timelineTitle">
      🔮 Tillväxtprognos —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>

    <div class="card">

      <div
        class="mm-forecast"
      >

        ${calc(
          "height",
          "📏 Höjd",
          "cm"
        )}

        ${calc(
          "roots",
          "🌱 Rötter",
          "rötter"
        )}

        ${calc(
          "longestRoot",
          "📐 Längsta rot",
          "cm"
        )}

        ${calc(
          "leaves",
          "🍃 Blad",
          "blad"
        )}

      </div>


      <div
        class="mm-f-note"
      >
        ⚠️ Prognoserna är
        matematiska uppskattningar
        baserade på första och
        senaste dokumenterade
        mätning. De är inte en
        garanti för faktisk
        framtida tillväxt.
      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Sammanfattningsrapport
   --------------------------------------------------------- */

async function showSummaryReport() {

  const p =
    await one(
      PS,
      current
    );


  if (!p) return;


  const ims =
    (
      await imgs(
        current
      )
    ).sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );


  const latest =
    ims.at(-1)
      ?.measurements ||
    {};


  const first =
    ims[0]
      ?.measurements ||
    {};


  const delta =
    key => {

      if (
        !Number.isFinite(
          Number(
            latest[key]
          )
        ) ||
        !Number.isFinite(
          Number(
            first[key]
          )
        )
      ) {

        return null;

      }


      return Number(
        latest[key]
      ) -
      Number(
        first[key]
      );

    };


  const fmtDelta =
    value => {

      if (
        value ===
        null
      ) {

        return "";

      }


      return (
        value >= 0
          ? "+"
          : ""
      ) +
      value;

    };


  const area =
    document.getElementById(
      "statsArea"
    );


  area.innerHTML = `

    <h2 class="timelineTitle">
      📋 Sammanfattningsrapport —
      ${esc(
        p.name ||
        "Planta"
      )}
    </h2>


    <div class="card">

      <div
        class="mm-report"
      >

        <div
          class="mm-report-card"
        >

          <div
            class="mm-report-label"
          >
            🌱 Planta
          </div>

          <div
            class="mm-report-big"
          >
            ${esc(
              p.name ||
              "Namnlös planta"
            )}
          </div>

          <div
            class="mm-report-label"
          >

            Start:
            ${
              p.originDate

                ? new Date(
                    p.originDate
                  ).toLocaleDateString(
                    "sv-SE"
                  )

                : "—"
            }

            ·
            ${ims.length}
            fotodokumentationer

          </div>

        </div>


        <div
          class="mm-report-grid"
        >

          <div
            class="mm-report-card"
          >

            <div
              class="mm-report-label"
            >
              📏 Höjd
            </div>

            <div
              class="mm-report-big"
            >
              ${
                Number.isFinite(
                  Number(
                    latest.height
                  )
                )

                  ? latest.height +
                    " cm"

                  : "—"
              }
            </div>

            <div
              class="mm-report-label"
            >
              ${
                delta(
                  "height"
                ) === null

                  ? ""

                  : fmtDelta(
                      delta(
                        "height"
                      )
                    ) +
                    " cm sedan första"
              }
            </div>

          </div>


          <div
            class="mm-report-card"
          >

            <div
              class="mm-report-label"
            >
              🍃 Blad
            </div>

            <div
              class="mm-report-big"
            >
              ${
                Number.isFinite(
                  Number(
                    latest.leaves
                  )
                )

                  ? latest.leaves

                  : "—"
              }
            </div>

            <div
              class="mm-report-label"
            >
              ${
                delta(
                  "leaves"
                ) === null

                  ? ""

                  : fmtDelta(
                      delta(
                        "leaves"
                      )
                    ) +
                    " sedan första"
              }
            </div>

          </div>


          <div
            class="mm-report-card"
          >

            <div
              class="mm-report-label"
            >
              🌱 Rötter
            </div>

            <div
              class="mm-report-big"
            >
              ${
                Number.isFinite(
                  Number(
                    latest.roots
                  )
                )

                  ? latest.roots

                  : "—"
              }
            </div>

            <div
              class="mm-report-label"
            >
              ${
                delta(
                  "roots"
                ) === null

                  ? ""

                  : fmtDelta(
                      delta(
                        "roots"
                      )
                    ) +
                    " sedan första"
              }
            </div>

          </div>


          <div
            class="mm-report-card"
          >

            <div
              class="mm-report-label"
            >
              📐 Längsta rot
            </div>

            <div
              class="mm-report-big"
            >
              ${
                Number.isFinite(
                  Number(
                    latest.longestRoot
                  )
                )

                  ? latest.longestRoot +
                    " cm"

                  : "—"
              }
            </div>

            <div
              class="mm-report-label"
            >
              ${
                delta(
                  "longestRoot"
                ) === null

                  ? ""

                  : fmtDelta(
                      delta(
                        "longestRoot"
                      )
                    ) +
                    " cm sedan första"
              }
            </div>

          </div>


          <div
            class="mm-report-card"
          >

            <div
              class="mm-report-label"
            >
              🤍 Variegering
            </div>

            <div
              class="mm-report-big"
            >
              ${
                Number.isFinite(
                  Number(
                    latest.variegation
                  )
                )

                  ? latest.variegation +
                    "%"

                  : "—"
              }
            </div>

          </div>


          <div
            class="mm-report-card"
          >

            <div
              class="mm-report-label"
            >
              📸 Senaste dokumentation
            </div>

            <div
              class="mm-report-big"
            >
              ${
                ims.length

                  ? new Date(
                      ims.at(-1)
                        .createdAt
                    ).toLocaleDateString(
                      "sv-SE"
                    )

                  : "—"
              }
            </div>

          </div>

        </div>


        <div
          class="mm-report-card"
        >

          <div
            class="mm-report-label"
          >
            📊 Datakvalitet
          </div>

          <div
            class="mm-report-big"
          >
            ${
              ims.length >= 5
                ? "Bra"
                : "Under uppbyggnad"
            }
          </div>

          <div
            class="mm-report-label"
          >
            Prognoser och intervall
            blir mer tillförlitliga
            när fler mätpunkter
            registreras.
          </div>

        </div>


        <div
          class="mm-report-actions"
        >

          <button
            onclick="
              showGrowthAnalysis()
            "
          >
            📈 Analys
          </button>

          <button
            onclick="
              showGrowthChart()
            "
          >
            📊 Diagram
          </button>

          <button
            onclick="
              showRecords()
            "
          >
            🏆 Rekord
          </button>

          <button
            onclick="
              showForecast()
            "
          >
            🔮 Prognos
          </button>

        </div>

      </div>

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Experimentlogg
   --------------------------------------------------------- */

async function getEnvLogs() {

  return await all(
    "envLogs"
  );

}


async function showExperimentLog() {

  const logs =
    (
      await getEnvLogs()
    ).sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );


  const area =
    document.getElementById(
      "statsArea"
    );


  area.innerHTML = `

    <h2 class="timelineTitle">
      🧪 Experimentlogg
    </h2>


    <div class="card">

      <div
        class="mm-env-form"
      >

        <input
          id="envDate"
          type="datetime-local"
          value="${
            new Date()
              .toISOString()
              .slice(
                0,
                16
              )
          }"
        >


        <div
          class="mm-env"
        >

          <div
            class="mm-env-card"
          >

            <div
              class="mm-env-label"
            >
              🌡️ Temperatur °C
            </div>

            <input
              id="envTemp"
              type="number"
              step="0.1"
              placeholder="22"
            >

          </div>


          <div
            class="mm-env-card"
          >

            <div
              class="mm-env-label"
            >
              💦 Luftfuktighet %
            </div>

            <input
              id="envHum"
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="60"
            >

          </div>


          <div
            class="mm-env-card"
          >

            <div
              class="mm-env-label"
            >
              💡 Ljus timmar/dag
            </div>

            <input
              id="envLight"
              type="number"
              min="0"
              max="24"
              step="0.1"
              placeholder="12"
            >

          </div>


          <div
            class="mm-env-card"
          >

            <div
              class="mm-env-label"
            >
              💧 Vattning
            </div>

            <input
              id="envWater"
              type="text"
              placeholder="T.ex. 250 ml"
            >

          </div>

        </div>


        <textarea
          id="envNote"
          placeholder="
            Anteckning om miljö,
            substrat, placering
            eller annan förändring...
          "
        ></textarea>


        <div
          class="mm-env-actions"
        >

          <button
            class="mm-milestone"
            onclick="
              saveExperimentLog()
            "
          >
            💾 Spara logg
          </button>

        </div>

      </div>

    </div>


    <div class="card">

      <h3>
        Senaste loggar
      </h3>

      ${
        logs.length

          ? logs
              .slice(
                -10
              )
              .reverse()
              .map(
                x => `

                  <div
                    class="mm-env-card"
                    style="
                      margin-top:7px
                    "
                  >

                    <b>
                      ${
                        new Date(
                          x.date
                        ).toLocaleString(
                          "sv-SE"
                        )
                      }
                    </b>

                    <div
                      class="mm-env-label"
                    >

                      🌡️
                      ${
                        x.temp ??
                        "—"
                      }
                      °C

                      ·

                      💦
                      ${
                        x.hum ??
                        "—"
                      }%

                      ·

                      💡
                      ${
                        x.light ??
                        "—"
                      } h

                    </div>

                    ${
                      x.water

                        ? `
                          <div>
                            💧
                            ${esc(
                              x.water
                            )}
                          </div>
                        `

                        : ""
                    }

                    ${
                      x.note

                        ? `
                          <div
                            class="muted"
                          >
                            ${esc(
                              x.note
                            )}
                          </div>
                        `

                        : ""
                    }

                  </div>

                `
              )
              .join("")

          : `
              <div
                class="muted"
              >
                Ingen experimentlogg
                ännu.
              </div>
            `
      }

    </div>

  `;


  area.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"

  });

}


/* ---------------------------------------------------------
   Spara experimentlogg
   --------------------------------------------------------- */

async function saveExperimentLog() {

  const row = {

    id:
      crypto.randomUUID(),

    date:
      document.getElementById(
        "envDate"
      )?.value ||
      new Date().toISOString(),

    temp:
      Number(
        document.getElementById(
          "envTemp"
        )?.value
      ),

    hum:
      Number(
        document.getElementById(
          "envHum"
        )?.value
      ),

    light:
      Number(
        document.getElementById(
          "envLight"
        )?.value
      ),

    water:
      document.getElementById(
        "envWater"
      )?.value ||
      "",

    note:
      document.getElementById(
        "envNote"
      )?.value ||
      ""

  };


  if (
    !Number.isFinite(
      row.temp
    )
  ) {

    delete row.temp;

  }


  if (
    !Number.isFinite(
      row.hum
    )
  ) {

    delete row.hum;

  }


  if (
    !Number.isFinite(
      row.light
    )
  ) {

    delete row.light;

  }


  await put(
    "envLogs",
    row
  );


  await showExperimentLog();

}


/* ---------------------------------------------------------
   Gör funktionerna globala
   --------------------------------------------------------- */

window.showGrowthChart =
  showGrowthChart;

window.showGrowthAnalysis =
  showGrowthAnalysis;

window.showHistory =
  showHistory;

window.showLifeHistory =
  showLifeHistory;

window.saveMilestones =
  saveMilestones;

window.showLeafStats =
  showLeafStats;

window.showRootStats =
  showRootStats;

window.showVariegation =
  showVariegation;

window.showGrowthIntervals =
  showGrowthIntervals;

window.showRecords =
  showRecords;

window.showForecast =
  showForecast;

window.showSummaryReport =
  showSummaryReport;

window.getEnvLogs =
  getEnvLogs;

window.showExperimentLog =
  showExperimentLog;

window.saveExperimentLog =
  saveExperimentLog;