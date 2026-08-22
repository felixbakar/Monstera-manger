/* =========================================================
   MONSTERA MANAGER
   ui.js
   Bottom sheets, plantverktyg, navigation och kamera-UI
   ========================================================= */

(function () {

  const $ = id =>
    document.getElementById(id);


  /* -------------------------------------------------------
     Lägg till planta – bottom sheet
     ------------------------------------------------------- */

  window.openAddPlantSheet = async function () {

    const sheet =
      $("mmAddPlantSheet");

    if (!sheet) return;


    $("mmAddPlantForm")?.reset();


    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    if ($("mmAddOrigin")) {
      $("mmAddOrigin").value =
        today;
    }


    if ($("mmAddPurchase")) {
      $("mmAddPurchase").value =
        today;
    }


    await MM_prepareAddPlantSheet();


    sheet.style.display =
      "flex";


    requestAnimationFrame(
      () => {
        sheet.classList.add(
          "mm-open"
        );
      }
    );


    document.body.style.overflow =
      "hidden";


    setTimeout(
      () =>
        $("mmAddName")?.focus(),
      280
    );

  };


  window.closeAddPlantSheet =
    function () {

      const sheet =
        $("mmAddPlantSheet");

      if (!sheet) return;


      sheet.classList.remove(
        "mm-open"
      );


      setTimeout(
        () => {

          sheet.style.display =
            "none";

          document.body.style.overflow =
            "";

        },
        220
      );

    };


  /* -------------------------------------------------------
     Kategori i lägg-till-formuläret
     ------------------------------------------------------- */

  window.MM_toggleCustomCategory =
    function () {

      const select =
        $("mmAddCategory");

      const customWrap =
        $("mmCustomCategoryWrap");

      const variantWrap =
        $("mmMonsteraVariantWrap");


      if (customWrap) {

        customWrap.style.display =
          select?.value ===
          "__custom__"
            ? "block"
            : "none";

      }


      if (variantWrap) {

        variantWrap.style.display =
          select?.value ===
          "Monstera"
            ? "block"
            : "none";

      }


      if (
        typeof MM_refreshAutoName ===
        "function"
      ) {

        MM_refreshAutoName();

      }

    };


  /* -------------------------------------------------------
     Sticklingfält
     ------------------------------------------------------- */

  window.MM_toggleMotherPlant =
    function () {

      const checked =
        $("mmAddCutting")
          ?.checked;


      const wrap =
        $("mmMotherWrap");


      if (wrap) {

        wrap.style.display =
          checked
            ? "block"
            : "none";

      }

    };


  /* -------------------------------------------------------
     Plantverktyg – bottom sheet
     ------------------------------------------------------- */

  window.openPlantTools =
    function () {

      const sheet =
        $("mmPlantTools");

      if (!sheet) return;


      sheet.classList.add(
        "open"
      );


      sheet.setAttribute(
        "aria-hidden",
        "false"
      );


      document.body.style.overflow =
        "hidden";

    };


  window.closePlantTools =
    function () {

      const sheet =
        $("mmPlantTools");

      if (!sheet) return;


      sheet.classList.remove(
        "open"
      );


      sheet.setAttribute(
        "aria-hidden",
        "true"
      );


      document.body.style.overflow =
        "";

    };


  /* -------------------------------------------------------
     Guide i kameran
     ------------------------------------------------------- */

  window.toggleGuide =
    function () {

      const guide =
        $("mmGuide");

      if (!guide) return;


      guide.style.display =
        guide.style.display ===
          "none"
          ? "flex"
          : "none";

    };


  /* -------------------------------------------------------
     Kamera
     ------------------------------------------------------- */

  let mmStream =
    null;

  let mmFacing =
    "environment";


  window.openCamera =
    async function () {

      try {

        const camera =
          $("mmCamera");

        const video =
          $("mmVideo");


        if (!camera || !video) {
          return;
        }


        mmStream =
          await navigator.mediaDevices
            .getUserMedia({

              video: {

                facingMode: {
                  ideal:
                    mmFacing
                },

                width: {
                  ideal: 1920
                },

                height: {
                  ideal: 1080
                }

              },

              audio: false

            });


        video.srcObject =
          mmStream;


        camera.classList.add(
          "show"
        );


      } catch (error) {

        console.error(error);


        alert(
          "📷 Kameran kunde inte öppnas. Kontrollera kameratillåtelsen i Safari."
        );

      }

    };


  window.closeCamera =
    function () {

      if (mmStream) {

        mmStream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          );

        mmStream =
          null;

      }


      $("mmCamera")
        ?.classList
        .remove("show");

    };


  /* -------------------------------------------------------
     Byt kamera
     ------------------------------------------------------- */

  window.flipCamera =
    async function () {

      mmFacing =
        mmFacing ===
          "environment"
          ? "user"
          : "environment";


      if (mmStream) {

        mmStream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          );

        mmStream =
          null;

      }


      try {

        const video =
          $("mmVideo");


        mmStream =
          await navigator.mediaDevices
            .getUserMedia({

              video: {

                facingMode:
                  mmFacing,

                width: {
                  ideal: 1920
                },

                height: {
                  ideal: 1080
                }

              },

              audio: false

            });


        video.srcObject =
          mmStream;


      } catch (error) {

        console.error(error);


        alert(
          "📷 Kunde inte byta kamera."
        );

      }

    };


  /* -------------------------------------------------------
     Ta foto från kameran
     ------------------------------------------------------- */

  window.takeCameraPhoto =
    async function () {

      const video =
        $("mmVideo");

      const canvas =
        $("mmCanvas");


      if (
        !video ||
        !canvas ||
        !video.videoWidth
      ) {

        return;

      }


      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;


      const ctx =
        canvas.getContext("2d");


      ctx.drawImage(
        video,
        0,
        0
      );


      const blob =
        await new Promise(
          resolve =>
            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.88
            )
        );


      if (!blob) {
        return;
      }


      closeCamera();


      openEditor(
        blob,
        edited => {

          const file =
            new File(
              [edited],
              "monstera-" +
                Date.now() +
                ".jpg",
              {
                type:
                  "image/jpeg"
              }
            );


          showCameraPreview(
            file
          );

        }
      );


      const p =
        await one(
          PS,
          current
        );


      if (!p) return;


      const images =
        (
          await imgs(current)
        ).sort(
          (a, b) =>
            new Date(
              a.createdAt
            ) -
            new Date(
              b.createdAt
            )
        );


      const previous =
        images[
          images.length - 1
        ];


      const measurements =
        previous?.measurements ||
        {};


      const area =
        $("statsArea");


      if (!area) return;


      area.innerHTML = `

        <h2 class="timelineTitle">
          📸 Kameradokumentation
        </h2>

        <div class="card">

          <img
            src="${URL.createObjectURL(blob)}"
            style="
              width:100%;
              border-radius:16px
            "
          >

          <div class="infoRow">

            <span>🌿 Planta</span>

            <b>
              ${esc(p.name)}
            </b>

          </div>

          <div class="infoRow">

            <span>🎂 Ålder</span>

            <b>
              Dag ${ageDays(
                p.originDate,
                new Date()
              )}
            </b>

          </div>

          <button
            class="save"
            style="
              width:100%;
              margin-top:10px
            "
            onclick="
              saveCameraDoc(
                window.mmCameraFile
              )
            "
          >
            💾 Spara bilden
          </button>

        </div>

      `;


      window.mmCameraFile = {

        file,

        prev:
          measurements

      };


      area.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"

      });

    };


  /* -------------------------------------------------------
     Spara kameradokumentation
     ------------------------------------------------------- */

  window.saveCameraDoc =
    async function (data) {

      if (!data) return;


      const blob =
        await optimizeImage(
          data.file
        );


      const record = {

        plantId:
          current,

        createdAt:
          new Date()
            .toISOString(),

        measurements:
          data.prev || {},

        note:
          "",

        tag:
          "normal",

        blob

      };


      await put(
        IS,
        record
      );


      await renderDetail();
      await renderHome();
      await renderDashboard();


      alert(
        "✅ Kamerabilden är sparad."
      );

    };


  /* -------------------------------------------------------
     Escape stänger sheets
     ------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      closeAddPlantSheet();
      closePlantTools();
      closeCamera();

    }
  );

})();