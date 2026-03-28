# Pahad

Pahad is a mobile-first decision-support tool for community health workers in Nepal to record early behavioral warning signs, score household risk, and help supervisors review flagged households before crisis points.

## Planned stack

- Next.js 16
- Supabase Auth + Postgres + RLS
- Tailwind CSS v4 + shadcn/ui
- Gemini-based scoring with deterministic fallback
- Leaflet + OpenStreetMap
- PWA support for installable mobile usage

## Product scope

- CHW workflow for starting visits, completing the 8-signal screening form, and viewing visit history
- Supervisor workflow for dashboards, flagged households, worker activity, and status updates
- English and Nepali localization
- Seeded demo accounts and demo data for hackathon use

## Local development

1. Install dependencies
2. Run the database schema and seed scripts in Supabase
3. Start the app with `npm run dev`

Environment variables are expected in local env files managed outside source control.

## Status

This repository is being implemented from the approved PRD and implementation plan in:

- `PAHAD_PRD.md`
- `IMPLEMENTATION_PLAN.md`
