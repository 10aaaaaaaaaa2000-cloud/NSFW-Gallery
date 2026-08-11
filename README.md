# Image Gallery

A static site that automatically displays every image found inside any
`.zip` archive(s) placed in the `content/` folder — as a scrollable grid
of cards, each with a one-click download button.

## How it works

1. Drop one or more `.zip` files (any filename) into `content/`. Each zip
   can contain any number of images (`.png`, `.jpg`, `.jpeg`, `.gif`,
   `.webp`, `.bmp`, `.svg`), in subfolders or not.
2. On every build, `generate-content-list.js` scans `content/` and writes
   `content-list.js` — a manifest listing every archive found.
3. In the browser, `app.js` fetches each archive, unzips it on the fly
   using [JSZip](https://stuk.github.io/jszip/), and renders every image
   as a card.
4. No backend, no database — everything happens in the browser after a
   static build step generates the manifest.

## Local preview

```bash
npm run build   # scans content/ and writes content-list.js
npx serve .     # or any static file server
```

(You need a local server, not just opening `index.html` directly, since
the browser needs to `fetch()` the manifest and zip files.)

## Deploying with Vercel

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the GitHub repo.
3. Vercel auto-detects `vercel.json`, which runs `npm run build`
   (regenerating `content-list.js` from whatever is in `content/`) and
   serves the folder as a static site. No other configuration needed.
4. To update the gallery later: add/remove `.zip` files in `content/`,
   commit, push — Vercel redeploys and regenerates the manifest
   automatically.

## Adding scroll-to-top / scroll-to-bottom

Already included — two floating round buttons in the bottom-right corner
of the page.

## Notes

- Archive filenames can be anything — only the `.zip` extension matters.
- Non-image files inside a zip are ignored automatically.
- Large zip files are unzipped fully in the visitor's browser, so very
  large archives (100+ MB) may be slow on first load.
