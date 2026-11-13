# viraisec.com

My portfolio site, live at **[viraisec.com](https://viraisec.com)**.

I'm into cyber security and AI as two separate fields, and I wanted a site that shows both equally. It opens with a short terminal boot, then a 3D network that reads as both a computer network and a neural network follows you down the page. Projects are written up as short articles, and there's a terminal you can type into and a small "contain the breach" game.

## How I built it

I built this with Claude (mostly Claude Fable 5.2), working through it in conversation. My part was deciding what the site should be and say, choosing the look and features, reviewing each version, and sending things back when they didn't fit. Claude wrote the code. I also generated reference images in ChatGPT for the look of the 3D scenes.

**Stack:** React, TypeScript, Vite, Three.js (via React Three Fiber), GSAP, Lenis, Framer Motion, Tailwind CSS. Articles are Markdown files.

## How it's deployed

- **Hosting:** Cloudflare Pages, free tier. It's a static site, so there's no server to run or pay for, and Cloudflare doesn't cap bandwidth on static files.
- **Domain:** `viraisec.com` from Cloudflare Registrar, about US$11 a year at cost. I considered a `.ai` domain, but it needs a two-year minimum of about US$160, which wasn't worth it for a portfolio.
- Having both on Cloudflare meant the domain connected to the site automatically, with HTTPS included.

## What I learned

<!-- Write this part yourself. Some prompts:
- What was it like directing an AI build instead of writing every line?
- Which decisions were yours, and which ideas did you push back on?
- What did you learn about deploying: hosting, DNS, domains?
- What would you do differently next time?
-->

## Run it locally

```bash
npm install
npm run dev
```

More detail on writing articles, how the 3D and the game work, and deploying is in [docs/DEVELOPING.md](docs/DEVELOPING.md).
