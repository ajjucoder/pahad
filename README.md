# Saveika

Saveika is a mobile-first mental health screening and escalation platform built for Community Health Workers (CHWs) and supervisors in Nepal. It helps field workers capture household visit signals, calculates mental health risk, and gives supervisors a clearer view of households that may need urgent follow-up.

## What Saveika Does

- Supports guided household visit intake for CHWs
- Scores risk using Gemini with deterministic fallback logic
- Helps supervisors review flagged households and field activity
- Works in English and Nepali
- Ships with seeded demo accounts for hackathon demos
- Includes installable PWA support for mobile-first usage

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth + Postgres + RLS
- Tailwind CSS v4 + shadcn/ui
- Leaflet + OpenStreetMap
- Vitest + Testing Library

## Repository Structure

```text
.
├── public/              # Static assets, icons, team photos
├── scripts/             # Database schema and seed utilities
├── src/                 # App routes, UI components, libraries, tests
├── supabase/            # Supabase migrations
├── SAVEIKA_PRD.md       # Product requirements
└── IMPLEMENTATION_PLAN.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-github-repo-url>
cd Saveika
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` from `.env.example`.

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
GEMINI_API_KEY=
```

### 4. Set up Supabase

1. Apply `scripts/schema.sql`
2. Apply the SQL files in `supabase/migrations/`
3. Seed demo data:

```bash
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run typecheck
npm run db:seed
```

## Demo Accounts

```text
CHW:         chw1@demo.com / demo1234
CHW:         chw2@demo.com / demo1234
CHW:         chw3@demo.com / demo1234
Supervisor:  supervisor@demo.com / demo1234
```

## Project Documents

- `SAVEIKA_PRD.md`
- `IMPLEMENTATION_PLAN.md`

## Team

<table>
  <tr>
    <td align="center">
      <img src="public/team/aejju-singh.png" alt="Aejju Singh" width="180" /><br />
      <strong>Aejju Singh</strong>
    </td>
    <td align="center">
      <img src="public/team/nabin-joshi.jpeg" alt="Nabin Joshi" width="180" /><br />
      <strong>Nabin Joshi</strong>
    </td>
    <td align="center">
      <img src="public/team/dipika.jpeg" alt="Dipika" width="180" /><br />
      <strong>Dipika</strong>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="public/team/arnab.jpg" alt="Arnab" width="180" /><br />
      <strong>Arnab</strong>
    </td>
    <td align="center">
      <img src="public/team/karuna.jpg" alt="Karuna" width="180" /><br />
      <strong>Karuna</strong>
    </td>
    <td></td>
  </tr>
</table>
