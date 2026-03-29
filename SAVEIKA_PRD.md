# Saveika — Complete Hackathon PRD

---

## 1. Product Summary

**Name:** Saveika

**One-line pitch:** A mobile decision-support tool for community health workers in Nepal to log early behavioral warning signs and flag households that may need mental health support.

**Core idea:** Proactive, not reactive. Use existing community health infrastructure to surface mental health risk before crisis hits.

---

## 2. Problem

In Nepal, mental health struggles are detected late — often only after crisis. Community health workers visit households regularly but have no structured tool to record warning signs and escalate concerns early.

---

## 3. Target Users

| Role | Description |
|------|-------------|
| **CHW** | Community health worker (male or female). Conducts home visits. Fills forms. Primary user. |
| **Supervisor** | Area-level health supervisor. Reviews flagged households, tracks trends, updates case status. |

---

## 4. Tech Stack

- **Frontend:** Next.js (PWA — installable from browser, works on mobile)
- **Backend/DB/Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Map:** Leaflet.js + OpenStreetMap (free, no API key)
- **i18n:** Simple React context + two JSON files (`en.json`, `ne.json`)
- **LLM Scoring:** Gemini API (primary), MiniMax 2.7 via OpenCode Go (fallback)
- **Offline:** Simulated — saves directly to Supabase, shows `syncing...` animation in UI
- **Hosting:** Vercel

---

## 5. Env Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
MINIMAX_API_KEY=
```

Google OAuth is configured in the Supabase dashboard, not in env.

---

## 6. Database Schema

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, references auth.users) | |
| email | text | |
| full_name | text | |
| avatar_url | text | nullable |
| role | text | `chw` or `supervisor` |
| area_id | uuid (FK → areas) | nullable for supervisor |
| created_at | timestamptz | |

### `areas`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | e.g. `Ward 5, Sindhupalchok` |
| name_ne | text | Nepali name |
| center_lat | float | For map marker placement |
| center_lng | float | For map marker placement |
| created_at | timestamptz | |

### `households`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| code | text (unique) | e.g. `HH-001` |
| head_name | text | Head of household name |
| area_id | uuid (FK → areas) | |
| assigned_chw_id | uuid (FK → profiles) | Which CHW is responsible |
| latest_risk_score | int | Denormalized, updated after each visit |
| latest_risk_level | text | `low` / `moderate` / `high` / `critical` |
| status | text | `active` / `reviewed` / `referred` |
| created_at | timestamptz | |

### `visits`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| household_id | uuid (FK → households) | |
| chw_id | uuid (FK → profiles) | |
| visit_date | date | Auto-filled, editable |
| responses | jsonb | `{"sleep": 2, "appetite": 1, ...}` |
| total_score | int | 0–100 from LLM |
| risk_level | text | `low` / `moderate` / `high` / `critical` |
| explanation_en | text | English explanation from LLM |
| explanation_ne | text | Nepali explanation from LLM |
| notes | text | Optional CHW notes |
| created_at | timestamptz | |

### RLS Rules

- CHW can only read/write visits for households where `assigned_chw_id = auth.uid()`
- CHW can only read households where `assigned_chw_id = auth.uid()`
- Supervisor can read all visits and households
- Supervisor can update `households.status`
- No user can delete any record

---

## 7. Auth and Role Assignment

- **Login:** Email/password + Google OAuth via Supabase Auth
- **Role assignment:** Set in `profiles.role`. For the hackathon, roles are seeded manually. No self-registration or role picker.
- **Routing after login:**
  - `chw` → `/app`
  - `supervisor` → `/supervisor`
  - Wrong role on wrong route → redirect to correct home
- **Middleware:** Check auth + role on every `/app/*` and `/supervisor/*` route

---

## 8. Pages and Navigation

### Public

| Page | Path |
|------|------|
| Landing | `/` |
| Login | `/login` |

### CHW Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/app` | Visit count this month, pending syncs count, assigned households count, big `Start New Visit` CTA |
| New Visit | `/app/visit/new` | Select household from dropdown, fill 8 questions, optional notes, submit |
| Visit History | `/app/visits` | List of past submissions with household code, date, risk score badge |
| Visit Detail | `/app/visits/[id]` | Full score breakdown, per-signal responses, plain-language explanation |
| Settings | `/app/settings` | Language toggle, account info, logout |

### Supervisor Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/supervisor` | 4 summary cards + flagged table + area map |
| Household Detail | `/supervisor/household/[id]` | Full visit history, risk trend, current status, action buttons |
| CHW Activity | `/supervisor/workers` | List of CHWs with area, visit count, and last active date |
| Settings | `/supervisor/settings` | Language toggle, account info, logout |

### Navigation

**CHW:** Bottom tab bar  
`Home | New Visit | History | Settings`

**Supervisor:** Sidebar  
`Dashboard | CHW Activity | Settings`

**All detail pages:** Back button in header returning to parent list

---

## 9. The 8 Screening Signals

| # | Key | Label (EN) | Label (NE) |
|---|-----|------------|------------|
| 1 | sleep | Sleep changes | निद्रामा परिवर्तन |
| 2 | appetite | Appetite changes | खानामा परिवर्तन |
| 3 | withdrawal | Social withdrawal | सामाजिक अलगाव |
| 4 | trauma | Recent loss or trauma | हालैको क्षति वा आघात |
| 5 | activities | Stopped daily activities | दैनिक काम बन्द |
| 6 | hopelessness | Expressed hopelessness | निराशा व्यक्त गरेको |
| 7 | substance | Alcohol/substance use increase | मदिरा/लागुपदार्थ सेवन बढेको |
| 8 | self_harm | Self-harm indicators | आत्मघाती संकेत |

### Response Options

| Value | Label (EN) | Label (NE) |
|-------|------------|------------|
| 0 | Not observed | देखिएन |
| 1 | Mild / sometimes | हल्का |
| 2 | Significant / often | ठूलो |
| 3 | Severe / persistent | गम्भीर |

---

## 10. LLM-Based Risk Scoring

### Flow

1. CHW submits visit form
2. App calls `/api/score`
3. API route sends responses to Gemini
4. If Gemini fails, app retries with MiniMax
5. LLM returns JSON with score, risk level, English explanation, and Nepali explanation
6. App saves the result to `visits` and updates `households.latest_risk_score` and `households.latest_risk_level`

### Prompt

```text
You are a community mental health screening assistant based on WHO mhGAP guidelines.

A community health worker visited a household and observed the following signals. Each signal is rated: 0 = Not observed, 1 = Mild, 2 = Significant, 3 = Severe.

Signals:
- Sleep changes: {value}
- Appetite changes: {value}
- Social withdrawal: {value}
- Recent loss or trauma: {value}
- Stopped daily activities: {value}
- Expressed hopelessness: {value}
- Alcohol/substance use increase: {value}
- Self-harm indicators: {value}

Based on these observations, provide:
1. A risk score from 0 to 100
2. A risk level: "low" (0-30), "moderate" (31-60), "high" (61-80), or "critical" (81-100)
3. A plain-language explanation in English (2-3 sentences, non-clinical, suitable for a community health worker)
4. The same explanation in Nepali

Respond ONLY in this exact JSON format:
{
  "score": <number>,
  "risk_level": "<low|moderate|high|critical>",
  "explanation_en": "<string>",
  "explanation_ne": "<string>"
}
```

### LLM Settings

- **Temperature:** `0`
- **Response format:** JSON mode / structured output
- **Max tokens:** `500`
- **Timeout:** `10 seconds`
- **Primary:** Gemini API
- **Fallback:** MiniMax 2.7

### Fallback if Both APIs Fail

Use a deterministic weighted sum:

```text
score = round((sleep*2 + appetite*2 + withdrawal*3 + trauma*3 + activities*3 + hopelessness*4 + substance*3 + self_harm*5) / 75 * 100)
```

Fallback explanation:

```text
Score calculated using standard screening weights. AI explanation unavailable.
```

This ensures the demo never breaks.

---

## 11. Supervisor Dashboard

### Summary Cards

| Card | Metric |
|------|--------|
| Total Screenings | Count of all visits this month |
| Flagged Households | Count where `latest_risk_level` is `high` or `critical` |
| Active CHWs | CHWs with at least 1 visit this month |
| Avg Area Risk | Average `latest_risk_score` across all households |

### Flagged Households Table

| Column | Source |
|--------|--------|
| Household Code | `households.code` |
| Area | `areas.name` |
| Risk Score | Color badge with number |
| Last Visit | Date of most recent visit |
| CHW | Name of assigned CHW |
| Status | `active` / `reviewed` / `referred` |

**Flagged** means `latest_risk_level` is `high` or `critical`.

### Supervisor Actions

- Change household status to `reviewed`
- Change household status to `referred`
- View full visit history

### Area Map

- One colored circle marker per area at `center_lat`, `center_lng`
- Circle color = average risk of households in that area
- Circle size = number of households in area
- Click marker → tooltip with area name, household count, and average score

### What the Dashboard Should Not Have

- Individual household GPS pins
- Patient names or identifiable personal info
- Clinical diagnosis labels
- Treatment recommendations
- Complex charts

---

## 12. CHW Visit Flow

1. CHW taps `Start New Visit`
2. Selects a household from assigned households
3. Fills 8 radio-button questions
4. Optionally adds notes
5. Taps `Submit`
6. UI shows `Syncing...` animation while the score is generated
7. Score appears with color badge and explanation in current language
8. Buttons: `Back to Home` and `View Full Details`
9. Household latest score is updated
10. Visit appears in Visit History

---

## 13. Empty States

| Page | Message |
|------|---------|
| CHW Home | `Welcome! Start your first household visit.` |
| CHW Visit History | `No visits yet. Your completed visits will appear here.` |
| Supervisor Dashboard | `Waiting for CHW visit data. No screenings submitted yet.` |
| Supervisor Flagged Table | `No high-risk households flagged. All clear.` |

---

## 14. Error States

| Scenario | Behavior |
|----------|----------|
| Gemini fails | Retry with MiniMax |
| Both APIs fail | Use fallback weighted sum and show toast |
| Network error on save | Show toast and keep form data |
| Auth fails | Redirect to `/login` |
| Wrong role on route | Redirect to correct home |
| Household not found | 404 with `Back to Home` |

---

## 15. Consent Disclaimer

Shown on landing page and at the top of every visit form:

> Saveika is a decision-support tool. It does not diagnose mental health conditions. All data is used to support community health screening only.

---

## 16. Language Support

- Two JSON files: `en.json` and `ne.json`
- UI strings, form questions, and labels are translated
- Language stored in `localStorage`
- Default language: English
- LLM explanations are returned in both English and Nepali

---

## 17. Demo Data

### Accounts

| Email | Password | Role | Area |
|-------|----------|------|------|
| `chw1@demo.com` | `demo1234` | chw | Ward 3, Sindhupalchok |
| `chw2@demo.com` | `demo1234` | chw | Ward 5, Sindhupalchok |
| `chw3@demo.com` | `demo1234` | chw | Ward 7, Kavrepalanchok |
| `supervisor@demo.com` | `demo1234` | supervisor | All areas |

### Areas

3 areas with real Nepal ward names and approximate coordinates.

### Households

15 total:

- 8 low risk
- 4 moderate risk
- 2 high risk
- 1 critical risk

---

## 18. MVP Scope

| Feature | Build |
|---------|-------|
| Landing page + disclaimer | Yes |
| Login (email + Google OAuth) | Yes |
| Role-based routing + middleware | Yes |
| CHW pages | Yes |
| Supervisor pages | Yes |
| 8-signal form | Yes |
| `/api/score` with Gemini + MiniMax fallback | Yes |
| Fallback weighted sum | Yes |
| LLM explanation (EN + NE) | Yes |
| Supervisor status updates | Yes |
| Area map | Yes |
| Language toggle | Yes |
| Empty + error states | Yes |
| Demo data seed script | Yes |
| Simulated offline animation | Yes |

---

## 19. Out of Scope

- SMS / push / WhatsApp notifications
- Government API integrations
- Case management workflows
- Admin panel
- ML training
- Therapist directory
- Real offline with IndexedDB sync
- Ward-level GeoJSON polygons
- Advanced analytics
- Household creation by CHW
- Supervisor-to-CHW messaging
- Audit logs
- Data export

---

## 20. Build Time Estimate

| Feature | Hours |
|---------|-------|
| Project setup + schema + seed script | 3 |
| Auth + middleware | 2 |
| CHW pages | 4 |
| `/api/score` route | 2 |
| Supervisor dashboard | 4 |
| Supervisor detail + CHW activity | 2 |
| i18n | 2 |
| Empty/error states + disclaimer | 1 |
| Polish + demo testing | 3 |
| **Total** | **23** |

Leaves buffer for debugging and demo rehearsal.

---

## 21. Demo Script

1. Login as CHW on mobile browser
2. See assigned households
3. Start a new visit
4. Fill the 8 signals
5. Submit and get score + explanation
6. Switch to Supervisor
7. See flagged household in table
8. View area map with risk-colored markers
9. Open household detail and change status to `referred`

---

## 22. Positioning

**Use:** decision-support tool, early warning, evidence-based, WHO mhGAP-aligned, proactive, community health workers

**Avoid:** ML diagnosis, AI predicts mental illness, trained model, clinical assessment, detect depression
