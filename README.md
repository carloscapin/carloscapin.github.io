# Carlos Capin Portfolio

Static portfolio website based on Carlos Capin's Canva presentation. The current implementation uses the exact page 1 render downloaded through the Canva integration, preserving the original face, typography, spacing, imagery, and composition.

## Structure

```text
.
|-- index.html
|-- pages/                         # Additional portfolio pages
|-- static/
|   |-- css/                       # Local styles
|   `-- media/images/landing/      # Canva landing-page render
`-- tests/                         # Static integrity checks
```

All runtime assets are local. The page does not load CSS, JavaScript, fonts, or frameworks from a CDN.

## Local preview

From this directory, run:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173/`.

## Design source

[Black and White Modern Artist Portfolio Presentation](https://www.canva.com/design/DAHGXAA09qY/6hyC2sDbmP7snBs9OJfeAQ/edit)
