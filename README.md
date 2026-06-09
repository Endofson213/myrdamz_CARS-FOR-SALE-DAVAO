# myrdamz_CARS-FOR-SALE-DAVAO

Luxury animated Next.js catalog website for **Myrdamz Cars for Sales Davao**.

## What is included

- Next.js app router project
- Advanced motion using Framer Motion
- Vehicle cards with posted PHP prices
- Dedicated product pages for every listed unit
- Animated filtering by body type, fuel, transmission, price range, search, and sort order
- 3D hover tilt cards, animated hero treatment, detail modal transitions, and scroll reveals
- Inquiry-focused contact section with no online checkout or payment wall
- Representative online vehicle/showroom imagery

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The server-backed admin and API routes require a Node.js deployment such as Vercel.

## Supabase setup

Run the SQL files in `supabase/` from the Supabase SQL Editor. The
`add-site-settings.sql` migration enables compressed, admin-managed homepage hero images.

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `CRON_SECRET` with a random value of at least 16 characters

Unused vehicle photos are queued for at least 24 hours and rechecked before deletion.
Vercel runs the protected cleanup route daily from `vercel.json`. On the Hobby plan,
cleanup can occur roughly 24 to 48 hours after a photo becomes unused.

The catalog routes each car to a static product page such as:

- `/cars/fortuner-v-2023`
- `/cars/bmw-3-2021`
- `/cars/ranger-raptor-2023`

## Image credits

Representative imagery is loaded from free online image sources:

- Pexels showroom and vehicle photos: <https://www.pexels.com/>
- Unsplash dealership photo research: <https://unsplash.com/s/photos/car-dealership>

Replace the representative image URLs with actual unit photos before final customer launch.
