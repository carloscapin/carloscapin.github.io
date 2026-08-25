(() => {
  "use strict";

  const config = window.CARLOS_PORTFOLIO_CONFIG || {};
  const elements = {
    background: document.querySelector("#hero-background"),
    portraitCard: document.querySelector("#portrait-card"),
    portrait: document.querySelector("#hero-portrait"),
    portraitPlaceholder: document.querySelector("#portrait-placeholder"),
    portraitFrame: document.querySelector("#portrait-frame"),
    portraitTape: document.querySelector("#portrait-tape"),
    aboutBackground: document.querySelector("#about-background"),
    aboutPhoto: document.querySelector("#about-photo"),
    aboutPortrait: document.querySelector("#about-portrait"),
    aboutPlaceholder: document.querySelector("#about-placeholder"),
    dock: document.querySelector("#icon-dock"),
    dockItems: [...document.querySelectorAll(".icon-dock__item")],
    dockMinimize: document.querySelector("#icon-dock-minimize"),
    dockRestore: document.querySelector("#icon-dock-restore"),
    dockStatus: document.querySelector("#icon-dock-status"),
  };
  const DOCK_IDLE_MS = 6000;
  const DOCK_TARGETS = Object.freeze({ Home: "#home", About: "#about" });
  let dockIdleTimer = 0;
  let dockScrollFrame = 0;
  let heroMediaGeneration = 0;

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

  const newestMediaSort = (left, right) => {
    const leftTime = Date.parse(left.item.modifiedTime || left.item.modified_time || 0) || 0;
    const rightTime = Date.parse(right.item.modifiedTime || right.item.modified_time || 0) || 0;
    return rightTime - leftTime || mediaSort(left.item, right.item);
  };

  const explicitDecorationRole = (item) => {
    const itemName = slug(item.name || item.title || "");
    if (belongsTo(item, "landing", "frame") || /(?:^|-)(?:frame|polaroid)(?:-|$)/.test(itemName)) {
      return "frame";
    }
    if (belongsTo(item, "landing", "tape") || /(?:^|-)tape(?:-|$)/.test(itemName)) {
      return "tape";
    }
    return "";
  };

  const inspectDecoration = (item) =>
    new Promise((resolve) => {
      const url = driveThumbnail(item, "w1800");
      const image = new Image();
      const explicitRole = explicitDecorationRole(item);

      image.onload = () => {
        const aspectRatio = image.naturalWidth / image.naturalHeight;
        const role = explicitRole || (aspectRatio >= 1.6 ? "tape" : aspectRatio <= 1.35 ? "frame" : "");
        resolve(role ? { item, role, url } : null);
      };
      image.onerror = () => resolve(explicitRole ? { item, role: explicitRole, url } : null);
      image.src = url;
    });

  function setCurrentYear() {
    const currentYear = String(new Date().getFullYear());
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = currentYear;
    });
  }

  function setDockSelection(selectedItem, announce = true) {
    elements.dockItems.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === selectedItem));
    });

    const selectedView = selectedItem.dataset.dockView || selectedItem.getAttribute("aria-label");
    if (announce) elements.dockStatus.textContent = `${selectedView} selected`;
    return selectedView;
  }

  function selectDockItem(selectedItem) {
    const selectedView = setDockSelection(selectedItem);
    document.querySelector(DOCK_TARGETS[selectedView])?.scrollIntoView({ behavior: "smooth", block: "start" });

    scheduleDockAutoCollapse();
  }

  function syncDockWithPage() {
    dockScrollFrame = 0;
    const about = document.querySelector("#about");
    const selectedView = about && window.scrollY + window.innerHeight * 0.5 >= about.offsetTop
      ? "About"
      : "Home";
    const selectedItem = elements.dockItems.find((item) => item.dataset.dockView === selectedView);

    if (selectedItem && selectedItem.getAttribute("aria-pressed") !== "true") {
      setDockSelection(selectedItem, false);
    }
  }

  function handlePageScroll() {
    revealDockMinimize();
    if (!dockScrollFrame) dockScrollFrame = window.requestAnimationFrame(syncDockWithPage);
  }

  function clearDockIdleTimer() {
    window.clearTimeout(dockIdleTimer);
    dockIdleTimer = 0;
  }

  function scheduleDockAutoCollapse() {
    clearDockIdleTimer();
    if (elements.dock.classList.contains("is-minimized")) return;

    dockIdleTimer = window.setTimeout(() => {
      const focusedControl = elements.dock.contains(document.activeElement)
        ? document.activeElement
        : null;

      if (focusedControl?.matches(":focus-visible")) {
        scheduleDockAutoCollapse();
        return;
      }

      setDockMinimized(true, false);
    }, DOCK_IDLE_MS);
  }

  function revealDockMinimize() {
    elements.dock.classList.add("has-scrolled");
    elements.dockMinimize.disabled = false;
    elements.dockMinimize.setAttribute("aria-hidden", "false");
  }

  function setDockMinimized(minimized, moveFocus = true) {
    clearDockIdleTimer();
    elements.dock.classList.toggle("is-minimized", minimized);
    elements.dock.inert = minimized;
    elements.dock.setAttribute("aria-hidden", String(minimized));
    elements.dockMinimize.setAttribute("aria-expanded", String(!minimized));
    elements.dockRestore.classList.toggle("is-visible", minimized);
    elements.dockRestore.setAttribute("aria-expanded", String(minimized));
    elements.dockRestore.setAttribute("aria-hidden", String(!minimized));

    if (!minimized) scheduleDockAutoCollapse();

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
    elements.dockRestore.addEventListener("click", (event) => {
      const usedKeyboard = event.detail === 0;
      setDockMinimized(false, usedKeyboard);
      if (!usedKeyboard) elements.dockRestore.blur();
    });
    elements.dock.addEventListener("pointerenter", scheduleDockAutoCollapse);
    elements.dock.addEventListener("pointermove", scheduleDockAutoCollapse);
    elements.dock.addEventListener("pointerleave", scheduleDockAutoCollapse);
    elements.dock.addEventListener("focusin", clearDockIdleTimer);
    elements.dock.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        if (!elements.dock.matches(":focus-within")) scheduleDockAutoCollapse();
      });
    });
    window.addEventListener("scroll", handlePageScroll, { passive: true });
    window.addEventListener("wheel", revealDockMinimize, { passive: true });
    window.addEventListener("touchmove", revealDockMinimize, { passive: true });
    setDockMinimized(false, false);
    syncDockWithPage();
  }

  function clearBackground() {
    elements.background.style.removeProperty("background-image");
    elements.background.classList.remove("is-loaded");
  }

  function clearAboutBackground() {
    elements.aboutBackground.style.removeProperty("background-image");
    elements.aboutBackground.classList.remove("is-loaded");
  }

  function applyAboutMedia(items) {
    const dedicatedPortrait = items
      .filter((item) => isImage(item) && belongsTo(item, "about", "portrait"))
      .sort(mediaSort)[0];
    const fallbackPortrait = items
      .filter((item) => isImage(item) && belongsTo(item, "portfolio", "portrait-photography"))
      .sort(mediaSort)[0];
    const dedicatedBackground = items
      .filter((item) => isImage(item) && belongsTo(item, "about", "background"))
      .sort(mediaSort)[0];
    const fallbackBackground = items
      .filter((item) => isImage(item) && belongsTo(item, "landing", "background"))
      .sort(mediaSort)[0];
    const portrait = dedicatedPortrait || fallbackPortrait;
    const background = dedicatedBackground || fallbackBackground;

    elements.aboutPortrait.hidden = true;
    elements.aboutPlaceholder.hidden = false;
    elements.aboutPhoto.classList.add("is-loading");

    if (portrait) {
      elements.aboutPortrait.onload = () => {
        elements.aboutPortrait.hidden = false;
        elements.aboutPlaceholder.hidden = true;
        elements.aboutPhoto.classList.remove("is-loading");
      };
      elements.aboutPortrait.onerror = () => {
        elements.aboutPortrait.hidden = true;
        elements.aboutPlaceholder.hidden = false;
      };
      elements.aboutPortrait.src = driveThumbnail(portrait, "w1200");
    } else {
      elements.aboutPortrait.removeAttribute("src");
    }

    if (background) {
      const backgroundUrl = driveThumbnail(background, "w2400");
      const preload = new Image();
      preload.onload = () => {
        elements.aboutBackground.style.backgroundImage = `url("${backgroundUrl}")`;
        elements.aboutBackground.classList.add("is-loaded");
      };
      preload.onerror = clearAboutBackground;
      preload.src = backgroundUrl;
    } else {
      clearAboutBackground();
    }
  }

  function clearPortrait() {
    elements.portrait.hidden = true;
    elements.portrait.removeAttribute("src");
    elements.portraitPlaceholder.hidden = false;
    elements.portraitCard.classList.add("is-portrait-loading");
  }

  function clearPortraitDecoration(element, stateClass) {
    element.hidden = true;
    element.removeAttribute("src");
    elements.portraitCard.classList.remove(stateClass);
  }

  function applyPortraitDecoration(descriptor, element, stateClass, generation) {
    return new Promise((resolve) => {
      if (!descriptor) {
        clearPortraitDecoration(element, stateClass);
        resolve(false);
        return;
      }

      element.onload = () => {
        if (generation !== heroMediaGeneration) {
          resolve(false);
          return;
        }

        element.hidden = false;
        elements.portraitCard.classList.add(stateClass);
        resolve(true);
      };
      element.onerror = () => {
        if (generation === heroMediaGeneration) {
          clearPortraitDecoration(element, stateClass);
        }
        resolve(false);
      };
      element.src = descriptor.url;
    });
  }

  async function applyPortraitDecorations(items, portrait, generation) {
    const candidates = items.filter(
      (item) =>
        isImage(item) &&
        item.id !== portrait?.id &&
        (belongsTo(item, "landing", "portrait") ||
          belongsTo(item, "landing", "frame") ||
          belongsTo(item, "landing", "tape"))
    );
    const inspected = (await Promise.all(candidates.map(inspectDecoration))).filter(Boolean);
    if (generation !== heroMediaGeneration) return false;

    const frame = inspected.filter((item) => item.role === "frame").sort(newestMediaSort)[0];
    const tape = inspected.filter((item) => item.role === "tape").sort(newestMediaSort)[0];
    const [frameLoaded] = await Promise.all([
      applyPortraitDecoration(frame, elements.portraitFrame, "is-drive-framed", generation),
      applyPortraitDecoration(tape, elements.portraitTape, "has-drive-tape", generation),
    ]);
    return frameLoaded;
  }

  function loadPortrait(portrait, generation) {
    elements.portrait.hidden = true;
    elements.portraitPlaceholder.hidden = false;
    elements.portraitCard.classList.add("is-portrait-loading");

    if (!portrait) {
      clearPortrait();
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      elements.portrait.onload = () => resolve(generation === heroMediaGeneration);
      elements.portrait.onerror = () => {
        if (generation === heroMediaGeneration) {
          clearPortrait();
        }
        resolve(false);
      };
      elements.portrait.src = driveThumbnail(portrait, "w1400");
    });
  }

  function applyHeroMedia(items) {
    const generation = ++heroMediaGeneration;
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

    const portraitReady = loadPortrait(portrait, generation);
    const decorationsReady = applyPortraitDecorations(items, portrait, generation);

    Promise.all([portraitReady, decorationsReady]).then(([portraitLoaded]) => {
      if (generation === heroMediaGeneration && portraitLoaded) {
        elements.portrait.hidden = false;
        elements.portraitPlaceholder.hidden = true;
        elements.portraitCard.classList.remove("is-portrait-loading");
      }
    });
  }

  function applyCatalog(payload) {
    const items = Array.isArray(payload) ? payload : payload?.files;
    if (!Array.isArray(items)) {
      document.documentElement.dataset.mediaStatus = "invalid";
      return;
    }

    applyHeroMedia(items);
    applyAboutMedia(items);
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
