# Carlos Capin Portfolio

Static portfolio website based on Carlos Capin's Canva presentation. The current implementation covers page 1 as the landing page and is compatible with GitHub Pages.

## Structure

```text
.
|-- index.html
|-- pages/                         # Additional portfolio pages
`-- static/
    |-- css/                       # Local styles
    |-- fonts/                     # Local fonts and licenses
    |-- js/                        # Local JavaScript
    `-- media/images/landing/      # Landing-page media
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
