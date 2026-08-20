/* =========================================================
   NAVIGATION GLOBALE + FRISE COMMUNE
   - Accueil
   - Sommaire
   - 12 au 27 juin cliquables
   - 5 îles cliquables
   - retour en haut sur les pages longues
   ========================================================= */
(() => {
  const FIRST_DAY = 12;
  const LAST_DAY = 27;
  const DAY_COUNT = LAST_DAY - FIRST_DAY + 1;

  const ISLANDS = [
    { id: "moorea",   name: "Moorea",    anchor: 14.5 },
    { id: "maupiti",  name: "Maupiti",   anchor: 17.5 },
    { id: "tahaa",    name: "Taha’a",    anchor: 20.5 },
    { id: "borabora", name: "Bora Bora", anchor: 23.5 },
    { id: "tahiti",   name: "Tahiti",    anchor: 25.5 }
  ];

  const center = day => ((day - FIRST_DAY + 0.5) / DAY_COUNT) * 100;
  const dayHref = day => `jour.html?date=26-06-${String(day).padStart(2, "0")}`;

  function normalizeIsland(value = "") {
    const normalized = String(value)
      .toLowerCase()
      .replaceAll("’", "")
      .replaceAll("'", "")
      .replaceAll(" ", "");

    const found = ISLANDS.find(i =>
      i.id === normalized ||
      i.name.toLowerCase().replaceAll("’", "").replaceAll("'", "").replaceAll(" ", "") === normalized
    );

    return found?.id || "";
  }

  function render(container, options = {}) {
    if (!container) return;

    const activeDay = Number(options.activeDay);
    const start = Number(options.start);
    const end = Number(options.end);
    const hasDay = Number.isFinite(activeDay);
    const hasRange = Number.isFinite(start) && Number.isFinite(end);
    const activeIsland = normalizeIsland(options.activeIsland || options.label || "");

    container.innerHTML = `
      <div class="travel-global-nav">
        <a class="travel-global-link is-home" href="index.html" aria-label="Revenir à l’accueil">
          <span class="travel-global-arrow" aria-hidden="true">←</span>
          <span>Accueil</span>
        </a>
        <span class="travel-global-separator" aria-hidden="true"></span>
        <a class="travel-global-link" href="index.html#sommaire">Sommaire</a>
      </div>

      <div class="travel-timeline">
        <div class="travel-timeline-islands" aria-label="Accès aux étapes du voyage"></div>
        <div class="travel-timeline-dates" aria-label="Accès aux journées">
          <span class="travel-timeline-highlight" aria-hidden="true"></span>
        </div>
      </div>`;

    const islands = container.querySelector(".travel-timeline-islands");

    ISLANDS.forEach(island => {
      const link = document.createElement("a");
      link.className = "travel-timeline-island" + (activeIsland === island.id ? " is-active" : "");
      link.style.left = `${center(island.anchor)}%`;
      link.href = `chapitre.html?etape=${island.id}`;
      link.setAttribute("aria-label", `Voir le chapitre ${island.name}`);
      link.title = `Voir ${island.name}`;

      link.innerHTML = `
        <span class="travel-timeline-island-images">
          <img class="outline" src="images/iles/contour/${island.id}.png" alt="">
          <img class="full" src="images/iles/plein/${island.id}.png" alt="">
        </span>
        <span class="travel-timeline-island-label">${island.name}</span>`;

      islands.appendChild(link);
    });

    const dates = container.querySelector(".travel-timeline-dates");

    for (let day = FIRST_DAY; day <= LAST_DAY; day += 1) {
      const link = document.createElement("a");
      const active = hasDay ? day === activeDay : (hasRange && day >= start && day <= end);

      link.className = "travel-timeline-date" + (active ? " is-active" : "");
      link.href = typeof options.dayHref === "function" ? options.dayHref(day) : dayHref(day);
      link.textContent = day;
      link.setAttribute("aria-label", `Voir le ${day} juin 2026`);
      link.title = `${day} juin 2026`;

      dates.appendChild(link);
    }

    const highlight = container.querySelector(".travel-timeline-highlight");

    if (hasRange && !hasDay) {
      const left = center(start);
      const width = Math.max(center(end) - left, 0.45);

      highlight.style.left = `${left}%`;
      highlight.style.width = `${width}%`;
      highlight.hidden = false;
    } else {
      highlight.hidden = true;
    }

    ensureBackToTop();
  }

  function ensureBackToTop() {
    if (document.querySelector(".travel-back-top")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "travel-back-top";
    button.setAttribute("aria-label", "Revenir en haut de la page");
    button.title = "Revenir en haut";
    button.innerHTML = `<span aria-hidden="true">↑</span>`;

    document.body.appendChild(button);

    const update = () => {
      button.classList.toggle("is-visible", window.scrollY > 650);
    };

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  window.TravelTimeline = { render };
})();
