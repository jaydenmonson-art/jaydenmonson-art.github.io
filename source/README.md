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
| `public/` | Images, headshot, favicon |

LinkedIn is already set to https://www.linkedin.com/in/jayden-monson/ and shows in the header, footer, contact page, and resume. The headshot is `public/images/portrait.jpg` (path `portrait` in `data/site.json`). The resume page is the timeline in `data/site.json`. Do not put a phone number on the site.

Do not edit the HTML files by hand. They are generated from the JSON.

## Add a project

Add an object to the array in `data/projects.json`:

```json
{
  "slug": "new-project",
  "title": "Project title",
  "category": "Exhibit",
  "year": "20XX",
  "summary": "One sentence for the card, in first person.",
  "overview": "Two or three sentences for the story, in first person.",
  "role": "What I did.",
  "challenge": "What was difficult.",
  "approach": "What I decided and made.",
  "outcome": "What changed."
}
```

Rules:

- `slug` is the page address (`projects/new-project.html`). Use lowercase letters, numbers, and hyphens. It must be unique.
- `category` should be a short label such as Exhibit, Immersive, Interactive, Illustration, Operations/CX, or Concept.
- Save the file. With `npm run dev` running, the new card and page appear on refresh.

Missing images for a project that is still marked as a stand-in are filled with labeled drawings the first time the site renders. To redraw those drawings:

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
- Favicon: `public/favicon.svg`

The resume lives in `data/site.json` (`roles`, `education`, `skillGroups`). There is no resume PDF on the site.

## Design studies

Set `"study": true` and `"card": "compact"` when the images are someone else’s work. The page labels them as reference material. Write captions as “Concept documentation studied: …”, and do not describe those drawings as mine.

## What to swap before publishing

- Positioning line, shift line, and bio in `data/site.json`
- Email and LinkedIn URL
- Roles, education, and skill groups in `data/site.json`
- Portrait
- Each project’s title, summary, overview, role, and outcome
- Cover, hero, and project images
