import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "static/css/main.css"), "utf8");
const headScript = readFileSync(resolve(root, "static/js/head.js"), "utf8");
const mainScript = readFileSync(resolve(root, "static/js/main.js"), "utf8");

test("landing page contains the Canva page 1 copy", () => {
    for (const copy of [
        "Graphic",
        "Artist",
        "Marketing Management",
        "Visual Artist",
        "Creative Works &amp; Visual Journey",
        "2026",
        "Artist Portfolio",
        "(01)"
    ]) {
        assert.match(html, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
});

test("all runtime resources are local and present", () => {
    const resourcePattern = /(?:src|href)="([^"]+)"/g;
    const resources = [...html.matchAll(resourcePattern)].map((match) => match[1]);

    for (const resource of resources) {
        if (resource.startsWith("#")) continue;
        assert.doesNotMatch(resource, /^(?:https?:)?\/\//i);
        assert.ok(existsSync(resolve(root, resource)), `Missing local resource: ${resource}`);
    }

    for (const source of [html, css, headScript, mainScript]) {
        assert.doesNotMatch(source, /(?:https?:)?\/\/(?:cdn|unpkg|jsdelivr|cdnjs|fonts\.googleapis)/i);
    }
});

test("landing page has security and accessibility basics", () => {
    assert.match(html, /Content-Security-Policy/);
    assert.match(html, /class="skip-link"/);
    assert.match(html, /<main[^>]+id="landing"/);
    assert.match(html, /alt="Carlos Capin wearing a cream embroidered barong"/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("Canva desktop coordinates and required media are retained", () => {
    assert.match(css, /top:\s*22\.7935vh/);
    assert.match(css, /left:\s*52\.5543vw/);
    assert.ok(existsSync(resolve(root, "static/media/images/landing/gallery-background.png")));
    assert.ok(existsSync(resolve(root, "static/media/images/landing/carlos-capin-portrait.png")));
});
