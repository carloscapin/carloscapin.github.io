import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("fresh Carlos landing contains the reference hierarchy and identity", async () => {
  const html = await read("index.html");
  assert.match(html, /Carlos Capin/);
  assert.match(html, /Graphic[\s\S]*Artist/i);
  assert.match(html, /Marketing Management/i);
  assert.match(html, /Driven and enthusiastic Business Administration graduate/);
  assert.doesNotMatch(html, /Jerome|Jirog/i);
  assert.match(html, /class="portrait-card is-portrait-loading"/);
  assert.match(html, /class="portrait-card__placeholder"[^>]*><\/div>/);
  assert.doesNotMatch(html, /carlos-portrait-placeholder\.svg/);
});

test("GitHub Pages uses only relative local site assets", async () => {
  const html = await read("index.html");
  assert.match(html, /static\/css\/main\.css/);
  assert.match(html, /static\/js\/drive-config\.js/);
  assert.match(html, /static\/js\/app\.js/);
  assert.doesNotMatch(html, /(?:src|href)=["'](?:[A-Za-z]:\\|\/Users\/)/);
});

test("hero typography self-hosts the display and discipline fonts", async () => {
  const [html, css, angelic, openSauce, openSauceLicense] = await Promise.all([
    read("index.html"),
    read("static/css/main.css"),
    stat(new URL("../static/media/fonts/AngelicBonquesSans-Regular.ttf", import.meta.url)),
    stat(new URL("../static/media/fonts/OpenSauceSans-SemiBold.ttf", import.meta.url)),
    read("static/media/fonts/OFL-OpenSauceSans.txt"),
  ]);
  assert.match(html, /static\/media\/fonts\/AngelicBonquesSans-Regular\.ttf/);
  assert.match(html, /static\/media\/fonts\/OpenSauceSans-SemiBold\.ttf/);
  assert.match(css, /@font-face\s*\{[\s\S]*font-family:\s*"Angelic Bonques Sans"[\s\S]*AngelicBonquesSans-Regular\.ttf/);
  assert.match(css, /@font-face\s*\{[\s\S]*font-family:\s*"Open Sauce Sans"[\s\S]*OpenSauceSans-SemiBold\.ttf/);
  assert.match(css, /\.hero__title\s*\{[\s\S]*font-family:\s*var\(--serif\)/);
  assert.match(css, /\.hero__discipline\s*\{[\s\S]*font-family:\s*"Open Sauce Sans"[\s\S]*font-weight:\s*600/);
  assert.ok(angelic.size > 15000);
  assert.ok(openSauce.size > 30000);
  assert.match(openSauceLicense, /SIL OPEN FONT LICENSE Version 1\.1/);
});

test("Drive configuration points to Carlos' supplied folder", async () => {
  const config = await read("static/js/drive-config.js");
  assert.match(config, /1hnMwacczNwuYDOuuzSN_KQjQlFAQ1JtB/);
  assert.match(config, /mediaApiUrl/);
  assert.doesNotMatch(config, /jerome|jirog/i);
});

test("the site renders only the polished Home and About sections", async () => {
  const html = await read("index.html");
  assert.equal((html.match(/<section\b/g) || []).length, 2);
  assert.match(html, /<section class="hero" id="home"/);
  assert.match(html, /<section class="about" id="about"/);
  assert.doesNotMatch(html, /id="(?:work|contact)"/);
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
  assert.match(app, /DOCK_TARGETS\s*=\s*Object\.freeze\(\{ Home: "#home", About: "#about" \}\)/);
  assert.match(app, /scheduleDockAutoCollapse/);
  assert.match(app, /addEventListener\("pointermove", scheduleDockAutoCollapse/);
  assert.match(app, /setDockMinimized/);
  assert.match(app, /function syncDockWithPage\(\)/);
  assert.match(app, /window\.addEventListener\("scroll", handlePageScroll/);
  assert.match(app, /setAttribute\("aria-pressed"/);
});

test("Drive catalog powers automatic Home and About media", async () => {
  const [html, css, app] = await Promise.all([
    read("index.html"),
    read("static/css/main.css"),
    read("static/js/app.js"),
  ]);
  assert.match(html, /id="portrait-frame"/);
  assert.match(html, /id="portrait-tape"/);
  assert.match(app, /belongsTo\(item, "landing", "background"\)/);
  assert.match(app, /belongsTo\(item, "landing", "portrait"\)/);
  assert.match(app, /belongsTo\(item, "landing", "frame"\)/);
  assert.match(app, /belongsTo\(item, "landing", "tape"\)/);
  assert.match(app, /belongsTo\(item, "about", "portrait"\)/);
  assert.match(app, /belongsTo\(item, "about", "background"\)/);
  assert.match(app, /belongsTo\(item, "portfolio", "portrait-photography"\)/);
  assert.match(app, /applyAboutMedia\(items\)/);
  assert.match(app, /aspectRatio >= 1\.6 \? "tape" : aspectRatio <= 1\.35 \? "frame"/);
  assert.match(css, /\.portrait-card__placeholder::after\s*\{[\s\S]*border-radius:\s*50%[\s\S]*radial-gradient/);
  assert.match(css, /\.portrait-card\.is-portrait-loading\s*\{[\s\S]*background:\s*transparent[\s\S]*box-shadow:\s*none/);
  assert.match(css, /\.portrait-card\.is-portrait-loading \.portrait-card__frame,[\s\S]*\.portrait-card\.is-portrait-loading figcaption\s*\{\s*display:\s*none !important/);
  assert.match(app, /function loadPortrait\(portrait, generation\)[\s\S]*elements\.portrait\.hidden = true;[\s\S]*elements\.portraitCard\.classList\.add\("is-portrait-loading"\)/);
  assert.match(app, /const portraitReady = loadPortrait\(portrait, generation\);\s*const decorationsReady = applyPortraitDecorations\(items, portrait, generation\);/);
  assert.match(app, /Promise\.all\(\[portraitReady, decorationsReady\]\)\.then\(\(\[portraitLoaded\]\) => \{[\s\S]*elements\.portrait\.hidden = false;[\s\S]*classList\.remove\("is-portrait-loading"\)/);
  assert.match(app, /setInterval\(loadDriveCatalog/);
  assert.doesNotMatch(app, /renderPortfolio|projectCategory|openMediaDialog|portfolio-grid/);
});

test("About page uses animated folder cards and the supplied profile copy", async () => {
  const [html, css] = await Promise.all([read("index.html"), read("static/css/main.css")]);
  assert.match(html, /<h2 class="about__title"[^>]*>About Me<\/h2>/);
  assert.equal((html.match(/class="folder-card /g) || []).length, 2);
  assert.match(html, /6 months of creative experience/i);
  assert.match(html, /Specialized in marketing poster &amp; video editing/i);
  assert.match(html, /commitment to delivering Impactful results/);
  assert.match(html, /id="about-portrait"/);
  assert.match(css, /\.about\s*\{[\s\S]*height:\s*100dvh[\s\S]*scroll-snap-align:\s*start/);
  assert.match(css, /\.folder-card::before,[\s\S]*\.folder-card::after/);
  assert.match(css, /\.folder-card:hover,[\s\S]*translateY\(-0\.7rem\)/);
  assert.match(css, /\.folder-card:focus-visible/);
});

test("Apps Script creates the required Drive structure and returns JSONP", async () => {
  const script = await read("google-apps-script/Code.gs");
  assert.match(script, /setupCarlosPortfolio/);
  assert.match(script, /01-landing/);
  assert.match(script, /03-frame/);
  assert.match(script, /04-tape/);
  assert.match(script, /03-about/);
  assert.match(script, /01-portrait/);
  assert.match(script, /02-background/);
  assert.match(script, /02-portfolio/);
  assert.match(script, /ANYONE_WITH_LINK/);
  assert.match(script, /callback \? `\$\{callback\}\(\$\{serialized\}\);`/);
  const recoveryFunction = script.match(/function recoverCarlosAssetsToRoot\(\)\s*\{[\s\S]*?\n\}/)?.[0] || "";
  assert.match(recoveryFunction, /source\.makeCopy\(source\.getName\(\), root\)/);
  assert.doesNotMatch(recoveryFunction, /\.moveTo\(|\.setTrashed\(/);
});

test("landing remains edge-to-edge and responsive", async () => {
  const [html, css] = await Promise.all([read("index.html"), read("static/css/main.css")]);
  assert.match(css, /height:\s*100svh/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /html\s*\{[\s\S]*overflow-y:\s*auto[\s\S]*scroll-snap-type:\s*y mandatory/);
  assert.match(css, /body\s*\{[\s\S]*overflow-x:\s*hidden[\s\S]*overflow-y:\s*visible/);
  assert.match(css, /\.hero\s*\{[\s\S]*min-height:\s*0[\s\S]*overflow:\s*hidden/);
  assert.match(css, /\.hero\s*\{[\s\S]*scroll-snap-align:\s*start[\s\S]*scroll-snap-stop:\s*always/);
  assert.doesNotMatch(css, /\.hero\s*\{[^}]*min-height:\s*(?:32|38|40)rem/);
  assert.match(html, /<svg[\s\S]*class="hero__folder"[\s\S]*<path d="[^"]*Q[^"]*"/);
  assert.doesNotMatch(html, /class="hero__folio"/);
  assert.match(css, /\.hero__folder path\s*\{[\s\S]*fill:\s*#fbfbfa/);
  assert.match(css, /\.hero__folder\s*\{[\s\S]*width:\s*min\(43vw, 31rem\)[\s\S]*height:\s*clamp\(8\.2rem, 18vh, 11rem\)/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.hero__folder\s*\{[\s\S]*width:\s*56vw[\s\S]*height:\s*7rem/);
  assert.doesNotMatch(css, /\.hero__folder::before/);
  assert.doesNotMatch(css.match(/\.hero__folder\s*\{[\s\S]*?\n\}/)?.[0] || "", /clip-path:\s*polygon/);
  assert.match(css, /\.hero__drive-background\s*\{[\s\S]*background-size:\s*100% 100%[\s\S]*filter:\s*none/);
  assert.match(css, /\.hero__copy\s*\{[\s\S]*right:\s*calc\(45% \+ clamp\(0\.65rem, 1vw, 1\.25rem\)\)[\s\S]*left:\s*auto/);
  assert.match(css, /\.portrait-card\s*\{[\s\S]*right:\s*auto[\s\S]*left:\s*calc\(55% \+ clamp\(0\.65rem, 1vw, 1\.25rem\)\)/);
  assert.match(css, /@media \(max-width: 960px\)[\s\S]*\.hero__copy\s*\{[\s\S]*right:\s*auto[\s\S]*left:\s*clamp\(1\.25rem, 2vw, 2\.4rem\)/);
  assert.match(css, /\.hero__title\s*\{[\s\S]*font-family:\s*var\(--serif\)/);
  assert.match(html, /class="portrait-card__name">Carlos Capin<\/span>\s*<span class="portrait-card__label">Artist Portfolio/);
  assert.match(css, /\.portrait-card__name\s*\{[\s\S]*font-family:\s*var\(--script\)/);
  assert.match(css, /\.portrait-card__media > img\s*\{[\s\S]*object-fit:\s*contain[\s\S]*scale:\s*1\.08/);
  assert.match(css, /\.portrait-card\.is-drive-framed\s*\{[\s\S]*aspect-ratio:\s*1150 \/ 1368/);
  assert.match(css, /\.portrait-card\.is-drive-framed \.portrait-card__media\s*\{[\s\S]*width:\s*86%[\s\S]*height:\s*74%[\s\S]*rotate:\s*-1\.55deg/);
  assert.match(css, /\.portrait-card\.is-drive-framed \.portrait-card__media > img\s*\{[\s\S]*object-fit:\s*cover[\s\S]*object-position:\s*center 18%[\s\S]*scale:\s*1\.03/);
  assert.match(css, /\.portrait-card\.is-drive-framed figcaption\s*\{[\s\S]*rotate:\s*-1\.55deg[\s\S]*transform-origin:\s*center/);
  assert.match(css, /\.portrait-card__drive-tape\s*\{[\s\S]*width:\s*32%/);
  assert.match(html, /<div class="portrait-card__swing">[\s\S]*id="portrait-frame"[\s\S]*<\/figcaption>\s*<\/div>\s*<img class="portrait-card__drive-tape"/);
  assert.match(css, /\.portrait-card\.is-drive-framed \.portrait-card__swing\s*\{[\s\S]*transform-origin:\s*50% 3%[\s\S]*animation:\s*portrait-breeze 8\.8s/);
  assert.match(css, /@keyframes portrait-breeze\s*\{[\s\S]*rotateY\([^)]+\)[\s\S]*rotateZ\([^)]+\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.portrait-card\.is-drive-framed \.portrait-card__swing\s*\{[\s\S]*animation:\s*none !important/);
  assert.doesNotMatch(css, /\.portrait-card::before|\.portrait-card::after/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
