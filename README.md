# Jayden Monson

Portfolio site, published with GitHub Pages at [https://jaydenmonson-art.github.io/](https://jaydenmonson-art.github.io/).

## Layout

- **Repository root** is the built site. GitHub Pages serves `main` from `/`, so `index.html` and `.nojekyll` stay at the top level. Do not delete `.nojekyll`; it stops Jekyll from processing the site.
- **`source/`** is the editable project (Vite). Page copy lives in `source/data/site.json` and `source/data/projects.json`. HTML files are generated; edit the JSON, not the HTML by hand. See `source/README.md` for how to run it and add projects.

`source/.github/workflows/pages.yml` is the project's Pages workflow, kept inside `source/` so it does not run. A workflow at the repository root (`.github/workflows/`) would rebuild on every push and overwrite this root deploy.

## Update the live site

From `source/`:

```bash
npm install
BASE_PATH=/ npm run build
```

`BASE_PATH` must be `/`. This is a user site served from the domain root. The Vite default (`./`) writes relative asset URLs that break the home page scripts.

Copy everything in `source/dist/` onto the repository root, replacing the previous build. Leave this README and the `source/` folder in place, keep `.nojekyll`, then commit and push to `main`.
