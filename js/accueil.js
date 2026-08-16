(() => {
  const data = window.VOYAGE;
  if (!data) return;

  const coverImage = document.getElementById("cover-image");
  const grid = document.getElementById("chapter-grid");
  const map = document.getElementById("location-map");
  const timelineDates = document.getElementById("summary-timeline-dates");
  const timelineHighlight = document.getElementById("summary-timeline-highlight");
  const logosLayer = document.getElementById("summary-island-logos");

  coverImage.src = data.meta.hero;
  coverImage.alt = data.meta.heroAlt;

  const timelineMarkers = new Map();
  const islandLogos = new Map();

  /* Positions visuelles validées par rapport à la frise.
     Aller et Retour : aucun logo. */
  const logoPositions = {
    moorea: 14,
    maupiti: 17.5,
    tahaa: 20.5,
    borabora: 23.5,
    tahiti: 25
  };

  /* Les deux versions existent déjà dans le dépôt :
     images/iles/contour/*.png
     images/iles/plein/*.png */
  const logoFiles = {
    moorea: "moorea.png",
    maupiti: "maupiti.png",
    tahaa: "tahaa.png",
    borabora: "borabora.png",
    tahiti: "tahiti.png"
  };

  /* Vignettes */
  data.chapters.forEach((chapter) => {
    const card = document.createElement("a");
    card.className = "chapter-card";
    card.href = chapter.href;
    card.dataset.id = chapter.id;
    card.dataset.map = chapter.map;
    card.dataset.name = chapter.name;
    card.dataset.dates = chapter.dates;

    card.innerHTML = `
      <img src="${escapeHtml(chapter.image)}" alt="${escapeHtml(chapter.name)}" loading="lazy">
      <span class="chapter-card-content">
        <span class="chapter-name">${escapeHtml(chapter.name)}</span>
        <span class="chapter-dates">${escapeHtml(chapter.dates)}</span>
      </span>
    `;

    card.addEventListener("mouseenter", () => activateCard(card));
    card.addEventListener("focus", () => activateCard(card));
    card.addEventListener("mouseleave", resetCards);
    card.addEventListener("blur", resetCards);

    grid.appendChild(card);
  });

  /* Frise : une seule occurrence de chaque date, du 12 au 27. */
  if (timelineDates) {
    for (let day = 12; day <= 27; day += 1) {
      const marker = document.createElement("span");
      marker.className = "summary-timeline-date";
      marker.dataset.day = String(day);
      marker.textContent = day;
      timelineDates.appendChild(marker);
      timelineMarkers.set(day, marker);
    }
  }

  /* Petites silhouettes flottantes AU-DESSUS de la frise.
     Elles ne sont reliées à la ligne par aucun trait. */
  if (logosLayer) {
    Object.entries(logoPositions).forEach(([islandId, dayPosition]) => {
      const fileName = logoFiles[islandId];
      if (!fileName) return;

      const logo = document.createElement("span");
      logo.className = "summary-island-logo";
      logo.dataset.island = islandId;
      logo.style.left = `${dayPositionToPercent(dayPosition)}%`;
      logo.innerHTML = `
        <img class="island-logo-contour" src="images/iles/contour/${fileName}" alt="" aria-hidden="true">
        <img class="island-logo-full" src="images/iles/plein/${fileName}" alt="" aria-hidden="true">
      `;

      logosLayer.appendChild(logo);
      islandLogos.set(islandId, logo);
    });
  }

  /* Préchargement des silhouettes pleines pour éviter un flash au survol. */
  Object.values(logoFiles).forEach((fileName) => {
    const preload = new Image();
    preload.src = `images/iles/plein/${fileName}`;
  });

  function activateCard(card) {
    grid.classList.add("has-hover");

    grid.querySelectorAll(".chapter-card").forEach((item) => {
      item.classList.toggle("is-hovered", item === card);
    });

    updateTimeline(card.dataset.dates);
    updateIslandLogo(card.dataset.id);
    updateMap(card.dataset.map, card.dataset.name);
  }

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
    timelineMarkers.forEach((marker) => {
      marker.classList.remove("is-active");
    });

    if (timelineHighlight) {
      timelineHighlight.classList.remove("is-visible");
    }
  }

  function updateIslandLogo(islandId) {
    islandLogos.forEach((logo, id) => {
      logo.classList.toggle("is-active", id === islandId);
    });
  }

  function clearIslandLogos() {
    islandLogos.forEach((logo) => {
      logo.classList.remove("is-active");
    });
  }

  /* Position d'un jour sur une frise de 16 points.
     Jour 14 = centre exact du point 14.
     17.5 = centre exact entre 17 et 18, etc. */
  function dayPositionToPercent(dayPosition) {
    return ((dayPosition - 12 + 0.5) / 16) * 100;
  }

  function extractDayRange(value) {
    const numbers = String(value).match(/\d+/g);
    if (!numbers || numbers.length < 2) return null;

    return [Number(numbers[0]), Number(numbers[1])];
  }

  function updateMap(nextMap, chapterName) {
    if (!nextMap) return;

    if (map.getAttribute("src") === nextMap) {
      map.alt = `Carte de localisation — ${chapterName}`;
      return;
    }

    map.parentElement.classList.add("is-changing");

    const preload = new Image();

    preload.onload = () => {
      map.src = nextMap;
      map.alt = `Carte de localisation — ${chapterName}`;
      map.parentElement.classList.remove("is-changing");
    };

    preload.onerror = () => {
      map.parentElement.classList.remove("is-changing");
    };

    preload.src = nextMap;
  }

  function resetCards() {
    grid.classList.remove("has-hover");

    grid.querySelectorAll(".chapter-card").forEach((item) => {
      item.classList.remove("is-hovered");
    });

    clearTimeline();
    clearIslandLogos();

    map.src = "images/cartes/plan_loc.jpg";
    map.alt = "Carte de l’archipel de la Société";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
