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

Set a showreel path in `lib/config.ts` (`HERO_VIDEO`) to play it inside the hero ink and the full-screen reel. `public/inkspilled-ink-layered.svg` is the static layered splat.

## Content (Sanity)

Work, services, journal posts, the About image and the service process steps are edited in Sanity Studio: https://inkspilled-website.sanity.studio (project `6xr0skfc`, dataset `production`). Published changes reach the site within about a minute.

- `npm run studio` runs the Studio locally on http://localhost:3333; `npm run studio:deploy` redeploys it. The Studio lives in `studio/` with its own `package.json` (`npm install --prefix studio` first).
- `lib/sanity.ts` fetches and caches the content. `lib/data.ts` holds the bundled copy and stand-in stills (`public/ink/cells`), used when a collection is empty or Sanity is unreachable; `npm --prefix studio run seed` imports that copy into the dataset.
- New site domains must be added as CORS origins (`npx sanity cors add <origin>` in `studio/`), or the ink can't load the photos.
- For instant updates, add a Sanity webhook that POSTs to `/api/revalidate` with header `x-revalidate-secret`, and set `SANITY_REVALIDATE_SECRET` on the host.
