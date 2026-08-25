# Carlos Capin Portfolio

A fresh, static GitHub Pages portfolio for Carlos. The current first phase contains one full-viewport hero only, following the supplied editorial collage reference. Its background and portrait load automatically from Google Drive. The hero preserves the full Drive background composition, a compact Polaroid scale, a less-cropped portrait treatment, reference-matched Didot/handwritten typography, and the lower-left office-folder silhouette.

A fixed lower-center icon dock previews the future portfolio navigation. Its six transparent buttons change icon color only on hover or selection, with compact pointed tooltips and no separators. The dock automatically collapses after six seconds without interaction. Its manual minimize control appears only after a scroll gesture, while the compact restore control uses a periodic sideways, tilted shake.

## Media folders

`setupCarlosPortfolio()` has already created this structure inside the supplied Drive folder:

```text
Carlos media root
|-- 01-landing
|   |-- 01-background       # first image becomes the landing backdrop
|   `-- 02-portrait         # first image becomes Carlos' Polaroid portrait
`-- 02-portfolio
    |-- 01-graphic-design
    |-- 02-marketing-campaigns
    |-- 03-visual-storytelling
    |-- 04-portrait-photography
    |-- 05-video
    `-- 06-other
```

Only the two `01-landing` folders are rendered during the hero-polishing phase. The organized `02-portfolio` folders remain ready for later sections but are intentionally not displayed yet. Prefix filenames with `01-`, `02-`, and so on when a specific order is needed.

Hero media updates happen only in Drive:

- Upload a file to add it.
- Delete a file to remove it.
- Replace a file or upload a new version to update it.
- Keep the active backdrop in `01-landing/01-background`.
- Keep the active Carlos portrait in `01-landing/02-portrait`.

The page checks for changes every five minutes. The Apps Script catalog has a one-minute cache.

## Drive connection

The target folder `1hnMwacczNwuYDOuuzSN_KQjQlFAQ1JtB` and the **Carlos Portfolio Media API** Apps Script project are already connected. The initial 23 assets were organized into the folders above and the stable Web App endpoint is configured in `static/js/drive-config.js`.

The project is linked locally through `.clasp.json`. In VS Code, use **Run and Debug** or **Terminal > Run Task** for these actions:

- `Carlos Apps Script: Open Project`
- `Carlos Apps Script: Push Code`
- `Carlos Apps Script: Deploy Web App`
- `Carlos Apps Script: Push + Deploy`

No Google API key or OAuth secret is committed to the website. The `/exec` endpoint exposes only metadata for files within Carlos' configured portfolio folder.

## Local verification

```powershell
npm.cmd test
python -m http.server 4173
```

Then open `http://localhost:4173`. The site is plain HTML, CSS, and JavaScript, so GitHub Pages can publish it without a build step.
