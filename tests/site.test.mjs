import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "static/css/main.css"), "utf8");
const canvaPagePath = resolve(root, "static/media/images/landing/canva-page-01.png");

test("landing page uses the exact downloaded Canva render", () => {
    assert.match(html, /src="static\/media\/images\/landing\/canva-page-01\.png"/);
    assert.ok(existsSync(canvaPagePath));

    const png = readFileSync(canvaPagePath);
    assert.equal(png.toString("ascii", 1, 4), "PNG");
    assert.equal(png.readUInt32BE(16), 600);
    assert.equal(png.readUInt32BE(20), 337);
});

test("all visible runtime resources are local and present", () => {
    const resourcePattern = /(?:src|href)="([^"]+)"/g;
    const resources = [...html.matchAll(resourcePattern)].map((match) => match[1]);

    for (const resource of resources) {
        assert.doesNotMatch(resource, /^(?:https?:)?\/\//i);
        assert.ok(existsSync(resolve(root, resource)), `Missing local resource: ${resource}`);
    }

    assert.doesNotMatch(html + css, /(?:https?:)?\/\/(?:cdn|unpkg|jsdelivr|cdnjs|fonts\.googleapis)/i);
});

test("accessible text preserves the Canva page 1 content", () => {
    for (const copy of [
        "Visual Artist",
        "Creative Works &amp; Visual Journey",
        "Graphic Artist",
        "Marketing Management",
        "2026",
        "Artist Portfolio",
        "Page 1"
    ]) {
        assert.match(html, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
});

test("the exported Canva composition stays uncropped", () => {
    assert.match(css, /object-fit:\s*contain/);
    assert.match(html, /Content-Security-Policy/);
    assert.doesNotMatch(html, /<script\b/i);
});
