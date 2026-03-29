# Saveika -- Complete Implementation Plan

---

## Confirmed Decisions

| Decision | Choice |
|----------|--------|
| Framework | **Next.js 16.2.1** (latest -- Turbopack default, proxy.ts, React 19.2, async APIs) |
| Design aesthetic | **Organic** -- warm earth tones, soft rounded corners, nature-inspired, approachable |
| Tailwind | **v4** |
| shadcn base | **Neutral + Zinc combo** (warm but modern) |
| Dashboard layout | **Built from scratch** -- only architectural inspiration from Kuvio, no code copying (project is open source) |
| Map | **Leaflet.js** with zoom/pan + clickable markers linking to household detail |
| LLM | **Gemini primary** + deterministic weighted-sum fallback. **NOTE:** PRD specifies Gemini -> MiniMax -> fallback, but per user decision MiniMax is deferred. Build Gemini -> deterministic only. MiniMax can be slotted in later as a 10-min addition if needed. |
| Landing page | **Use frontend-design skill** for high design quality |
| shadcn usage | **Proper shadcn/ui** with full component library |

---

## What We Reuse (Patterns Only, NOT Code)

Since Saveika is open source, we **do NOT copy Kuvio design code**. We reuse only standard patterns:

| Pattern | Source | How |
|---------|--------|-----|
| Supabase SSR boilerplate | Standard Supabase docs pattern | Fresh implementation of client.ts, server.ts, proxy utils |
| Auth flow architecture | Standard Supabase Auth pattern | Email + Google OAuth, callback route, AuthProvider context |
| Service role admin client | Standard Supabase pattern | For seed scripts and server-side ops |
| shadcn/ui setup | Same library, fresh install | `npx shadcn@latest init` with Saveika's own theme |
| Dashboard shell concept | Architectural inspiration only | Completely fresh sidebar + content layout |

---

## Tech Stack

- **Framework:** Next.js 16.2.1 (App Router, Turbopack default, React 19.2 canary)
- **Styling:** Tailwind CSS v4 + shadcn/ui (fresh install, Radix primitives) + Lucide icons + Framer Motion
- **Backend/DB/Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Map:** Leaflet.js + react-leaflet + OpenStreetMap (free, no API key)
- **i18n:** React context + `en.json` / `ne.json`
- **LLM:** Gemini API via `@google/genai` (primary) + deterministic weighted-sum fallback (MiniMax deferred per user decision)
- **Hosting:** Vercel
- **PWA:** Built-in Next.js 16 approach -- `app/manifest.ts` + `public/sw.js` + security headers

---

## Next.js 16 Specifics (CRITICAL for implementation)

These are breaking changes from Next.js 15 that affect every file we write:

| Change | Impact |
|--------|--------|
| **`proxy.ts` replaces `middleware.ts`** | Our auth/role routing file is `proxy.ts` at project root, export function named `proxy` |
| **Turbopack is default** | No `--turbopack` flags needed. `next dev` and `next build` just work |
| **Async Request APIs (mandatory)** | `params`, `searchParams`, `cookies()`, `headers()` MUST be awaited -- no sync access |
| **React 19.2 canary** | View Transitions, `useEffectEvent()`, `<Activity/>` available |
| **`next lint` removed** | Use ESLint CLI directly, not `next lint` |
| **No `serverRuntimeConfig`/`publicRuntimeConfig`** | Use env vars directly |
| **`images.qualities` default `[75]`** | Only quality 75 by default |
| **Parallel routes need `default.js`** | All parallel slots require explicit `default.js` |
| **Node.js 20.9+** | Minimum Node version |

### Async params example (every dynamic route must do this):
```tsx
// Next.js 16 -- params is a Promise
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```

### proxy.ts example (NOT middleware.ts):
```tsx
// proxy.ts at project root
export function proxy(request: NextRequest) {
  // auth + role routing logic
}
export const config = { matcher: [...] }
```

---

## Design Language: Organic Health

- **Colors:** Warm earth palette -- sage greens, warm ivory backgrounds, terracotta/amber accents, muted stone grays
- **Typography:** Clean sans-serif (Inter or similar), generous spacing, readable at mobile sizes
- **Corners:** Soft rounded (16-24px radii on cards, 12px on buttons)
- **Shadows:** Subtle, warm-toned shadows (not cool gray)
- **Risk colors:** Green (low) -> Amber (moderate) -> Orange (high) -> Red (critical) -- organic, not neon
- **Feel:** Calm, trustworthy, approachable for community health workers in rural Nepal

---

## Privacy & Data Handling Rules

The PRD (section 11) explicitly states the dashboard should NOT have "Patient names or identifiable personal info." This creates a tension with `households.head_name` being stored in the schema. Resolution:

| Data | Where Stored | Where Shown | Rule |
|------|-------------|-------------|------|
| `head_name` | `households` table | **Household Detail page only** (supervisor, access-controlled) | NEVER on dashboard table, map tooltips, or any list view |
| Household code (e.g. `HH-001`) | `households` table | Dashboard table, lists, map | Primary identifier in all aggregated views |
| CHW name | `profiles` table | Dashboard table, CHW activity | Visible to supervisors only |
| Visit responses | `visits.responses` JSONB | Visit Detail page only | Never aggregated with identifiable info |

**Implementation rule:** All Supabase queries for dashboard/list views must SELECT only `code`, NOT `head_name`. The Household Detail page is the only place `head_name` appears.

---

## Env Variables (Already Configured)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
GEMINI_API_KEY=
```

Google OAuth is configured in the Supabase dashboard (client ID + secret already set).

---

## Phase 0: Project Scaffolding (~30 min)

1. **Initialize Next.js 16** in `/Users/aejjusingh/Developer/hackathon/saveika`
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --src-dir
   ```
   This gives us Next.js 16.2.1 with Turbopack, Tailwind v4, App Router, TypeScript.

2. **Verify `package.json`** scripts are clean Next.js 16 style:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start"
     }
   }
   ```
   No `--turbopack` flags needed (Turbopack is default in v16).

3. **Install core dependencies:**
   ```bash
   npm install @supabase/ssr @supabase/supabase-js @google/genai leaflet react-leaflet framer-motion lucide-react class-variance-authority clsx tailwind-merge
   npm install -D @types/leaflet
   ```

4. **Initialize shadcn/ui** with Tailwind v4:
   ```bash
   npx shadcn@latest init
   ```
   - Style: default
   - Base color: neutral
   - CSS variables: yes

5. **Install shadcn components:**
   ```bash
   npx shadcn@latest add button card input label select badge separator tabs dropdown-menu sheet switch table tooltip avatar progress skeleton alert dialog radio-group textarea sonner
   ```

6. **Set up ESLint** (since `next lint` is removed in v16):
   ```bash
   # ESLint flat config is the new default
   # eslint.config.mjs will be created by create-next-app
   ```

7. **Git init** + `.gitignore` + initial commit

---

## Phase 1: Supabase Schema + Seed Script (~1.5 hr)

### 1a. Database Tables

Create `scripts/schema.sql` to run via Supabase SQL editor:

**`areas`** -- Geographic areas/wards
```sql
CREATE TABLE areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ne text NOT NULL,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**`profiles`** -- User profiles linked to auth.users
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role text NOT NULL CHECK (role IN ('chw', 'supervisor')),
  area_id uuid REFERENCES areas(id),
  created_at timestamptz DEFAULT now()
);
```

**`households`** -- Households being monitored
```sql
CREATE TABLE households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  head_name text NOT NULL,
  area_id uuid NOT NULL REFERENCES areas(id),
  assigned_chw_id uuid NOT NULL REFERENCES profiles(id),
  latest_risk_score int DEFAULT 0,
  latest_risk_level text DEFAULT 'low' CHECK (latest_risk_level IN ('low', 'moderate', 'high', 'critical')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'reviewed', 'referred')),
  created_at timestamptz DEFAULT now()
);
```

**`visits`** -- Individual visit screening records
```sql
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id),
  chw_id uuid NOT NULL REFERENCES profiles(id),
  visit_date date DEFAULT CURRENT_DATE,
  responses jsonb NOT NULL,
  total_score int NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  explanation_en text NOT NULL,
  explanation_ne text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### 1b. RLS Policies (Implementation-Ready)

**Security model:**
- `profiles.role` is **NEVER user-editable** via RLS. Only the seed script (service role) sets roles.
- CHW can only insert visits for households assigned to them (enforced at DB level, not just API).
- Supervisor UPDATE on households is restricted to the `status` column only.
- No DELETE policies exist for any table -- data is append-only.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AREAS: authenticated users can read (public reference data)
-- ============================================================
CREATE POLICY "areas_select_authenticated" ON areas
  FOR SELECT TO authenticated USING (true);
-- No insert/update/delete for areas via RLS (seed only via service role)

-- ============================================================
-- PROFILES: read own, supervisors read all, NO user updates to role
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_select_supervisor" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'supervisor'));

-- CRITICAL: No INSERT/UPDATE/DELETE policies for profiles.
-- profiles.role is immutable via client. Only service_role can write profiles.
-- This prevents role escalation attacks.

-- ============================================================
-- HOUSEHOLDS: CHW reads assigned, Supervisor reads all + updates status only
-- ============================================================
CREATE POLICY "households_select_chw" ON households
  FOR SELECT TO authenticated
  USING (assigned_chw_id = auth.uid());

CREATE POLICY "households_select_supervisor" ON households
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'supervisor'));

-- Supervisor can update ONLY status column (not reassign CHW, change risk, etc.)
-- DB-ENFORCED via trigger -- not just API-layer trust
CREATE POLICY "households_update_supervisor_status" ON households
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'supervisor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'supervisor'));

-- TRIGGER: reject any supervisor UPDATE that touches columns other than status
CREATE OR REPLACE FUNCTION enforce_supervisor_status_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role to update anything (for /api/score risk updates)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- For authenticated users, only status may change
  IF NEW.code IS DISTINCT FROM OLD.code
    OR NEW.head_name IS DISTINCT FROM OLD.head_name
    OR NEW.area_id IS DISTINCT FROM OLD.area_id
    OR NEW.assigned_chw_id IS DISTINCT FROM OLD.assigned_chw_id
    OR NEW.latest_risk_score IS DISTINCT FROM OLD.latest_risk_score
    OR NEW.latest_risk_level IS DISTINCT FROM OLD.latest_risk_level
  THEN
    RAISE EXCEPTION 'Only status column may be updated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER households_status_only_trigger
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION enforce_supervisor_status_only();

-- CHW can NOT update households at all via client
-- Risk score/level updates are handled server-side via service_role in /api/score

-- ============================================================
-- VISITS: CHW reads own + inserts for assigned households only, Supervisor reads all
-- ============================================================
CREATE POLICY "visits_select_chw" ON visits
  FOR SELECT TO authenticated
  USING (chw_id = auth.uid());

-- CRITICAL: Insert enforces BOTH chw_id ownership AND household assignment
CREATE POLICY "visits_insert_chw" ON visits
  FOR INSERT TO authenticated
  WITH CHECK (
    chw_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_id
      AND h.assigned_chw_id = auth.uid()
    )
  );

CREATE POLICY "visits_select_supervisor" ON visits
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'supervisor'));

-- No UPDATE or DELETE policies on visits for anyone (visits are immutable records)
```

### 1b-extra. Proxy Role Verification Strategy

The `proxy.ts` verifies roles as follows:
1. Refresh Supabase session (get auth token from cookies)
2. Call `supabase.auth.getUser()` to verify JWT is valid
3. If accessing `/app/*` or `/supervisor/*`:
   - Query `profiles` table for `role` using the authenticated user ID
   - Cache role in a short-lived cookie (`saveika-role`) to avoid re-querying on every request
   - Compare role against required role for the route
4. Redirect mismatches: no auth -> `/login`, wrong role -> correct home (`/app` or `/supervisor`)

### 1c. Seed Script (`scripts/seed.ts`)

Run via `npx tsx scripts/seed.ts` using service role key:
- Create 4 auth users via `supabase.auth.admin.createUser()`:
  - `chw1@demo.com` / `demo1234` / role: chw / Ward 3, Sindhupalchok
  - `chw2@demo.com` / `demo1234` / role: chw / Ward 5, Sindhupalchok
  - `chw3@demo.com` / `demo1234` / role: chw / Ward 7, Kavrepalanchok
  - `supervisor@demo.com` / `demo1234` / role: supervisor / all areas
- Insert 3 areas with real Nepal coordinates
- Insert 15 households (8 low, 4 moderate, 2 high, 1 critical)
- Insert sample visit records with realistic screening responses
- Set up profile records with correct roles and area assignments

---

## Phase 2: Auth System (~1.5 hr)

### 2a. Supabase Utilities (standard boilerplate, fresh code)

- `src/lib/supabase/client.ts` -- browser client singleton using `createBrowserClient`
- `src/lib/supabase/server.ts` -- server client using `createServerClient` with async `cookies()` (Next.js 16: cookies is async)
- `src/lib/supabase/admin.ts` -- service role client for server-side operations

```tsx
// src/lib/supabase/server.ts -- Next.js 16 style (async cookies)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // MUST await in Next.js 16
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### 2b. Proxy (`proxy.ts` -- NOT middleware.ts)

Next.js 16 renamed middleware to proxy. File at project root: `proxy.ts`

```tsx
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // 1. Refresh Supabase session
  // 2. Check auth for /app/* and /supervisor/* routes
  // 3. Fetch profile role from cookie or header
  // 4. Redirect based on role:
  //    - /app/* requires role=chw
  //    - /supervisor/* requires role=supervisor
  //    - Unauthenticated -> /login
  //    - Wrong role -> correct home
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

### 2c. Auth Provider

- `src/providers/auth-provider.tsx` -- React context providing `{ user, profile, role, loading }`
- Fetches profile from `profiles` table on auth state change to get role
- Exposes `useAuth()` hook

### 2d. Login Page (`/login`)

**Built from scratch with Organic design:**
- Email/password form using shadcn Input, Label, Button
- Google OAuth button with Google SVG icon
- Consent disclaimer text
- Clean, mobile-first, warm earth tones
- Error states with shadcn Alert

### 2e. Auth Callback (`/auth/callback/route.ts`)

- Exchange OAuth code for session
- **Look up profile in `profiles` table (DO NOT auto-create)**
- If profile exists: redirect by role (`chw` -> `/app`, `supervisor` -> `/supervisor`)
- If profile does NOT exist: redirect to `/login?error=no_account` with message "No account found. Contact your administrator."
- **Rationale:** For the hackathon, roles are seeded manually (PRD section 7). There is no self-registration or role picker. Unknown Google accounts are rejected, not auto-provisioned. This prevents unauthorized access.

### 2f. Auth Functions (`src/lib/auth.ts`)

- `signInWithEmail(email, password)` -- POST to `/api/auth/login`
- `signInWithGoogle(redirectPath)` -- Supabase OAuth with callback URL
- `signOut()` -- Clear session and redirect

---

## Phase 3: i18n System (~45 min)

- `src/i18n/en.json` -- all English strings (UI, form questions, 8 screening signals with response options, empty states, errors)
- `src/i18n/ne.json` -- all Nepali translations (from PRD section 9)
- `src/providers/language-provider.tsx` -- React context with `{ locale, setLocale, t(key) }`
- Stored in `localStorage`, default: English
- `t('signal.sleep')` returns localized string

---

## Phase 4: Landing Page (~1.5 hr)

**Use `frontend-design` skill for high design quality.**

Design: Organic health aesthetic -- warm, trustworthy, Nepal-context-appropriate.

### Sections:
1. **Hero** -- Bold headline about proactive mental health support in Nepal, subtitle about CHWs, CTA to login. Warm gradient background.
2. **Problem Statement** -- Visual explanation of the mental health gap. Cards or illustrated points.
3. **How It Works** -- 3-step flow: Visit -> Screen -> Flag. Icons + brief text.
4. **Key Features** -- Cards: 8-Signal Screening, LLM-Powered Risk Scoring, Bilingual (EN/NE), Supervisor Dashboard with Map
5. **Consent Disclaimer** -- Prominent: "Saveika is a decision-support tool. It does not diagnose mental health conditions."
6. **Footer** -- Simple, clean

All with Framer Motion entrance animations, mobile-responsive.

---

## Phase 5: CHW Pages (~2.5 hr)

### Layout: Bottom Tab Bar
- `src/app/app/layout.tsx` -- fixed bottom tab bar: Home | New Visit | History | Settings
- Mobile-first, touch targets 48px+, PWA-optimized
- AuthProvider + LanguageProvider wrapping

### 5a. CHW Home (`/app`)
- Greeting with CHW name
- 3 stat cards (shadcn Card): visits this month, assigned households, pending syncs (simulated)
- Big "Start New Visit" CTA (shadcn Button, large, primary)
- Empty state: "Welcome! Start your first household visit."

### 5b. New Visit (`/app/visit/new`)
- **Household selector:** shadcn Select dropdown (only assigned households)
- **8 screening questions:** shadcn RadioGroup for each signal
  - Each signal shows label in current language
  - 4 options per signal (0-3) with localized labels
- **Notes:** shadcn Textarea (optional)
- **Consent disclaimer** at form top
- **Submit** -> POST to `/api/score` -> "Syncing..." animation -> Result card with:
  - Color-coded risk badge (shadcn Badge with organic risk colors)
  - Score number
  - Explanation in current language
  - Buttons: "Back to Home" + "View Full Details"

### 5c. Visit History (`/app/visits`)
- Scrollable list using shadcn Card for each visit
- Each: household code, date, risk score badge
- Empty state message

### 5d. Visit Detail (`/app/visits/[id]`)

**CRITICAL Next.js 16:** params is async:
```tsx
export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // fetch visit by id...
}
```

- Full per-signal response breakdown
- Risk score + color badge
- Plain-language explanation (current language)
- Visit date, household info, CHW notes
- Back button

### 5e. CHW Settings (`/app/settings`)
- Language toggle (shadcn Switch or Select)
- Account info (name, email, area)
- Logout button

---

## Phase 6: API Score Route (~1 hr)

### `POST /api/score`

#### Request Schema

```ts
{
  household_id: string  // uuid, required
  responses: {          // all required, each 0-3
    sleep: 0 | 1 | 2 | 3
    appetite: 0 | 1 | 2 | 3
    withdrawal: 0 | 1 | 2 | 3
    trauma: 0 | 1 | 2 | 3
    activities: 0 | 1 | 2 | 3
    hopelessness: 0 | 1 | 2 | 3
    substance: 0 | 1 | 2 | 3
    self_harm: 0 | 1 | 2 | 3
  }
  notes?: string        // optional free text
}
```

**Validation rules:**
- All 8 response keys must be present
- Each value must be an integer 0-3
- `household_id` must be a valid uuid
- `household_id` must be assigned to the authenticated CHW (verified server-side)

#### Response Schema

**Success (200):**
```ts
{
  visit_id: string           // uuid of the created visit record
  score: number              // 0-100
  risk_level: "low" | "moderate" | "high" | "critical"
  explanation_en: string     // English explanation
  explanation_ne: string     // Nepali explanation
  scoring_method: "gemini" | "fallback"  // so UI can show toast if fallback was used
}
```

**Error responses:**
| Status | Body | When |
|--------|------|------|
| 401 | `{ error: "Unauthorized" }` | No valid session |
| 403 | `{ error: "Household not assigned to you" }` | CHW accessing unassigned household |
| 422 | `{ error: "Validation failed", details: [...] }` | Missing/invalid fields |
| 500 | `{ error: "Scoring failed" }` | Both Gemini AND fallback fail (should never happen) |

#### Flow

1. Authenticate request via Supabase server client (verify JWT)
2. Validate request body against schema above -- reject 422 on any violation
3. Verify household is assigned to this CHW via admin client -- reject 403 if not
4. Build prompt from PRD section 10 template with response values
5. Call Gemini via `@google/genai`: temperature=0, JSON mode, max_tokens=500, timeout=10s
6. Parse structured JSON response
7. **If Gemini fails** -> deterministic fallback:
   ```
   score = round((sleep*2 + appetite*2 + withdrawal*3 + trauma*3 + activities*3 + hopelessness*4 + substance*3 + self_harm*5) / 75 * 100)
   ```
   Risk level: 0-30 low, 31-60 moderate, 61-80 high, 81-100 critical.
   Fallback explanations (bilingual):
   - EN: "Score calculated using standard screening weights. AI explanation unavailable."
   - NE: "मानक स्क्रिनिङ भारका आधारमा स्कोर गणना गरिएको। AI व्याख्या उपलब्ध छैन।"
8. Insert into `visits` table via admin client (service_role, bypasses RLS for risk update)
9. Update `households.latest_risk_score` + `households.latest_risk_level` via admin client
10. Return success response with `visit_id` and `scoring_method`

---

## Phase 7: Supervisor Pages (~2.5 hr)

### Layout: Sidebar Navigation
- `src/app/supervisor/layout.tsx` -- collapsible sidebar with nav items
- Nav: Dashboard | CHW Activity | Settings
- Responsive: collapses to hamburger/sheet on mobile
- AuthProvider + LanguageProvider wrapping

### 7a. Dashboard (`/supervisor`)

**4 Summary Cards** (shadcn Card):
- Total Screenings this month
- Flagged Households (high + critical count)
- Active CHWs (with 1+ visit this month)
- Avg Area Risk score

**Flagged Households Table** (shadcn Table):
- Columns: Household Code, Area, Risk Score (color badge), Last Visit, CHW Name, Status
- **Privacy rule:** `head_name` is NOT shown on the dashboard table (PRD says no identifiable personal info on dashboard). Head name is only visible on the Household Detail page which is access-controlled to supervisors.
- Only shows high/critical risk households
- Empty state: "No high-risk households flagged. All clear."

**Area Map** (Leaflet.js + react-leaflet):
- OpenStreetMap tiles, centered on Nepal
- Circle markers at each area's center coordinates
- Circle color: green/amber/orange/red based on average area risk
- Circle size: proportional to household count
- Click marker -> tooltip: area name, household count, avg score
- Zoom/pan enabled
- Clicking area links to household detail

### 7b. Household Detail (`/supervisor/household/[id]`)

**CRITICAL Next.js 16:** params is async:
```tsx
export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // fetch household...
}
```

- Household info header (code, head name, area, assigned CHW)
- Status with action buttons: "Mark Reviewed" / "Mark Referred" (shadcn Button)
- Current risk score with color badge
- **Risk trend:** Show score progression across visits (simple list with date + score badge, most recent first). If 3+ visits exist, show a minimal sparkline or trend arrow (up/down/stable). This satisfies PRD section 8 "risk trend" requirement.
- Full visit history list (all visits for this household, expandable)

### 7c. CHW Activity (`/supervisor/workers`)
- Table (shadcn Table): CHW name, area, visit count this month, last active date
- Clickable rows

### 7d. Supervisor Settings (`/supervisor/settings`)
- Language toggle, account info, logout

---

## Phase 8: Error & Empty States + Simulated Offline (~45 min)

- All empty states from PRD section 13 (with organic-styled illustrations/icons)
- Error handling from PRD section 14:
  - Gemini failure -> fallback scoring + toast
  - Network error -> toast, preserve form data
  - Auth failure -> redirect to `/login`
  - Wrong role -> redirect to correct home
  - 404 -> custom `not-found.tsx` with "Back to Home"
  - Error boundary -> custom `error.tsx` (Next.js 16 convention)
- **Simulated offline:** "Syncing..." animation during API call on visit submit
- Toast notifications via Sonner (installed via shadcn)

---

## Phase 9: PWA Setup (~45 min)

### Scope Clarification

**What "PWA" means for Saveika:**
- Installable from browser to home screen (Android + iOS)
- Standalone display mode (no browser chrome)
- Proper app icons, splash screen, theme color
- Service worker registered for installability criteria

**What "offline" means for Saveika (from PRD):**
- **Simulated only.** There is NO real offline data sync, NO IndexedDB, NO background sync.
- The "Syncing..." animation plays during the API call to `/api/score`. That is the extent of offline simulation.
- If the user is actually offline, the app will show a network error toast. Data is NOT queued.
- This is explicitly listed in PRD section 19 (Out of Scope): "Real offline with IndexedDB sync"

Following the **official Next.js 16 PWA guide** (https://nextjs.org/docs/app/guides/progressive-web-apps):

### 9a. Web App Manifest (`src/app/manifest.ts`)

Next.js 16 has **built-in manifest support** via `app/manifest.ts` (NOT `public/manifest.json`):

```tsx
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saveika -- Community Mental Health Screening',
    short_name: 'Saveika',
    description: 'A mobile decision-support tool for community health workers in Nepal',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF5',    // warm ivory (organic theme)
    theme_color: '#5B7553',          // sage green (organic theme)
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

### 9b. Service Worker (`public/sw.js`)

Basic service worker for PWA installability and push notification support:

```js
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
```

### 9c. Service Worker Registration

In root layout or a client component:
```tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  }
}, [])
```

### 9d. Security Headers (`next.config.ts`)

```tsx
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 9e. iOS Install Prompt Component

Component that detects iOS and shows "Add to Home Screen" instructions:
```tsx
function InstallPrompt() {
  // Detect iOS + standalone mode
  // Show instructions for iOS users to tap Share -> Add to Home Screen
  // Hide if already installed (display-mode: standalone)
}
```

### 9f. App Icons

Generate icon set using a favicon generator:
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`
- `public/icons/apple-touch-icon.png` (180x180)
- Add `<link rel="apple-touch-icon">` in root layout metadata

### 9g. PWA Meta Tags in Root Layout

```tsx
export const metadata: Metadata = {
  title: 'Saveika',
  description: 'Community mental health screening tool for Nepal',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Saveika',
  },
  formatDetection: {
    telephone: false,
  },
}
```

---

## Phase 10: Polish + Demo Testing (~1.5 hr)

### 10a. Happy Path Demo Script (PRD section 21)

1. Login as CHW on mobile browser
2. See assigned households on home
3. Start new visit, fill 8 signals
4. Submit, see syncing animation, get score + explanation
5. Switch to Supervisor account
6. See flagged household in dashboard table
7. View area map with risk-colored markers, zoom/pan
8. Open household detail, change status to "referred"

### 10b. Edge-Case / Failure Path Testing

| Test | Expected Behavior |
|------|-------------------|
| CHW navigates to `/supervisor` directly | Redirected to `/app` by proxy.ts |
| Supervisor navigates to `/app` directly | Redirected to `/supervisor` by proxy.ts |
| Unauthenticated user hits `/app` or `/supervisor` | Redirected to `/login` |
| CHW submits visit with missing fields (incomplete form) | Client-side validation blocks submit, highlights missing fields |
| CHW submits visit when Gemini API is down | Deterministic fallback scoring runs, toast says "AI unavailable, using standard weights" |
| Network error during visit submit | Toast notification, form data preserved (not cleared), user can retry |
| CHW tries to access household not assigned to them | RLS blocks query, empty result, 404 page shown |
| Supervisor tries to change household status to invalid value | Server validates against allowed values, rejects |
| Language toggle mid-form (while filling visit) | Form labels switch language, entered data preserved |
| Map loads on mobile with slow connection | Loading skeleton shown, map renders when tiles load |
| Visit detail page with invalid ID in URL | 404 not-found page |
| Double-click submit button | Disable button on first click, prevent duplicate submissions |

### 10c. Cross-Browser / Platform Testing

- Test all 4 demo accounts (3 CHW + 1 supervisor)
- Verify role-based routing via `proxy.ts`
- Test EN <-> NE language toggle
- Test map zoom/pan/click interactions
- Mobile responsiveness: iPhone SE, iPhone 14, Pixel 7, iPad
- Desktop: Chrome, Safari, Firefox
- Verify Gemini API scoring + fallback
- Test PWA: install from Chrome, check manifest, verify standalone mode
- Test PWA on iOS Safari: apple-touch-icon, Add to Home Screen flow

---

## Project File Structure

```
saveika/
├── src/
│   ├── app/
│   │   ├── manifest.ts                  # PWA manifest (Next.js 16 built-in)
│   │   ├── layout.tsx                   # Root layout (fonts, providers, PWA meta)
│   │   ├── page.tsx                     # Landing page
│   │   ├── globals.css                  # Tailwind v4 + organic theme CSS vars
│   │   ├── not-found.tsx                # Global 404
│   │   ├── error.tsx                    # Global error boundary
│   │   ├── login/page.tsx               # Login page
│   │   ├── auth/
│   │   │   └── callback/route.ts        # OAuth callback
│   │   ├── api/
│   │   │   ├── score/route.ts           # LLM scoring endpoint
│   │   │   └── auth/login/route.ts      # Email login API route
│   │   ├── app/                         # CHW routes (protected)
│   │   │   ├── layout.tsx               # Bottom tab bar
│   │   │   ├── page.tsx                 # CHW Home
│   │   │   ├── visit/new/page.tsx       # New visit form
│   │   │   ├── visits/page.tsx          # Visit history
│   │   │   ├── visits/[id]/page.tsx     # Visit detail (async params)
│   │   │   └── settings/page.tsx        # CHW settings
│   │   └── supervisor/                  # Supervisor routes (protected)
│   │       ├── layout.tsx               # Sidebar nav
│   │       ├── page.tsx                 # Dashboard
│   │       ├── household/[id]/page.tsx  # Household detail (async params)
│   │       ├── workers/page.tsx         # CHW activity
│   │       └── settings/page.tsx        # Supervisor settings
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components (auto-generated)
│   │   ├── landing/                     # Landing page sections
│   │   ├── chw/                         # CHW-specific components
│   │   │   ├── bottom-tabs.tsx
│   │   │   ├── visit-form.tsx
│   │   │   ├── visit-card.tsx
│   │   │   └── score-result.tsx
│   │   ├── supervisor/                  # Supervisor components
│   │   │   ├── sidebar.tsx
│   │   │   ├── summary-cards.tsx
│   │   │   ├── flagged-table.tsx
│   │   │   └── area-map.tsx
│   │   └── shared/                      # Shared across roles
│   │       ├── risk-badge.tsx
│   │       ├── disclaimer.tsx
│   │       ├── language-toggle.tsx
│   │       ├── install-prompt.tsx       # PWA install prompt (iOS)
│   │       └── user-menu.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server client (async cookies)
│   │   │   └── admin.ts                # Service role client
│   │   ├── auth.ts                      # signIn, signOut functions
│   │   ├── scoring.ts                   # Gemini call + fallback logic
│   │   ├── signals.ts                   # 8 screening signal definitions
│   │   ├── utils.ts                     # cn() and helpers
│   │   └── constants.ts                 # Risk levels, colors, etc.
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   └── language-provider.tsx
│   └── i18n/
│       ├── en.json
│       └── ne.json
├── scripts/
│   ├── schema.sql                       # Database schema
│   └── seed.ts                          # Database seed script
├── public/
│   ├── sw.js                            # Service worker
│   └── icons/                           # PWA icons (192, 512, apple-touch)
├── proxy.ts                             # Auth + role routing (Next.js 16 proxy)
├── components.json                      # shadcn config
├── next.config.ts                       # Next.js 16 config + security headers
├── eslint.config.mjs                    # ESLint flat config (v16 default)
├── tsconfig.json
├── package.json
└── .env.local                           # Already configured by user
```

---

## Known Integration Risks & Mitigations

These are not blockers but will cost time if not handled proactively:

| Risk | Impact | Mitigation |
|------|--------|------------|
| **react-leaflet SSR crash** | Leaflet accesses `window` which doesn't exist on server | Use `next/dynamic` with `ssr: false` for ALL map components. Import Leaflet CSS in the client component only. |
| **Leaflet default icon paths broken in bundler** | Marker icons show as broken images | Explicitly set `L.Icon.Default` image paths to `/leaflet/` in `public/leaflet/` or use CDN URLs |
| **Supabase SSR + async cookies()** | Next.js 16 requires `await cookies()` -- old patterns break | Already addressed in plan. Use the exact pattern in Phase 2a. |
| **Tailwind v4 + shadcn compatibility** | shadcn may generate v3-style config | After `shadcn init`, verify `globals.css` uses `@import "tailwindcss"` (v4 syntax) not `@tailwind base` (v3) |
| **localStorage hydration mismatch** | Language provider reads localStorage on client but server renders default | Use `useEffect` for initial locale read, render default (English) on server, hydrate on client. Wrap in `suppressHydrationWarning` if needed. |
| **Leaflet CSS not loading** | Map tiles render but controls/markers look wrong | Import `leaflet/dist/leaflet.css` in the dynamic map client component, NOT in globals.css |
| **Service worker caching stale pages** | Old SW serves stale content after deploy | SW has `Cache-Control: no-cache` header (already in Phase 9d). Keep SW minimal -- no aggressive caching. |

---

## Execution Order (for AI agent)

```
Phase 0  -> Scaffold Next.js 16, deps, shadcn init
Phase 1  -> DB schema SQL + RLS + seed script (run seed)
Phase 2  -> Auth system (Supabase utils, proxy.ts, login page, callback, provider)
Phase 3  -> i18n system (JSON files, provider, hook)
Phase 6  -> API score route (needed before CHW pages)
Phase 5  -> CHW pages (depends on auth + i18n + API)
Phase 7  -> Supervisor pages (depends on auth + i18n + data)
Phase 4  -> Landing page (use frontend-design skill)
Phase 8  -> Error/empty states + simulated offline
Phase 9  -> PWA setup (manifest.ts, sw.js, headers, icons, install prompt)
Phase 10 -> Polish + demo testing
```

**Estimated total: ~20-25 hours of AI agent execution**

### Revised Time Breakdown

| Phase | Optimistic | Realistic | Notes |
|-------|-----------|-----------|-------|
| Phase 0: Scaffolding | 0.5h | 1h | Dep install + shadcn init can have hiccups |
| Phase 1: Schema + Seed | 1.5h | 2.5h | RLS policy debugging is always slower than expected |
| Phase 2: Auth System | 1.5h | 3h | Proxy role verification + OAuth callback + edge cases |
| Phase 3: i18n | 0.75h | 1h | Straightforward |
| Phase 4: Landing Page | 1.5h | 2.5h | Design quality takes time |
| Phase 5: CHW Pages | 2.5h | 4h | Visit form + scoring integration + result display |
| Phase 6: API Score Route | 1h | 1.5h | Gemini integration + fallback logic |
| Phase 7: Supervisor Pages | 2.5h | 4h | Dashboard + map + household detail |
| Phase 8: Error/Empty States | 0.75h | 1h | Straightforward |
| Phase 9: PWA | 0.75h | 1h | Manifest + SW + icons |
| Phase 10: Polish + Testing | 1.5h | 2.5h | Edge cases take time |
| **Total** | **~15h** | **~24h** | Aligns with PRD's 23h estimate |
