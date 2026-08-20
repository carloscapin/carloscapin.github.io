# Carlos Capin Portfolio

Static GitHub Pages portfolio based on page 1 of Carlos Capin's Canva presentation. The landing cover is rebuilt as responsive HTML/CSS layers instead of being displayed as one flattened page image.

## Structure

```text
.
|-- index.html
|-- pages/                              # Additional portfolio pages
|-- static/
|   |-- css/                            # Local styles
|   `-- media/
|       |-- fonts/                      # Locally served fonts
|       `-- images/landing/
|           |-- elements/               # Separate Canva visual layers
|           `-- canva-page-01.png       # Exact portrait source/reference
`-- tests/                              # Static integrity checks
```

Every runtime resource is local. The published site does not require Canva, a CDN, a JavaScript framework, or a build server.

## Local preview

From this directory, run:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173/`.

## Design source

[Black and White Modern Artist Portfolio Presentation](https://www.canva.com/design/DAHGXAA09qY/6hyC2sDbmP7snBs9OJfeAQ/edit)
