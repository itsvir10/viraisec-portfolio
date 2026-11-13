# Developing the site

Technical notes: running it, writing articles, and how each part works.
React + Vite + TypeScript, Three.js through react-three-fiber, GSAP ScrollTrigger, Lenis
smooth scroll, Framer Motion, Tailwind CSS, React Router and Markdown articles.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Writing an article

Articles are Markdown files in `src/articles/`. There is no admin panel and no backend.

1. Copy `src/articles/_template.md` and rename it, for example `my-new-article.md`.
   The file name becomes the link: `/articles/my-new-article`.
2. Fill in the block at the top of the file:

   ```
   ---
   title: Your article title
   date: 2026-01-31
   summary: One or two sentences shown on the card and under the title.
   tags: [Tag one, Tag two]
   field: security
   ---
   ```

   - `date` is `YYYY-MM-DD`. Newest articles show first.
   - `field` is `security` or `ai`. It sets the colour (cyan or violet) and the filter.
   - `repo` is the project's GitHub link. It shows as a button on the article and in
     the terminal's `read` command.
   - `draft: true` hides an article until you delete that line.
3. Write the article in Markdown underneath. The format is short on purpose: a
   summary, what you learned, and a link to the repo for the full steps.
   `<!-- comments -->` are notes to yourself and never show on the site.
4. Rebuild and deploy (see Deploy below), and the article is live.

The homepage strip shows the newest five. The article also appears in the terminal
(`articles`, then `read my-new-article`) and becomes a ringed, clickable node on the
3D graph in the hero (up to six), with no extra work.

The three articles in the folder have drafted "What I learned" sections (marked with a
comment at the top of each file). Rewrite those in your own words, and set each `date`
to when you actually publish. The job-search agent article links to your GitHub
profile until that project has its own repo.

## Change the other content

All other text lives in `src/data/content.ts`: name, tagline, about, skills, certs,
the boot lines and the command burst. Edit that file and the page and the terminal
commands update together.

## Where things are

```
src/
  articles/                Markdown articles (+ _template.md)
  data/content.ts          all other site text
  pages/                   Home, ArticlesPage (list + filter), ArticlePage
  sections/                Hero, About, Skills, Articles, Certs, Terminal, Contact
  components/
    BootSequence.tsx       the opening boot and command burst
    TerminalShell.tsx      the terminal itself and all its commands
    TerminalMode.tsx       full-screen terminal mode
    Markdown.tsx           article renderer
    NodeLayer.tsx          clickable article nodes over the 3D graph
    BreachGame.tsx         the Contain the breach game
    three/                 the 3D scene
      keyframes.ts         how the graph looks per section (edit to re-choreograph)
      Graph.tsx            the network / neural graph, pulses, rings, opening shot
      Tunnel.tsx           the fly-through tunnel
      Horizon.tsx          the glowing floor
      CursorNode.tsx       node that follows the cursor and links to nearby stars
      Stars.tsx            background particles
      Scene.tsx            canvas, post-processing, performance fallback
  hooks/, lib/             scroll, pointer, article loading and media helpers
```

## How the site opens

The site always opens in the graphical version. The first time in a browser session,
a short terminal boot plays: a few boot lines, then security and AI commands scrolling
past faster and faster, then the terminal dissolves while the 3D graph assembles
behind it (`BootSequence.tsx`). Any key or click skips it, and `prefers-reduced-motion`
skips it entirely. The `>_` button in the nav and the `terminal` command switch to the
full-screen terminal; the `gui` command switches back. That choice is remembered for
the session.

## How the 3D follows the scroll

`keyframes.ts` holds one pose per section: position, depth, size, whether the graph is
one sphere or split into its cyan (security) and violet (AI) clusters, how loose the
nodes are, pulse speed, brightness and how visible the glowing floor is. Each frame the
Director in `Scene.tsx` works out which section is on screen, blends between the two
nearest poses and eases toward the result. Everything in the scene reads that one pose.

## The cinematic parts

- **Opening shot:** when the graphical site opens, the nodes fly in from the dark, then
  the links and signal pulses switch on and the headline lands (`Graph.tsx`, `intro`).
- **Fly-throughs:** going into Articles, Terminal and Contact, the graph fades out and
  the camera travels down a tunnel of nodes, cyan wall left and violet wall right, with
  a wider lens and a little roll (`Tunnel.tsx`, and `FLY_INTO` in `keyframes.ts` picks
  which sections get one). It is tied to the scroll, so scrolling back flies in reverse.
- **Pinned About scene:** on desktop the section holds still while the sphere tears
  into its two clusters and each paragraph arrives with its cluster (`About.tsx`).
  One cyan node raises a warm alert with ripples every few seconds, and signals in the
  violet cluster only travel forward through its layers.
- **Articles film strip:** on desktop the section holds still and scrolling slides the
  cards sideways (`Articles.tsx`).
- **Depth:** a glowing floor that runs to the horizon (`Horizon.tsx`), soft out-of-focus
  specks near the lens, fog, bloom and vignette.

Phones and `prefers-reduced-motion` get the plain versions: no pinning, no tunnel.

## The clickable network

- **Drag** the empty part of the hero with a mouse to spin the graph. It coasts, then
  rights itself.
- **Ringed nodes** are your articles. Hover or click one for a card with a link to the
  article. They are real buttons, so they work with touch and the keyboard, and the
  graph holds still while a card is open (`NodeLayer.tsx`).
- **Other nodes** show a small made-up readout on hover: an address and port on cyan
  nodes, a layer and neuron on violet ones.

## Contain the breach

A 30-second game in `BreachGame.tsx`. An infection spreads one machine per tick toward
the core. Click a clean machine to firewall it (six firewalls). The AI advisor marks
the machine it predicts is next and is right about 70% of the time; firewall the real
next target and that tick is blocked. Hold out until the patch deploys. Open it with the
"Play the game" button in the Terminal section or `play breach` in either terminal.
The numbers to tune are at the top of the file (`TICKS`, `WALLS`) and in the reducer.

## Performance and accessibility

- The 3D scene, the article pages and the Markdown renderer are code-split.
- Phones get a smaller graph, fewer particles, no post-processing and no custom cursor.
- If the frame rate drops on desktop, post-processing switches off automatically.
  Add `?hq` to the URL to force full quality while testing.
- `prefers-reduced-motion` skips the boot sequence, smooth scrolling, the cursor and idle motion.
- Terminal mode has no 3D at all, and works with a keyboard and a screen reader.

## Deploy

The live site is on Cloudflare Pages (project `viraisec`), with the `viraisec.com` domain
from Cloudflare Registrar attached under the project's Custom domains.

To update it by hand: run `npm run build`, then in the Cloudflare dashboard open
Workers & Pages, then `viraisec`, then Create deployment, and upload the contents of `dist/`.

To make it automatic, connect this GitHub repo to the Pages project (build command
`npm run build`, output directory `dist`). Every push then rebuilds and updates the site.

Routes use the URL hash (`/#/articles/...`) and asset paths are relative, so the same
build also works on any other static host.
