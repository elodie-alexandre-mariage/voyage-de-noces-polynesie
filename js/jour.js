/* =========================================================
   MOTEUR COMMUN DES PAGES JOURNÉE
   Navigation :
   - Accueil / Sommaire via la frise commune
   - retour au chapitre depuis le haut
   - jour précédent / chapitre / jour suivant en bas
   ========================================================= */
(() => {
  const database = window.JOURNAL_DATA;
  if (!database?.days) return;

  const params = new URLSearchParams(window.location.search);
  const key = params.get("date") || "26-06-12";
  const day = database.days[key] || database.days["26-06-12"];
  const page = document.getElementById("day-page");
  const dayNumber = Number(key.slice(-2));
  document.body.classList.add(`day-${dayNumber}`);
  document.body.classList.add("album-day");

  const DAY_CHAPTER = {
    12: { id: "aller", name: "Arrivée" },
    13: { id: "moorea", name: "Moorea" },
    14: { id: "moorea", name: "Moorea" },
    15: { id: "moorea", name: "Moorea" },
    16: { id: "maupiti", name: "Maupiti" },
    17: { id: "maupiti", name: "Maupiti" },
    18: { id: "maupiti", name: "Maupiti" },
    19: { id: "tahaa", name: "Taha’a" },
    20: { id: "tahaa", name: "Taha’a" },
    21: { id: "tahaa", name: "Taha’a" },
    22: { id: "borabora", name: "Bora Bora" },
    23: { id: "borabora", name: "Bora Bora" },
    24: { id: "borabora", name: "Bora Bora" },
    25: { id: "tahiti", name: "Tahiti" },
    26: { id: "retour", name: "Retour" },
    27: { id: "retour", name: "Retour" }
  };

  const parentChapter = DAY_CHAPTER[dayNumber] || { id: "aller", name: "Arrivée" };

  document.title = `${day.dateLabel} — ${day.title}`;

  window.TravelTimeline?.render(document.getElementById("travel-timeline"), {
    activeDay: dayNumber,
    activeIsland: day.activeIsland || ""
  });

  renderHeader(day, parentChapter);
  day.sequences.forEach(renderSequence);
  renderNavigation(day, parentChapter);
  if (!day.next && database.epilogue) renderEpilogue(database.epilogue);
  setupImageFallbacks();
  setupVideos();
  setupLightbox();

  function renderHeader(item, chapter) {
    const hero = item.useHero === true && item.hero ? `
      <div class="day-hero" data-lightbox-src="${escapeAttr(item.hero)}">
        <img src="${escapeAttr(item.hero)}" alt="${escapeAttr(item.heroAlt || item.title)}" loading="eager">
      </div>` : "";

    page.insertAdjacentHTML("beforeend", `
      <section class="day-head">
        <div class="day-head-inner">
          <div>
            <a class="day-chapter-return" href="chapitre.html?etape=${escapeAttr(chapter.id)}">
              <span aria-hidden="true">←</span>
              <span>Chapitre ${escapeHtml(chapter.name)}</span>
            </a>
            <p class="day-kicker">${escapeHtml(item.chapter)} · ${escapeHtml(item.dateLabel)}</p>
            <h1 class="day-title">${escapeHtml(item.title)}</h1>
            <p class="day-route">${escapeHtml(item.route || "")}</p>
          </div>
          ${hero}
        </div>
      </section>`);
  }

  function renderSequence(sequence) {
    const gallery = renderAlbumGallery(sequence);
    const videos = renderVideos(sequence.videos || []);

    const blocks = (sequence.blocks || []).map(block => `
      <div class="sequence-block ${escapeAttr(block.layout || "")}">
        <div class="sequence-block-copy">
          ${block.heading ? `<h3>${escapeHtml(block.heading)}</h3>` : ""}
          ${(block.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join("")}
        </div>
        ${renderAlbumGallery(block)}
        ${renderVideos(block.videos || [])}
      </div>`).join("");

    page.insertAdjacentHTML("beforeend", `
      <section class="sequence album-section ${escapeAttr(sequence.layout || "")}">
        <div class="sequence-inner">
          <div class="sequence-copy">
            ${sequence.hideTitle ? "" : `<h2>${escapeHtml(sequence.title)}</h2>`}
            ${(sequence.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join("")}
          </div>
          ${gallery}
          ${videos}
          ${blocks ? `<div class="sequence-blocks">${blocks}</div>` : ""}
        </div>
      </section>`);
  }

  function renderAlbumGallery(source) {
    const mosaicPhotos = Array.isArray(source?.mosaicRows)
      ? source.mosaicRows.flat().filter(photo => photo?.src)
      : [];

    // Les journées déjà converties utilisent mosaicRows.
    // Pour les journées suivantes, les anciennes entrées "featured" et "photos"
    // basculent automatiquement dans la même galerie dès qu'un src est renseigné.
    const legacyPhotos = mosaicPhotos.length ? [] : [
      ...(source?.featured || []),
      ...(source?.photos || [])
    ].filter(photo => photo?.src);

    const items = mosaicPhotos.length ? mosaicPhotos : legacyPhotos;
    if (!items.length) return "";

    const html = items.map(photo => `
      <button class="album-photo" type="button" data-lightbox-src="${escapeAttr(photo.src)}">
        <img src="${escapeAttr(photo.src)}" alt="${escapeAttr(photo.alt || photo.label || "")}" loading="lazy">
      </button>`).join("");

    return `<div class="album-mosaic">${html}</div>`;
  }

  function renderVideos(items) {
    const videos = (items || []).filter(video => video?.id);
    if (!videos.length) return "";

    const html = videos.map(video => {
      const isShort = video.format === "short";
      const title = video.title || "Vidéo souvenir";
      const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;

      return `
        <div class="youtube-video ${isShort ? "is-short" : "is-landscape"}">
          <button
            class="youtube-video-card"
            type="button"
            data-youtube-id="${escapeAttr(video.id)}"
            data-youtube-title="${escapeAttr(title)}"
            aria-label="Lire la vidéo : ${escapeAttr(title)}"
          >
            <img src="${escapeAttr(thumb)}" alt="" loading="lazy">
            <span class="youtube-video-shade" aria-hidden="true"></span>
            <span class="youtube-video-kicker">VIDÉO · SOUVENIR</span>
            <span class="youtube-video-play" aria-hidden="true">▶</span>
            <span class="youtube-video-title">${escapeHtml(title)}</span>
          </button>
        </div>`;
    }).join("");

    return `<div class="youtube-videos">${html}</div>`;
  }

  function setupVideos() {
    document.querySelectorAll(".youtube-video-card[data-youtube-id]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.youtubeId;
        const title = button.dataset.youtubeTitle || "Vidéo souvenir";
        if (!id) return;

        const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;

        /* YouTube renvoie l'erreur 153 quand une page locale file://
           tente de charger le lecteur intégré sans origine HTTP.
           En aperçu local, on ouvre donc directement YouTube.
           Une fois le site servi en http/https (GitHub Pages compris),
           la vidéo se lit directement dans la page. */
        if (window.location.protocol === "file:") {
          window.open(watchUrl, "_blank", "noopener,noreferrer");
          return;
        }

        const iframe = document.createElement("iframe");
        iframe.className = "youtube-video-frame";

        const origin = window.location.origin && window.location.origin !== "null"
          ? `&origin=${encodeURIComponent(window.location.origin)}`
          : "";

        iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1${origin}`;
        iframe.title = title;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";

        button.replaceWith(iframe);
      });
    });
  }

  function renderNavigation(item, chapter) {
    const prev = item.previous ? `
      <a class="nav-card prev" href="jour.html?date=${escapeAttr(item.previous.date)}">
        <span class="nav-label">← Journée précédente · ${escapeHtml(shortDate(item.previous.date))}</span>
        <span class="nav-title">${escapeHtml(item.previous.title)}</span>
      </a>` : `<span class="nav-spacer" aria-hidden="true"></span>`;

    const chapterCard = `
      <a class="nav-card chapter" href="chapitre.html?etape=${escapeAttr(chapter.id)}">
        <span class="nav-label">Chapitre</span>
        <span class="nav-title">${escapeHtml(chapter.name)}</span>
        <span class="nav-subtitle">Voir l’étape</span>
      </a>`;

    const next = item.next ? `
      <a class="nav-card next" href="jour.html?date=${escapeAttr(item.next.date)}">
        <span class="nav-label">Journée suivante · ${escapeHtml(shortDate(item.next.date))} →</span>
        <span class="nav-title">${escapeHtml(item.next.title)}</span>
      </a>` : `<span class="nav-spacer" aria-hidden="true"></span>`;

    page.insertAdjacentHTML("beforeend", `
      <nav class="day-nav" aria-label="Navigation de la journée">
        <div class="day-nav-inner">
          ${prev}
          ${chapterCard}
          ${next}
        </div>
      </nav>`);
  }

  function renderEpilogue(epilogue) {
    const kicker = epilogue.kicker
      ? `<p class="day-kicker">${escapeHtml(epilogue.kicker)}</p>`
      : "";

    const finalPhoto = epilogue.showPhoto === false ? "" : `
      <div class="photo-placeholder">
        <strong>PHOTO FINALE À CHOISIR</strong>
        <span>${escapeHtml(epilogue.photoHint || "")}</span>
      </div>`;

    page.insertAdjacentHTML("beforeend", `
      <section class="epilogue">
        <div class="epilogue-inner">
          ${kicker}
          <h2>${escapeHtml(epilogue.title)}</h2>
          ${epilogue.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("")}
          ${finalPhoto}
          <p class="epilogue-signature">${escapeHtml(epilogue.signature)}<br>${escapeHtml(epilogue.dates)}</p>
          <a class="back-home" href="index.html">↑ Revenir au début du voyage</a>
        </div>
      </section>`);
  }

  function shortDate(dateKey) {
    const n = Number(String(dateKey).slice(-2));
    return Number.isFinite(n) ? `${n} juin` : "";
  }

  function photoHtml(photo) {
    if (photo?.src) {
      return `<img src="${escapeAttr(photo.src)}" alt="${escapeAttr(photo.label || "")}" loading="lazy">`;
    }
    return `
      <div class="photo-placeholder">
        <strong>${escapeHtml(photo?.label || "Photo à choisir")}</strong>
        <span>${escapeHtml(photo?.note || "")}</span>
      </div>`;
  }

  function setupImageFallbacks() {
    const images = [...document.querySelectorAll("img[src]")];
    const extensions = [".jpg", ".jpeg", ".JPG", ".JPEG", ".png", ".PNG", ".webp", ".WEBP"];

    images.forEach(img => {
      const original = img.getAttribute("src");
      if (!original) return;

      const candidates = [];
      const match = original.match(/^(.*)(\.[^.\/]+)$/);

      if (match) {
        const base = match[1];
        extensions.forEach(ext => {
          const candidate = `${base}${ext}`;
          if (candidate !== original) candidates.push(candidate);
        });
      }

      if (original.includes("/arrivée/")) candidates.unshift(original.replace("/arrivée/", "/arrivee/"));
      if (original.includes("/arrivee/")) candidates.unshift(original.replace("/arrivee/", "/arrivée/"));

      let candidateIndex = 0;
      const tryNext = () => {
        if (candidateIndex >= candidates.length) return;
        img.src = candidates[candidateIndex++];
      };

      img.addEventListener("error", tryNext);
      if (img.complete && img.naturalWidth === 0) tryNext();
    });
  }

  function setupLightbox() {
    const lightbox = document.getElementById("day-lightbox");
    const image = document.getElementById("day-lightbox-image");
    const count = document.getElementById("day-lightbox-count");
    if (!lightbox || !image || !count) return;

    const items = [...document.querySelectorAll("[data-lightbox-src]")]
      .map(node => ({ node, src: node.dataset.lightboxSrc, alt: node.querySelector("img")?.alt || "" }))
      .filter(item => item.src);

    let current = 0;

    items.forEach((item, index) => {
      item.node.addEventListener("click", () => open(index));
    });

    function open(index) {
      current = index;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      render();
    }

    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
    }

    function move(delta) {
      if (!items.length) return;
      current = (current + delta + items.length) % items.length;
      render();
    }

    function render() {
      image.src = items[current].src;
      image.alt = items[current].alt;
      count.textContent = `${current + 1} / ${items.length}`;
    }

    lightbox.querySelector(".day-lightbox-close")?.addEventListener("click", close);
    lightbox.querySelector(".day-lightbox-prev")?.addEventListener("click", () => move(-1));
    lightbox.querySelector(".day-lightbox-next")?.addEventListener("click", () => move(1));
    lightbox.addEventListener("click", event => { if (event.target === lightbox) close(); });

    document.addEventListener("keydown", event => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
