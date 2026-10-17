# Inkspilled

Next.js and Tailwind recreation of the Inkspilled website prototype. The WebGL ink layer, page flood, Bloom and Spilled type heroes, case studies, services, and journal are preserved. Hash links are real URLs.

```bash
npm run dev
```

| URL | Page |
|---|---|
| `/` | Homepage, Bloom hero |
| `/spilled` | Homepage, Spilled type hero |
| `/work/launch` | Case study |
| `/services/ads` | Service |
| `/journal/identity` | Journal post |

Copy lives in `lib/data.ts`. Set a showreel path in `lib/config.ts` (`HERO_VIDEO`) to play it inside the hero ink and the full-screen reel. `public/inkspilled-ink-layered.svg` is the static layered splat.
