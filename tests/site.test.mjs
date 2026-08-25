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

test("gallery is folder-driven and supports image and video previews", async () => {
  const app = await read("static/js/app.js");
  assert.match(app, /belongsTo\(item, "portfolio"\)/);
  assert.match(app, /projectCategory/);
  assert.match(app, /startsWith\("video\/"\)/);
  assert.match(app, /drive\.google\.com\/file\/d\/\$\{encodeURIComponent\(item\.id\)\}\/preview/);
  assert.match(app, /setInterval\(loadDriveCatalog/);
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
  assert.match(css, /min-height:\s*100svh/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
