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

test("bottom icon dock changes icon color and supports a shaking minimized state", async () => {
  const [html, css, app] = await Promise.all([
    read("index.html"),
    read("static/css/main.css"),
    read("static/js/app.js"),
  ]);
  assert.equal((html.match(/class="icon-dock__item"/g) || []).length, 6);
  assert.match(html, /id="icon-dock-minimize"/);
  assert.match(html, /id="icon-dock-restore"/);
  assert.match(css, /\.icon-dock\s*\{[\s\S]*position:\s*fixed[\s\S]*bottom:/);
  assert.match(css, /\.icon-dock__item\s*\{[\s\S]*background:\s*transparent/);
  assert.match(css, /\.icon-dock__item\[aria-pressed="true"\][\s\S]*color:\s*var\(--acid\)/);
  assert.match(css, /@keyframes dock-shake/);
  assert.match(css, /\.icon-dock__restore\.is-visible[\s\S]*animation:\s*dock-shake/);
  assert.match(app, /setDockMinimized/);
  assert.match(app, /setAttribute\("aria-pressed"/);
});

test("Drive catalog is limited to automatic hero media", async () => {
  const app = await read("static/js/app.js");
  assert.match(app, /belongsTo\(item, "landing", "background"\)/);
  assert.match(app, /belongsTo\(item, "landing", "portrait"\)/);
  assert.match(app, /setInterval\(loadDriveCatalog/);
  assert.doesNotMatch(app, /renderPortfolio|projectCategory|openMediaDialog|portfolio-grid/);
});

test("Apps Script creates the required Drive structure and returns JSONP", async () => {
  const script = await read("google-apps-script/Code.gs");
  assert.match(script, /setupCarlosPortfolio/);
  assert.match(script, /01-landing/);
  assert.match(script, /02-portfolio/);
  assert.match(script, /ANYONE_WITH_LINK/);
  assert.match(script, /callback \? `\$\{callback\}\(\$\{serialized\}\);`/);
});

test("landing remains edge-to-edge and responsive", async () => {
  const css = await read("static/css/main.css");
  assert.match(css, /height:\s*100svh/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
