# Jayden Monson

A static portfolio for Jayden Monson, operations lead at Painter1 Franchise, built so the format can be reviewed before real projects replace the stand-ins.

Experience designer and operations leader: stories turned into spaces people move through. The pages are Home, Work, a project detail template, About, Resume, and Contact.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4721](http://127.0.0.1:4721).

The dev server rebuilds the HTML when you save `data/site.json` or `data/projects.json`.

To produce the folder you can host anywhere:

```bash
npm run build
npm run preview
```

Upload the `dist/` folder to Netlify, Cloudflare Pages, GitHub Pages, or any static host. There is no server, database, or form backend. Asset paths are relative, so the folder can live at a domain root or a subpath.

## Where the words live

| Edit this | It updates |
| --- | --- |
| `data/site.json` | Name, positioning line, bio, skills, resume roles, email, LinkedIn, footer note |
| `data/projects.json` | Every project card and detail page |
| `src/styles.css` | Layout, type, and the single accent color (`--accent`) |
| `public/` | Images, headshot, resume PDF, favicon |

LinkedIn is already set to https://www.linkedin.com/in/jayden-monson/ and shows in the header, footer, and contact page. The headshot is `public/images/portrait.jpg` (path `portrait` in `data/site.json`). The Download resume control is marked “PDF to come”; drop the file in as `public/jayden-monson-resume.pdf` when you have it.

Do not edit the HTML files by hand. They are generated from the JSON.

## Add a project

Add an object to the array in `data/projects.json`:

```json
{
  "slug": "new-project",
  "title": "Project title",
  "category": "Exhibit",
  "year": "20XX",
  "summary": "Placeholder. One sentence for the card.",
  "overview": "Placeholder. Two or three sentences for the story.",
  "role": "Placeholder. Your role on the project.",
  "challenge": "Placeholder. What was difficult.",
  "approach": "Placeholder. What you decided and made.",
  "outcome": "Placeholder. What changed."
}
```

Rules:

- `slug` is the page address (`projects/new-project.html`). Use lowercase letters, numbers, and hyphens. It must be unique.
- `category` should be one of: Exhibit, Immersive, Interactive, Illustration, Operations/CX, Concept. Any other short label still works; those six are the ones the placeholder drawings know how to illustrate.
- Save the file. With `npm run dev` running, the new card and page appear on refresh.

Missing images are filled with labeled placeholder drawings the first time the site renders. To redraw every stand-in image (this overwrites existing SVGs and the placeholder PDF):

```bash
npm run placeholders
```

## Replace images

By default a project uses these files:

```
public/images/<slug>/cover.svg       card and home grid, 4:3
public/images/<slug>/hero.svg        top of the detail page, 16:9
public/images/<slug>/site-plan.svg   guest flow / site plan, 16:10
public/images/<slug>/sketch-1.svg    process sketch, square
public/images/<slug>/sketch-2.svg
public/images/<slug>/sketch-3.svg
```

JPG, PNG, WebP, or SVG all work. Suggested sizes: cover 1600×1200, hero 1920×1080, site plan 1600×1000, sketches 1200×1200. Keep the same filename, or point the project at new files:

```json
"images": {
  "cover": "images/new-project/cover.jpg",
  "hero": "images/new-project/hero.jpg",
  "sitePlan": "images/new-project/plan.jpg",
  "sketches": [
    "images/new-project/sketch-1.jpg",
    "images/new-project/sketch-2.jpg",
    "images/new-project/sketch-3.jpg"
  ]
}
```

Paths are relative to `public/`. Do not start them with `/` and do not use `..`.

Other image slots:

- Headshot: `public/images/portrait.jpg` (path is `portrait` in `data/site.json`)
- Resume: replace `public/jayden-monson-resume.pdf`, or change `resumeFile` in `data/site.json` and put the new PDF in `public/`
- Favicon: `public/favicon.svg`

## A model image that is not ready yet

The kids-area project keeps an empty slot labeled “Model image coming soon.” Add `public/images/jurassic-hall-kids-area/model.jpg` and refresh. The page swaps the slot for that file.

## Design studies

Set `"study": true` and `"card": "compact"` when the images are someone else’s work. The page labels them as reference material. Write captions as “Concept documentation studied: …”, and do not describe those drawings as Jayden’s.

## What to swap before publishing

- Positioning line, shift line, bio, and footer note in `data/site.json`
- Real email and LinkedIn URL
- Resume PDF and the three role entries
- Portrait
- Each project’s title, year, summary, overview, role, challenge, approach, and outcome
- Cover, hero, guest-flow plan, and three process images per project
- The accent color in `src/styles.css` if burnt sienna is not the one you want
