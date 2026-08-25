import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("fresh Carlos landing contains the reference hierarchy and identity", async () => {
  const html = await read("index.html");
  assert.match(html, /Carlos Capin/);
  assert.match(html, /Graphic[\s\S]*Artist/i);
  assert.match(html, /Marketing Management/i);
  assert.doesNotMatch(html, /Jerome|Jirog/i);
});

test("GitHub Pages uses only relative local site assets", async () => {
  const html = await read("index.html");
  assert.match(html, /static\/css\/main\.css/);
  assert.match(html, /static\/js\/drive-config\.js/);
  assert.match(html, /static\/js\/app\.js/);
  assert.doesNotMatch(html, /(?:src|href)=["'](?:[A-Za-z]:\\|\/Users\/)/);
});

test("Drive configuration points to Carlos' supplied folder", async () => {
  const config = await read("static/js/drive-config.js");
  assert.match(config, /1hnMwacczNwuYDOuuzSN_KQjQlFAQ1JtB/);
  assert.match(config, /mediaApiUrl/);
  assert.doesNotMatch(config, /jerome|jirog/i);
});

test("the first release renders only one hero section", async () => {
  const html = await read("index.html");
  assert.equal((html.match(/<section\b/g) || []).length, 1);
  assert.match(html, /<section class="hero"/);
  assert.doesNotMatch(html, /id="(?:work|about|contact)"/);
  assert.doesNotMatch(html, /<dialog\b|<footer\b|href="#work"/);
});

test("bottom icon dock auto-collapses and keeps its controls visually clean", async () => {
  const [html, css, app] = await Promise.all([
    read("index.html"),
    read("static/css/main.css"),
    read("static/js/app.js"),
  ]);
  assert.equal((html.match(/class="icon-dock__item"/g) || []).length, 6);
  assert.match(html, /id="icon-dock-minimize"/);
  assert.match(html, /id="icon-dock-minimize"[\s\S]*aria-hidden="true"[\s\S]*disabled/);
  assert.match(html, /id="icon-dock-restore"/);
  assert.match(css, /\.icon-dock\s*\{[\s\S]*position:\s*fixed[\s\S]*bottom:/);
  assert.match(css, /\.icon-dock__item\s*\{[\s\S]*background:\s*transparent/);
  assert.match(css, /\.icon-dock__item\[aria-pressed="true"\][\s\S]*color:\s*var\(--acid\)/);
  assert.match(css, /@keyframes dock-shake/);
  assert.match(css, /@keyframes dock-shake[\s\S]*transform:\s*rotate\(/);
  assert.doesNotMatch(css.match(/@keyframes dock-shake\s*\{[\s\S]*?\n\}/)?.[0] || "", /translateX/);
  assert.match(css, /\.icon-dock__restore\.is-visible[\s\S]*animation:\s*dock-shake/);
  assert.match(css, /\.icon-dock\.has-scrolled \.icon-dock__minimize:not\(:disabled\)/);
  assert.match(css, /\.icon-dock__item > span::after/);
  assert.doesNotMatch(css, /\.icon-dock__item \+ \.icon-dock__item::before/);
  assert.match(app, /DOCK_IDLE_MS\s*=\s*6000/);
  assert.match(app, /scheduleDockAutoCollapse/);
  assert.match(app, /addEventListener\("pointermove", scheduleDockAutoCollapse/);
  assert.match(app, /addEventListener\("scroll", revealDockMinimize/);
  assert.match(app, /setDockMinimized/);
  assert.match(app, /setAttribute\("aria-pressed"/);
});

test("Drive catalog is limited to automatic hero media", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("static/js/app.js")]);
  assert.match(html, /id="portrait-frame"/);
  assert.match(html, /id="portrait-tape"/);
  assert.match(app, /belongsTo\(item, "landing", "background"\)/);
  assert.match(app, /belongsTo\(item, "landing", "portrait"\)/);
  assert.match(app, /belongsTo\(item, "landing", "frame"\)/);
  assert.match(app, /belongsTo\(item, "landing", "tape"\)/);
  assert.match(app, /aspectRatio >= 1\.6 \? "tape" : aspectRatio <= 1\.35 \? "frame"/);
  assert.match(app, /setInterval\(loadDriveCatalog/);
  assert.doesNotMatch(app, /renderPortfolio|projectCategory|openMediaDialog|portfolio-grid/);
});

test("Apps Script creates the required Drive structure and returns JSONP", async () => {
  const script = await read("google-apps-script/Code.gs");
  assert.match(script, /setupCarlosPortfolio/);
  assert.match(script, /01-landing/);
  assert.match(script, /03-frame/);
  assert.match(script, /04-tape/);
  assert.match(script, /02-portfolio/);
  assert.match(script, /ANYONE_WITH_LINK/);
  assert.match(script, /callback \? `\$\{callback\}\(\$\{serialized\}\);`/);
});

test("landing remains edge-to-edge and responsive", async () => {
  const [html, css] = await Promise.all([read("index.html"), read("static/css/main.css")]);
  assert.match(css, /height:\s*100svh/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(html, /<svg[\s\S]*class="hero__folder"[\s\S]*<path d="[^"]*Q[^"]*"/);
  assert.doesNotMatch(html, /class="hero__folio"/);
  assert.match(css, /\.hero__folder path\s*\{[\s\S]*fill:\s*#fbfbfa/);
  assert.doesNotMatch(css, /\.hero__folder::before|\.hero__folder[\s\S]*clip-path:\s*polygon/);
  assert.match(css, /\.hero__drive-background\s*\{[\s\S]*background-size:\s*100% 100%[\s\S]*filter:\s*none/);
  assert.match(css, /\.hero__title\s*\{[\s\S]*font-family:\s*var\(--serif\)/);
  assert.match(html, /class="portrait-card__name">Carlos Capin<\/span>\s*<span class="portrait-card__label">Artist Portfolio/);
  assert.match(css, /\.portrait-card__name\s*\{[\s\S]*font-family:\s*var\(--script\)/);
  assert.match(css, /\.portrait-card__media > img\s*\{[\s\S]*object-fit:\s*contain[\s\S]*scale:\s*1\.08/);
  assert.match(css, /\.portrait-card\.is-drive-framed\s*\{[\s\S]*aspect-ratio:\s*1150 \/ 1368/);
  assert.match(css, /\.portrait-card\.is-drive-framed \.portrait-card__media\s*\{[\s\S]*width:\s*86%[\s\S]*height:\s*74%[\s\S]*rotate:\s*-1\.55deg/);
  assert.match(css, /\.portrait-card\.is-drive-framed \.portrait-card__media > img\s*\{[\s\S]*object-fit:\s*cover[\s\S]*object-position:\s*center 18%[\s\S]*scale:\s*1\.03/);
  assert.match(css, /\.portrait-card__drive-tape\s*\{[\s\S]*width:\s*32%/);
  assert.doesNotMatch(css, /\.portrait-card::before|\.portrait-card::after/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
