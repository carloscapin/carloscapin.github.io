import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "static/css/main.css"), "utf8");

const landingAssets = [
    "static/media/images/landing/elements/gallery-exhibit-background.jpg",
    "static/media/images/landing/elements/purple-folder.png",
    "static/media/images/landing/elements/framed-art-gallery.jpg",
    "static/media/images/landing/elements/polaroid-frame.png",
    "static/media/images/landing/elements/paper-tape.png",
    "static/media/images/landing/canva-page-01.png"
];

test("page 1 is composed from independently positioned layers", () => {
    for (const className of [
        "layer--page-background",
        "layer--folder-top",
        "layer--gallery",
        "layer--folder-bottom",
        "portrait-window",
        "layer--polaroid",
        "layer--tape",
        "copy--graphic",
        "copy--artist",
        "copy--marketing",
        "copy--signature"
    ]) {
        assert.match(html, new RegExp(className));
    }

    assert.doesNotMatch(html, /landing__artwork/);
    assert.match(css, /top:\s*-40\.8471%/);
    assert.match(css, /left:\s*39\.6844%/);
    assert.match(css, /top:\s*80\.4582%/);
    assert.match(css, /left:\s*52\.5543%/);
});

test("portfolio fills the complete browser viewport without an outer border", () => {
    assert.match(css, /\.landing\s*\{[\s\S]*?padding:\s*0;/);
    assert.match(css, /\.portfolio-canvas\s*\{[\s\S]*?width:\s*100vw;/);
    assert.match(css, /\.portfolio-canvas\s*\{[\s\S]*?height:\s*100svh;/);
    assert.doesNotMatch(css, /background:\s*#f1f3f4/);
});

test("all Canva-derived media and fonts are local", () => {
    for (const resource of landingAssets) {
        assert.match(html, new RegExp(resource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        assert.ok(existsSync(resolve(root, resource)), `Missing local resource: ${resource}`);
    }

    for (const font of [
        "static/media/fonts/bodoni-moda-400.woff2",
        "static/media/fonts/barlow-condensed-700.woff2",
        "static/media/fonts/caveat-500.woff2"
    ]) {
        assert.ok(existsSync(resolve(root, font)), `Missing local font: ${font}`);
    }

    assert.doesNotMatch(html + css, /(?:https?:)?\/\/(?:cdn|unpkg|jsdelivr|cdnjs|fonts\.googleapis)/i);
    assert.doesNotMatch(html, /<script\b/i);
});

test("the exact approved Carlos portrait render remains the portrait source", () => {
    const canvaPagePath = resolve(root, "static/media/images/landing/canva-page-01.png");
    const png = readFileSync(canvaPagePath);

    assert.equal(png.toString("ascii", 1, 4), "PNG");
    assert.equal(png.readUInt32BE(16), 600);
    assert.equal(png.readUInt32BE(20), 337);
    assert.match(html, /class="portrait-source"[\s\S]*canva-page-01\.png/);
});

test("visible and accessible copy matches Canva page 1", () => {
    for (const copy of [
        "Visual Artist",
        "Creative Works &amp; Visual Journey",
        "Graphic",
        "Artist",
        "Marketing Management",
        "2026",
        "Artist Portfolio",
        "(01)"
    ]) {
        assert.match(html, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }

    assert.match(html, /aria-label="Portrait of Carlos Capin"/);
    assert.match(html, /Content-Security-Policy/);
});
