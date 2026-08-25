(() => {
  "use strict";

  const config = window.CARLOS_PORTFOLIO_CONFIG || {};
  const state = {
    items: [],
    activeCategory: "all",
    refreshTimer: null,
  };

  const elements = {
    background: document.querySelector("#hero-background"),
    portrait: document.querySelector("#hero-portrait"),
    portraitPlaceholder: document.querySelector("#portrait-placeholder"),
    grid: document.querySelector("#portfolio-grid"),
    empty: document.querySelector("#portfolio-empty"),
    filters: document.querySelector("#category-filters"),
    dialog: document.querySelector("#media-dialog"),
    dialogStage: document.querySelector("#media-dialog-stage"),
    dialogTitle: document.querySelector("#media-dialog-title"),
    dialogCategory: document.querySelector("#media-dialog-category"),
    dialogSource: document.querySelector("#media-dialog-source"),
    email: document.querySelector("#contact-email"),
  };

  const stripOrderPrefix = (value = "") => value.replace(/^\s*\d+[._ -]+/, "").trim();
  const slug = (value = "") =>
    stripOrderPrefix(value)
      .toLowerCase()
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const titleCase = (value = "") =>
    stripOrderPrefix(value)
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim();

  const canonicalSegments = (item) => {
    const path = item.path || item.folderPath || item.folder_path || "";
    return path
      .split("/")
      .filter(Boolean)
      .map((segment) => slug(segment));
  };

  const versionToken = (item) => encodeURIComponent(item.modifiedTime || item.modified_time || "latest");
  const driveThumbnail = (item, size = "w1800") =>
    item.thumbnailUrl ||
    item.thumbnail_url ||
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.id)}&sz=${size}&v=${versionToken(item)}`;
  const drivePreview = (item) =>
    item.previewUrl ||
    item.preview_url ||
    `https://drive.google.com/file/d/${encodeURIComponent(item.id)}/preview?rm=minimal&v=${versionToken(item)}`;
  const driveView = (item) =>
    item.viewUrl || item.view_url || `https://drive.google.com/file/d/${encodeURIComponent(item.id)}/view`;

  const isImage = (item) => (item.mimeType || item.mime_type || "").startsWith("image/");
  const isVideo = (item) => (item.mimeType || item.mime_type || "").startsWith("video/");
  const isMedia = (item) => isImage(item) || isVideo(item);
  const belongsTo = (item, parent, child) => {
    const segments = canonicalSegments(item);
    const parentIndex = segments.indexOf(parent);
    return parentIndex >= 0 && (!child || segments[parentIndex + 1] === child);
  };

  const mediaSort = (left, right) => {
    const leftOrder = Number(left.order ?? String(left.name || "").match(/^\d+/)?.[0] ?? 9999);
    const rightOrder = Number(right.order ?? String(right.name || "").match(/^\d+/)?.[0] ?? 9999);
    return leftOrder - rightOrder || String(left.name || "").localeCompare(String(right.name || ""));
  };

  function setCurrentYear() {
    const currentYear = new Date().getFullYear();
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(currentYear);
    });
  }

  function setContactEmail() {
    if (!config.contactEmail) {
      elements.email.querySelector("span").textContent = "Contact details coming soon";
      return;
    }
    elements.email.disabled = false;
    elements.email.setAttribute("aria-label", `Email Carlos at ${config.contactEmail}`);
    elements.email.addEventListener("click", () => {
      window.location.href = `mailto:${config.contactEmail}`;
    });
  }

  function applyHeroMedia(items) {
    const background = items.filter((item) => isImage(item) && belongsTo(item, "landing", "background")).sort(mediaSort)[0];
    const portrait = items.filter((item) => isImage(item) && belongsTo(item, "landing", "portrait")).sort(mediaSort)[0];

    if (background) {
      const backgroundUrl = driveThumbnail(background, "w2400");
      const preload = new Image();
      preload.onload = () => {
        elements.background.style.backgroundImage = `url("${backgroundUrl}")`;
        elements.background.classList.add("is-loaded");
      };
      preload.src = backgroundUrl;
    }

    if (portrait) {
      elements.portrait.onload = () => {
        elements.portrait.hidden = false;
        elements.portraitPlaceholder.hidden = true;
      };
      elements.portrait.src = driveThumbnail(portrait, "w1400");
    }
  }

  function projectCategory(item) {
    const segments = canonicalSegments(item);
    const portfolioIndex = segments.indexOf("portfolio");
    return portfolioIndex >= 0 && segments[portfolioIndex + 1]
      ? segments[portfolioIndex + 1]
      : "selected-work";
  }

  function projectTitle(item) {
    return titleCase(item.title || item.name || "Untitled work");
  }

  function createProjectCard(item, index) {
    const category = projectCategory(item);
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.category = category;
    card.style.setProperty("--card-delay", `${Math.min(index * 45, 360)}ms`);

    const openButton = document.createElement("button");
    openButton.className = "project-card__open";
    openButton.type = "button";
    openButton.setAttribute("aria-label", `Preview ${projectTitle(item)}`);
    openButton.addEventListener("click", () => openMediaDialog(item));

    const media = document.createElement("div");
    media.className = "project-card__media";
    const image = document.createElement("img");
    image.loading = "lazy";
    image.decoding = "async";
    image.alt = "";
    image.src = driveThumbnail(item, "w1400");
    image.addEventListener("error", () => card.classList.add("has-media-error"), { once: true });
    media.append(image);

    if (isVideo(item)) {
      const play = document.createElement("span");
      play.className = "project-card__play";
      play.setAttribute("aria-hidden", "true");
      play.textContent = "▶";
      media.append(play);
    }

    const details = document.createElement("div");
    details.className = "project-card__details";
    const number = document.createElement("span");
    number.className = "project-card__number";
    number.textContent = String(index + 1).padStart(2, "0");
    const copy = document.createElement("span");
    const categoryLabel = document.createElement("small");
    categoryLabel.textContent = titleCase(category);
    const title = document.createElement("strong");
    title.textContent = projectTitle(item);
    copy.append(categoryLabel, title);
    const arrow = document.createElement("span");
    arrow.className = "project-card__arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    details.append(number, copy, arrow);
    openButton.append(media, details);
    card.append(openButton);
    return card;
  }

  function renderPortfolio(items) {
    const projects = items
      .filter((item) => isMedia(item) && belongsTo(item, "portfolio"))
      .sort(mediaSort);
    state.items = projects;
    elements.grid.replaceChildren();

    if (!projects.length) {
      elements.empty.hidden = false;
      elements.filters.hidden = true;
      return;
    }

    elements.empty.hidden = true;
    renderFilters(projects);
    const visibleProjects = state.activeCategory === "all"
      ? projects
      : projects.filter((item) => projectCategory(item) === state.activeCategory);
    const fragment = document.createDocumentFragment();
    visibleProjects.forEach((item, index) => fragment.append(createProjectCard(item, index)));
    elements.grid.append(fragment);
  }

  function renderFilters(projects) {
    const categories = [...new Set(projects.map(projectCategory))];
    if (state.activeCategory !== "all" && !categories.includes(state.activeCategory)) {
      state.activeCategory = "all";
    }

    elements.filters.replaceChildren();
    const options = ["all", ...categories];
    options.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "work__filter";
      button.dataset.category = category;
      button.textContent = category === "all" ? "All work" : titleCase(category);
      button.setAttribute("aria-pressed", String(category === state.activeCategory));
      button.addEventListener("click", () => {
        state.activeCategory = category;
        renderPortfolio(state.items);
      });
      elements.filters.append(button);
    });
    elements.filters.hidden = options.length <= 2;
  }

  function openMediaDialog(item) {
    elements.dialogStage.replaceChildren();
    let preview;
    if (isVideo(item)) {
      preview = document.createElement("iframe");
      preview.src = drivePreview(item);
      preview.title = `${projectTitle(item)} video preview`;
      preview.allow = "autoplay; encrypted-media; picture-in-picture";
      preview.allowFullscreen = true;
      preview.referrerPolicy = "strict-origin-when-cross-origin";
    } else {
      preview = document.createElement("img");
      preview.src = driveThumbnail(item, "w2400");
      preview.alt = projectTitle(item);
    }
    elements.dialogStage.append(preview);
    elements.dialogTitle.textContent = projectTitle(item);
    elements.dialogCategory.textContent = titleCase(projectCategory(item));
    elements.dialogSource.href = driveView(item);
    elements.dialog.showModal();
  }

  function closeMediaDialog() {
    if (!elements.dialog.open) return;
    elements.dialog.close();
    elements.dialogStage.replaceChildren();
  }

  function bindDialog() {
    elements.dialog.querySelector(".media-dialog__close").addEventListener("click", closeMediaDialog);
    elements.dialog.addEventListener("click", (event) => {
      if (event.target === elements.dialog) closeMediaDialog();
    });
  }

  function applyCatalog(payload) {
    const items = Array.isArray(payload) ? payload : payload?.files;
    if (!Array.isArray(items)) {
      console.warn("Carlos portfolio received an invalid Drive catalog.");
      return;
    }
    applyHeroMedia(items);
    renderPortfolio(items);
    document.documentElement.dataset.mediaStatus = "ready";
  }

  function loadDriveCatalog() {
    if (!config.mediaApiUrl) {
      document.documentElement.dataset.mediaStatus = "needs-setup";
      return;
    }

    const callbackName = `__receiveCarlosMedia_${Date.now()}`;
    const script = document.createElement("script");
    const separator = config.mediaApiUrl.includes("?") ? "&" : "?";
    const timeout = window.setTimeout(() => {
      cleanup();
      document.documentElement.dataset.mediaStatus = "unavailable";
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    };

    window[callbackName] = (payload) => {
      cleanup();
      applyCatalog(payload);
    };
    script.onerror = () => {
      cleanup();
      document.documentElement.dataset.mediaStatus = "unavailable";
    };
    script.src = `${config.mediaApiUrl}${separator}callback=${callbackName}&_=${Date.now()}`;
    document.head.append(script);
  }

  setCurrentYear();
  setContactEmail();
  bindDialog();
  loadDriveCatalog();

  if (Number(config.refreshEveryMs) > 0) {
    state.refreshTimer = window.setInterval(loadDriveCatalog, Number(config.refreshEveryMs));
  }
})();
