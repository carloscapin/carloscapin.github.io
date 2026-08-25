# Carlos Capin Portfolio

A fresh, static GitHub Pages portfolio for Carlos. The landing page follows the supplied editorial collage reference, while the gallery reads its images and videos from one Google Drive folder.

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

Any new folder placed directly under `02-portfolio` automatically becomes a filter/category. Prefix filenames with `01-`, `02-`, and so on when a specific display order is needed.

After the one-time connection, routine updates happen only in Drive:

- Upload a file to add it.
- Delete a file to remove it.
- Replace a file or upload a new version to update it.
- Move a file between category folders to recategorize it.

The page checks for changes every five minutes. The Apps Script catalog has a one-minute cache.

## Drive connection

The target folder `1hnMwacczNwuYDOuuzSN_KQjQlFAQ1JtB` and the **Carlos Portfolio Media API** Apps Script project are already connected. The initial 23 assets were organized into the folders above and the stable Web App endpoint is configured in `static/js/drive-config.js`.

The project is linked locally through `.clasp.json`. In VS Code, use **Run and Debug** or **Terminal > Run Task** for these actions:

- `Carlos Apps Script: Open Project`
- `Carlos Apps Script: Push Code`
- `Carlos Apps Script: Deploy Web App`
- `Carlos Apps Script: Push + Deploy`

Add Carlos' real email to `contactEmail` in the same config file when it is available; the page intentionally shows a disabled contact prompt instead of publishing a guessed address.

No Google API key or OAuth secret is committed to the website. The `/exec` endpoint exposes only metadata for files within Carlos' configured portfolio folder.

## Local verification

```powershell
npm.cmd test
python -m http.server 4173
```

Then open `http://localhost:4173`. The site is plain HTML, CSS, and JavaScript, so GitHub Pages can publish it without a build step.
