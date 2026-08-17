(() => {
  const data = window.VOYAGE;
  if (!data) return;

  const coverImage = document.getElementById("cover-image");
  const summary = document.getElementById("sommaire");
  const grid = document.getElementById("chapter-grid");
  const map = document.getElementById("location-map");
  const mapFrame = document.querySelector(".map-frame");
  const mapPanel = document.querySelector(".map-panel");
  const mapHeading = document.querySelector(".map-heading");
  const summaryBottom = document.querySelector(".summary-bottom");
  const timelineDates = document.getElementById("summary-timeline-dates");
  const timelineHighlight = document.getElementById("summary-timeline-highlight");
  const logosLayer = document.getElementById("summary-island-logos");

  const memoryPanel = document.getElementById("summary-memory");
  const memoryTitle = document.getElementById("summary-memory-title");
  const memoryDates = document.getElementById("summary-memory-dates");
  const memoryDetail = document.getElementById("summary-memory-detail");
  const memoryLink = document.getElementById("summary-memory-link");

  coverImage.src = data.meta.hero;
  coverImage.alt = data.meta.heroAlt;

  const defaultMap = data.summary?.defaultMap || "images/cartes/plan_loc.jpg";
  const timelineMarkers = new Map();
  const islandLogos = new Map();
  let memoryTimer = null;
  let fitFrame = null;

  /* Positions validées. Aucun repère pour Aller / Retour. */
  const logoPositions = {
    moorea: 14.5,
    maupiti: 17.5,
    tahaa: 20.5,
    borabora: 23.5,
    tahiti: 25.5
  };

  const logoFiles = {
    moorea: "moorea.png",
    maupiti: "maupiti.png",
    tahaa: "tahaa.png",
    borabora: "borabora.png",
    tahiti: "tahiti.png"
  };

  /*
    Pour les dates de transfert, le clic sélectionne l'étape de destination.
    13 → Moorea, 16 → Maupiti, 19 → Taha’a, 22 → Bora Bora,
    25 → Tahiti et 26 → Retour.
  */
  const dayToChapterId = {
    12: "aller",
    13: "moorea", 14: "moorea", 15: "moorea",
    16: "maupiti", 17: "maupiti", 18: "maupiti",
    19: "tahaa", 20: "tahaa", 21: "tahaa",
    22: "borabora", 23: "borabora", 24: "borabora",
    25: "tahiti",
    26: "retour", 27: "retour"
  };

  const chaptersById = new Map(data.chapters.map((chapter) => [chapter.id, chapter]));
  const cardsById = new Map();

  /* Vignettes */
  data.chapters.forEach((chapter) => {
    const card = document.createElement("a");
    card.className = "chapter-card";
    card.href = chapter.href;
    card.dataset.id = chapter.id;

    card.innerHTML = `
      <img src="${escapeHtml(chapter.image)}" alt="${escapeHtml(chapter.name)}" loading="lazy">
      <span class="chapter-card-content">
        <span class="chapter-name">${escapeHtml(chapter.name)}</span>
        <span class="chapter-dates">${escapeHtml(chapter.dates)}</span>
      </span>
    `;

    /* Le dernier survol reste actif : aucun reset sur mouseleave. */
    card.addEventListener("mouseenter", () => activateChapter(chapter, card));
    card.addEventListener("focus", () => activateChapter(chapter, card));

    grid.appendChild(card);
    cardsById.set(chapter.id, card);
  });

  /* Frise : une seule occurrence de chaque date, du 12 au 27. */
  if (timelineDates) {
    for (let day = 12; day <= 27; day += 1) {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "summary-timeline-date";
      marker.dataset.day = String(day);
      marker.textContent = day;
      marker.setAttribute("aria-label", `Sélectionner l'étape du ${day} juin`);
      marker.addEventListener("click", (event) => {
        event.stopPropagation();
        activateChapterById(dayToChapterId[day]);
      });
      timelineDates.appendChild(marker);
      timelineMarkers.set(day, marker);
    }
  }

  /* Silhouettes flottantes au-dessus de la frise, sans liaison verticale. */
  if (logosLayer) {
    Object.entries(logoPositions).forEach(([islandId, dayPosition]) => {
      const fileName = logoFiles[islandId];
      if (!fileName) return;

      const logo = document.createElement("button");
      logo.type = "button";
      logo.className = "summary-island-logo";
      logo.dataset.island = islandId;
      logo.style.left = `${dayPositionToPercent(dayPosition)}%`;
      logo.setAttribute("aria-label", `Sélectionner ${chaptersById.get(islandId)?.name || islandId}`);
      logo.innerHTML = `
        <img class="island-logo-contour" src="images/iles/contour/${fileName}" alt="" aria-hidden="true">
        <img class="island-logo-full" src="images/iles/plein/${fileName}" alt="" aria-hidden="true">
      `;
      logo.addEventListener("click", (event) => {
        event.stopPropagation();
        activateChapterById(islandId);
      });

      logosLayer.appendChild(logo);
      islandLogos.set(islandId, logo);
    });
  }

  /* Préchargement pour éviter un flash au changement d’état. */
  Object.values(logoFiles).forEach((fileName) => {
    const preload = new Image();
    preload.src = `images/iles/plein/${fileName}`;
  });

  data.chapters.forEach((chapter) => {
    if (!chapter.map) return;
    const preload = new Image();
    preload.src = chapter.map;
  });

  function activateChapterById(chapterId) {
    if (!chapterId) return;
    const chapter = chaptersById.get(chapterId);
    const card = cardsById.get(chapterId);
    if (!chapter || !card) return;
    activateChapter(chapter, card);
  }

  function activateChapter(chapter, card) {
    grid.classList.add("has-active");

    grid.querySelectorAll(".chapter-card").forEach((item) => {
      item.classList.toggle("is-active", item === card);
    });

    updateTimeline(chapter.dates);
    updateIslandLogo(chapter.id);
    updateMap(chapter.map, chapter.name);
    updateMemory(chapter);
  }

  function resetSummary() {
    grid.classList.remove("has-active");

    grid.querySelectorAll(".chapter-card").forEach((item) => {
      item.classList.remove("is-active");
    });

    clearTimeline();
    clearIslandLogos();
    updateMap(defaultMap, "l’archipel de la Société");
    updateMemory(null);
  }

  /* Clic uniquement dans une vraie zone vide du sommaire = retour au repos. */
  summary?.addEventListener("click", (event) => {
    if (event.target.closest(".chapter-card, .map-panel, .summary-note, .summary-timeline")) {
      return;
    }
    resetSummary();
  });

  /* Petit raccourci discret et naturel sur ordinateur. */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") resetSummary();
  });

  function updateTimeline(dateLabel) {
    clearTimeline();

    const range = extractDayRange(dateLabel);
    if (!range) return;

    const [start, end] = range;

    for (let day = start; day <= end; day += 1) {
      timelineMarkers.get(day)?.classList.add("is-active");
    }

    if (!timelineHighlight) return;

    const firstIndex = start - 12;
    const lastIndex = end - 12;
    const leftPercent = ((firstIndex + 0.5) / 16) * 100;
    const widthPercent = ((lastIndex - firstIndex) / 16) * 100;

    timelineHighlight.style.left = `${leftPercent}%`;
    timelineHighlight.style.width = `${Math.max(widthPercent, 0.45)}%`;
    timelineHighlight.classList.add("is-visible");
  }

  function clearTimeline() {
    timelineMarkers.forEach((marker) => marker.classList.remove("is-active"));
    timelineHighlight?.classList.remove("is-visible");
  }

  function updateIslandLogo(islandId) {
    islandLogos.forEach((logo, id) => {
      logo.classList.toggle("is-active", id === islandId);
    });
  }

  function clearIslandLogos() {
    islandLogos.forEach((logo) => logo.classList.remove("is-active"));
  }

  function dayPositionToPercent(dayPosition) {
    return ((dayPosition - 12 + 0.5) / 16) * 100;
  }

  function extractDayRange(value) {
    const numbers = String(value).match(/\d+/g);
    if (!numbers || numbers.length < 2) return null;
    return [Number(numbers[0]), Number(numbers[1])];
  }

  function updateMap(nextMap, chapterName) {
    if (!nextMap || !map) return;

    if (map.getAttribute("src") === nextMap) {
      map.alt = `Carte de localisation — ${chapterName}`;
      return;
    }

    mapFrame?.classList.add("is-changing");

    const preload = new Image();
    preload.onload = () => {
      map.src = nextMap;
      map.alt = `Carte de localisation — ${chapterName}`;
      mapFrame?.classList.remove("is-changing");
    };
    preload.onerror = () => mapFrame?.classList.remove("is-changing");
    preload.src = nextMap;
  }

  function updateMemory(chapter) {
    if (!memoryPanel || !memoryTitle || !memoryDates || !memoryDetail || !memoryLink) return;

    window.clearTimeout(memoryTimer);
    memoryPanel.classList.add("is-changing");

    memoryTimer = window.setTimeout(() => {
      if (!chapter) {
        memoryTitle.textContent = data.summary?.idleTitle || "Notre voyage";
        memoryDates.textContent = "";
        memoryDates.hidden = true;
        memoryDetail.textContent = data.summary?.idleText || "Survole une étape pour retrouver nos souvenirs.";
        memoryLink.textContent = "";
        memoryLink.removeAttribute("href");
        memoryLink.hidden = true;
      } else {
        memoryTitle.textContent = chapter.name;
        memoryDates.textContent = formatDates(chapter.dates);
        memoryDates.hidden = false;
        memoryDetail.textContent = chapter.memory || "";
        memoryLink.textContent = chapter.cta || `Revivre ${chapter.name} →`;
        memoryLink.href = chapter.href;
        memoryLink.hidden = false;
      }

      memoryPanel.classList.remove("is-changing");
    }, 90);
  }

  function formatDates(value) {
    return String(value).replace("—", "→").toUpperCase();
  }

  /*
    La carte est dimensionnée d’abord par la HAUTEUR disponible.
    Son ratio 740/460 est toujours conservé. La fiche prend le reste.
  */
  function fitSummaryMap() {
    if (!summaryBottom || !mapPanel || !mapFrame || !mapHeading) return;

    if (window.matchMedia("(max-width: 1050px)").matches) {
      mapPanel.style.removeProperty("width");
      mapFrame.style.removeProperty("width");
      mapFrame.style.removeProperty("height");
      return;
    }

    const ratio = 740 / 460;
    const bottomStyles = getComputedStyle(summaryBottom);
    const gap = Number.parseFloat(bottomStyles.columnGap) || 32;
    const minNoteWidth = 245;
    const headingHeight = mapHeading.getBoundingClientRect().height + 7;
    const availableHeight = Math.max(120, summaryBottom.clientHeight - headingHeight);
    const widthByHeight = availableHeight * ratio;
    const widthByPage = Math.max(260, summaryBottom.clientWidth - gap - minNoteWidth);
    const mapWidth = Math.floor(Math.min(widthByHeight, widthByPage));
    const mapHeight = Math.floor(mapWidth / ratio);

    mapPanel.style.width = `${mapWidth}px`;
    mapFrame.style.width = `${mapWidth}px`;
    mapFrame.style.height = `${mapHeight}px`;
  }

  function scheduleMapFit() {
    window.cancelAnimationFrame(fitFrame);
    fitFrame = window.requestAnimationFrame(fitSummaryMap);
  }

  if ("ResizeObserver" in window && summaryBottom) {
    new ResizeObserver(scheduleMapFit).observe(summaryBottom);
  }

  window.addEventListener("resize", scheduleMapFit);
  window.addEventListener("load", scheduleMapFit);
  scheduleMapFit();

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
