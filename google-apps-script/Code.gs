/**
 * Carlos Portfolio Media API
 *
 * Deploy this file as a Google Apps Script Web App in the Google account that
 * owns Carlos' media folder. The static GitHub Pages site calls this endpoint
 * as JSONP, so there is no API key in the public repository.
 */

const ROOT_FOLDER_ID = "1hnMwacczNwuYDOuuzSN_KQjQlFAQ1JtB";
const MAX_FILES = 500;
const MAX_DEPTH = 6;
const CACHE_SECONDS = 60;

function doGet(event) {
  const callback = sanitizeCallback_(event && event.parameter && event.parameter.callback);

  try {
    const payload = getCatalog_();
    return output_(payload, callback);
  } catch (error) {
    return output_({
      ok: false,
      folderId: ROOT_FOLDER_ID,
      generatedAt: new Date().toISOString(),
      files: [],
      error: String(error && error.message ? error.message : error),
    }, callback);
  }
}

/**
 * Run once from the Apps Script editor while signed in as the folder owner.
 * It creates the stable folders expected by the website and makes the media
 * tree readable to visitors with the link.
 */
function setupCarlosPortfolio() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const requiredPaths = [
    ["01-landing", "01-background"],
    ["01-landing", "02-portrait"],
    ["01-landing", "03-frame"],
    ["01-landing", "04-tape"],
    ["03-about", "01-portrait"],
    ["03-about", "02-background"],
    ["02-portfolio", "01-graphic-design"],
    ["02-portfolio", "02-marketing-campaigns"],
    ["02-portfolio", "03-visual-storytelling"],
    ["02-portfolio", "04-portrait-photography"],
    ["02-portfolio", "05-video"],
    ["02-portfolio", "06-other"],
  ];

  requiredPaths.forEach((path) => ensurePath_(root, path));
  const organization = organizeExistingAssets_(root);
  const removedEmptyFolders = removeObsoleteEmptyFolders_(root);
  makeTreePublic_(root, 0);
  clearCatalogCache_();

  const result = {
    ok: true,
    folderId: ROOT_FOLDER_ID,
    folderUrl: `https://drive.google.com/drive/folders/${ROOT_FOLDER_ID}`,
    message: "Carlos portfolio folders are ready.",
    movedFiles: organization.moved,
    skippedFiles: organization.skipped,
    removedEmptyFolders: removedEmptyFolders,
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function removeObsoleteEmptyFolders_(root) {
  const portfolio = ensurePath_(root, ["02-portfolio"]);
  const obsoleteNames = ["03-illustration", "04-video", "05-other"];
  const removed = [];

  obsoleteNames.forEach((name) => {
    const matches = portfolio.getFoldersByName(name);
    while (matches.hasNext()) {
      const folder = matches.next();
      if (!folder.getFiles().hasNext() && !folder.getFolders().hasNext()) {
        folder.setTrashed(true);
        removed.push(name);
      }
    }
  });
  return removed;
}

function organizeExistingAssets_(root) {
  const assets = [
    { id: "1JBHRzVsCl3ZO0WijZ7jTMZGDD3mQyJwG", path: ["01-landing", "01-background"], name: "01-gallery-background.jpg" },
    { id: "1ejIQOSNcf_Svpu4magaa8bXtYNKmEWmQ", path: ["01-landing", "02-portrait"], name: "01-carlos-portrait.jpg" },
    { id: "1keZtOdiX5Vi-ccnnQQPWX9_iMmUBx-WH", path: ["01-landing", "03-frame"], name: "01-polaroid-frame.png" },
    { id: "1Ml_7JhZgiEQcO0sXqKEshV3hh3FVjXyN", path: ["01-landing", "04-tape"], name: "01-portrait-tape.png" },
    { id: "1rdKlAqzUt6KzYAii_1u8_b6q6N9piNhC", path: ["02-portfolio", "01-graphic-design"], name: "01-avantech-uniform-layout.jpg" },
    { id: "1KNWDPwFehlZ6l26UGIVLGE7QqXQPu9nF", path: ["02-portfolio", "02-marketing-campaigns"], name: "01-ninoy-aquino-day-advisory.png" },
    { id: "1B7SxHcplPbzTtYdl8knnTafm1zyK42qg", path: ["02-portfolio", "02-marketing-campaigns"], name: "02-energy-solutions-campaign.jpg" },
    { id: "1i1fqJLmePflhgB1FljRhPVngz_XXSsp-", path: ["02-portfolio", "02-marketing-campaigns"], name: "03-home-security-campaign.jpg" },
    { id: "1zbMG_X8WOAZ4DZTIHFYwvQmoayyrK8Vs", path: ["02-portfolio", "02-marketing-campaigns"], name: "04-electricity-cost-campaign.jpg" },
    { id: "1KXoOjFW-ZGtWMnCN-zE3FFJT8xnDn3o9", path: ["02-portfolio", "02-marketing-campaigns"], name: "05-holy-wednesday-campaign.png" },
    { id: "1Z4BK07fgznJ07BxKejQBts1-o0MeUBm3", path: ["02-portfolio", "02-marketing-campaigns"], name: "06-easter-sunday-campaign.png" },
    { id: "1Rw4a11q2PhXMAATvhJE28FtpVB4U8gF4", path: ["02-portfolio", "02-marketing-campaigns"], name: "07-aircon-launch-campaign.png" },
    { id: "1r2q6UETtnpxupXDS-9Ob_pN1Eq8FKYE7", path: ["02-portfolio", "02-marketing-campaigns"], name: "08-hospital-power-campaign.png" },
    { id: "1yZFRCK_NQcOu-AGM1fOngpmov4lEJypd", path: ["02-portfolio", "02-marketing-campaigns"], name: "09-zero-electricity-bill-campaign.png" },
    { id: "1CZ_SOznD85iIt7T59fvy0qTRpGF5F_r6", path: ["02-portfolio", "03-visual-storytelling"], name: "01-vintage-television-still-life.jpg" },
    { id: "1FqiIophPdDigfOWHZSOjCDyq8egpASZp", path: ["02-portfolio", "03-visual-storytelling"], name: "02-museum-balcony.jpg" },
    { id: "1IchqXqwA91YmrZG36Zjigz8KXEHVQAx7", path: ["02-portfolio", "03-visual-storytelling"], name: "03-gallery-visitor.jpg" },
    { id: "1JMvzaR04MvzgipI18MDBNwXcL8ahiUUd", path: ["02-portfolio", "03-visual-storytelling"], name: "04-antique-room.jpg" },
    { id: "1Qvg71CDzR-6sdxHNKTm3n_-eyHiYBlqP", path: ["02-portfolio", "03-visual-storytelling"], name: "05-gallery-hall.jpg" },
    { id: "1Sqd5WyhUCSK5H7qQO8vyrrhsEMW46hFu", path: ["02-portfolio", "03-visual-storytelling"], name: "06-sculpture-study.jpg" },
    { id: "1VXC2nR4QWR-CYDT1QvlDwI5lPDnM7KGX", path: ["02-portfolio", "03-visual-storytelling"], name: "07-gallery-walkthrough.jpg" },
    { id: "1aawRGHdWDH01Qzeh-xqH1AgxOXgjdChV", path: ["02-portfolio", "03-visual-storytelling"], name: "08-texture-and-frames.jpg" },
    { id: "1hPVqtoNEgf_yHXk_KOMNUNGlQQIsoVHK", path: ["02-portfolio", "03-visual-storytelling"], name: "09-classical-painting-study.jpg" },
    { id: "1uRlfv-Uio1Ktc7Whfdg9lpHIeh8YBlSJ", path: ["02-portfolio", "03-visual-storytelling"], name: "10-museum-corridor.jpg" },
    { id: "1qcxI_gbuNRNLLBKR_oogiXn2c04_VcLN", path: ["02-portfolio", "04-portrait-photography"], name: "01-graduation-portrait.jpg" },
  ];
  const result = { moved: 0, skipped: [] };

  assets.forEach((asset) => {
    try {
      const destination = ensurePath_(root, asset.path);
      const file = DriveApp.getFileById(asset.id);
      file.setName(asset.name);
      file.moveTo(destination);
      result.moved += 1;
    } catch (error) {
      result.skipped.push({ id: asset.id, reason: String(error && error.message ? error.message : error) });
    }
  });
  return result;
}

/** Clear the short catalog cache when an immediate refresh is needed. */
function clearCatalogCache() {
  clearCatalogCache_();
  return { ok: true, message: "Catalog cache cleared." };
}

function getCatalog_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("carlos-portfolio-catalog-v1");
  if (cached) return JSON.parse(cached);

  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const files = [];
  const folders = [];
  walkFolder_(root, [], files, folders, 0);

  const payload = {
    ok: true,
    folderId: ROOT_FOLDER_ID,
    folderName: root.getName(),
    generatedAt: new Date().toISOString(),
    files: files,
    folders: folders,
  };

  const serialized = JSON.stringify(payload);
  if (serialized.length < 90000) {
    cache.put("carlos-portfolio-catalog-v1", serialized, CACHE_SECONDS);
  }
  return payload;
}

function walkFolder_(folder, path, files, folders, depth) {
  if (depth > MAX_DEPTH || files.length >= MAX_FILES) return;

  const fileIterator = folder.getFiles();
  while (fileIterator.hasNext() && files.length < MAX_FILES) {
    const file = fileIterator.next();
    const name = file.getName();
    const mimeType = file.getMimeType();
    const modifiedTime = file.getLastUpdated().toISOString();
    const id = file.getId();
    files.push({
      id: id,
      name: name,
      title: cleanTitle_(name),
      order: orderFromName_(name),
      mimeType: mimeType,
      description: file.getDescription() || "",
      size: file.getSize(),
      modifiedTime: modifiedTime,
      folderPath: path.join("/"),
      path: path.concat([name]).join("/"),
      viewUrl: `https://drive.google.com/file/d/${id}/view`,
      previewUrl: `https://drive.google.com/file/d/${id}/preview?rm=minimal&v=${encodeURIComponent(modifiedTime)}`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1800&v=${encodeURIComponent(modifiedTime)}`,
    });
  }

  const folderIterator = folder.getFolders();
  while (folderIterator.hasNext()) {
    const child = folderIterator.next();
    const childPath = path.concat([child.getName()]);
    folders.push({
      id: child.getId(),
      name: child.getName(),
      order: orderFromName_(child.getName()),
      path: childPath.join("/"),
    });
    walkFolder_(child, childPath, files, folders, depth + 1);
  }
}

function ensurePath_(root, names) {
  return names.reduce((parent, name) => {
    const matches = parent.getFoldersByName(name);
    return matches.hasNext() ? matches.next() : parent.createFolder(name);
  }, root);
}

function makeTreePublic_(folder, depth) {
  if (depth > MAX_DEPTH) return;
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    throw new Error(
      "Google Workspace blocked public link sharing. Ask the Workspace admin to allow Anyone with the link access, then run setupCarlosPortfolio again."
    );
  }

  const childFolders = folder.getFolders();
  while (childFolders.hasNext()) makeTreePublic_(childFolders.next(), depth + 1);

  const childFiles = folder.getFiles();
  while (childFiles.hasNext()) {
    childFiles.next().setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
}

function clearCatalogCache_() {
  CacheService.getScriptCache().remove("carlos-portfolio-catalog-v1");
}

function orderFromName_(name) {
  const match = String(name || "").match(/^\s*(\d+)/);
  return match ? Number(match[1]) : 9999;
}

function cleanTitle_(name) {
  return String(name || "")
    .replace(/^\s*\d+[._ -]+/, "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function sanitizeCallback_(callback) {
  const candidate = String(callback || "").trim();
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(candidate) ? candidate : "";
}

function output_(payload, callback) {
  const serialized = JSON.stringify(payload);
  const body = callback ? `${callback}(${serialized});` : serialized;
  const mimeType = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(body).setMimeType(mimeType);
}
