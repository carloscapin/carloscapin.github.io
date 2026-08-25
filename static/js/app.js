(() => {
  "use strict";

  const config = window.CARLOS_PORTFOLIO_CONFIG || {};
  const elements = {
    background: document.querySelector("#hero-background"),
    portrait: document.querySelector("#hero-portrait"),
    portraitPlaceholder: document.querySelector("#portrait-placeholder"),
    dock: document.querySelector("#icon-dock"),
    dockItems: [...document.querySelectorAll(".icon-dock__item")],
    dockMinimize: document.querySelector("#icon-dock-minimize"),
    dockRestore: document.querySelector("#icon-dock-restore"),
    dockStatus: document.querySelector("#icon-dock-status"),
  };

  const stripOrderPrefix = (value = "") => value.replace(/^\s*\d+[._ -]+/, "").trim();
  const slug = (value = "") =>
    stripOrderPrefix(value)
      .toLowerCase()
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const canonicalSegments = (item) => {
    const path = item.path || item.folderPath || item.folder_path || "";
    return path.split("/").filter(Boolean).map((segment) => slug(segment));
  };

  const belongsTo = (item, parent, child) => {
    const segments = canonicalSegments(item);
    const parentIndex = segments.indexOf(parent);
    return parentIndex >= 0 && segments[parentIndex + 1] === child;
  };

  const isImage = (item) => (item.mimeType || item.mime_type || "").startsWith("image/");
  const mediaSort = (left, right) => {
    const leftOrder = Number(left.order ?? String(left.name || "").match(/^\d+/)?.[0] ?? 9999);
    const rightOrder = Number(right.order ?? String(right.name || "").match(/^\d+/)?.[0] ?? 9999);
    return leftOrder - rightOrder || String(left.name || "").localeCompare(String(right.name || ""));
  };

  const versionToken = (item) => encodeURIComponent(item.modifiedTime || item.modified_time || "latest");
  const driveThumbnail = (item, size) =>
    item.thumbnailUrl ||
    item.thumbnail_url ||
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.id)}&sz=${size}&v=${versionToken(item)}`;

  function setCurrentYear() {
    const currentYear = String(new Date().getFullYear());
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = currentYear;
    });
  }

  function selectDockItem(selectedItem) {
    elements.dockItems.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === selectedItem));
    });

    const selectedView = selectedItem.dataset.dockView || selectedItem.getAttribute("aria-label");
    elements.dockStatus.textContent = `${selectedView} selected`;

    if (selectedView === "Home") {
      document.querySelector("#home")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setDockMinimized(minimized, moveFocus = true) {
    elements.dock.classList.toggle("is-minimized", minimized);
    elements.dock.inert = minimized;
    elements.dock.setAttribute("aria-hidden", String(minimized));
    elements.dockMinimize.setAttribute("aria-expanded", String(!minimized));
    elements.dockRestore.classList.toggle("is-visible", minimized);
    elements.dockRestore.setAttribute("aria-expanded", String(minimized));
    elements.dockRestore.setAttribute("aria-hidden", String(!minimized));

    if (!moveFocus) return;

    window.requestAnimationFrame(() => {
      if (minimized) {
        elements.dockRestore.focus();
      } else {
        elements.dockItems.find((item) => item.getAttribute("aria-pressed") === "true")?.focus();
      }
    });
  }

  function bindIconDock() {
    elements.dockItems.forEach((item) => {
      item.addEventListener("click", () => selectDockItem(item));
    });
    elements.dockMinimize.addEventListener("click", () => setDockMinimized(true));
    elements.dockRestore.addEventListener("click", () => setDockMinimized(false));
    setDockMinimized(false, false);
  }

  function clearBackground() {
    elements.background.style.removeProperty("background-image");
    elements.background.classList.remove("is-loaded");
  }

  function clearPortrait() {
    elements.portrait.hidden = true;
    elements.portrait.removeAttribute("src");
    elements.portraitPlaceholder.hidden = false;
  }

  function applyHeroMedia(items) {
    const background = items
      .filter((item) => isImage(item) && belongsTo(item, "landing", "background"))
      .sort(mediaSort)[0];
    const portrait = items
      .filter((item) => isImage(item) && belongsTo(item, "landing", "portrait"))
      .sort(mediaSort)[0];

    if (background) {
      const backgroundUrl = driveThumbnail(background, "w2400");
      const preload = new Image();
      preload.onload = () => {
        elements.background.style.backgroundImage = `url("${backgroundUrl}")`;
        elements.background.classList.add("is-loaded");
      };
      preload.onerror = clearBackground;
      preload.src = backgroundUrl;
    } else {
      clearBackground();
    }

    if (portrait) {
      elements.portrait.onload = () => {
        elements.portrait.hidden = false;
        elements.portraitPlaceholder.hidden = true;
      };
      elements.portrait.onerror = clearPortrait;
      elements.portrait.src = driveThumbnail(portrait, "w1400");
    } else {
      clearPortrait();
    }
  }

  function applyCatalog(payload) {
    const items = Array.isArray(payload) ? payload : payload?.files;
    if (!Array.isArray(items)) {
      document.documentElement.dataset.mediaStatus = "invalid";
      return;
    }

    applyHeroMedia(items);
    document.documentElement.dataset.mediaStatus = "ready";
  }

  function loadDriveCatalog() {
    if (!config.mediaApiUrl) {
      document.documentElement.dataset.mediaStatus = "needs-setup";
      return;
    }

    const callbackName = `__receiveCarlosHeroMedia_${Date.now()}`;
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
  bindIconDock();
  loadDriveCatalog();

  if (Number(config.refreshEveryMs) > 0) {
    window.setInterval(loadDriveCatalog, Number(config.refreshEveryMs));
  }
})();
