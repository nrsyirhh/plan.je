# CukupTak? — Architecture & Build Plan

**"Can You Afford This Trip?"** — a frontend-only budget-first travel decision assistant for Malaysian students.

---

## 1. Recommended Architecture

Keep this frontend-only and stateful — no router needed for an MVP with 3 screens.

- **Stack:** React + Vite + Tailwind CSS + JavaScript (skip TypeScript — it costs setup time you don't have in 4 days; add it later if you want).
- **Screen flow:** a single `App.jsx` holds a `screen` state (`'landing' | 'form' | 'results'`) and a `tripState` object. No `react-router` — swapping components based on state is faster to build and debug than routes for a 3-screen linear flow.
- **State shape lives in one place** (`App.jsx` or a small `TripContext`), passed down as props. With only 3 screens, prop-drilling is fine — don't add Redux/Zustand, it's wasted setup time.
- **Calculation is pure functions**, not tied to React — `costCalculator.js` and `affordabilityScore.js` take plain objects in, return plain objects out. This makes them trivial to test in the browser console and reuse anywhere (e.g. recomputing on every "Make It Affordable" toggle).
- **Data is static JSON** (`routes.json`) — imported directly, no fetch needed.

```
User fills form → tripState set → calculateAllPlans(route, days, travellers)
  → 3 plan breakdowns → ResultsPage renders them
  → user toggles a suggestion → same calculateTripCost() re-run with overrides
  → UI updates instantly (no backend round-trip)
```

---

## 2. Folder Structure

```
cukuptak/
├── public/
│   └── favicon.svg
├── src/
│   ├── data/
│   │   └── routes.json                # predefined Malaysian route data
│   ├── logic/
│   │   ├── costCalculator.js          # cost engine + suggestion generator
│   │   └── affordabilityScore.js      # 0–100 scoring formula
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.jsx
│   │   ├── landing/
│   │   │   └── Hero.jsx
│   │   ├── form/
│   │   │   ├── TripForm.jsx
│   │   │   ├── BudgetInput.jsx
│   │   │   └── PriorityToggle.jsx
│   │   └── results/
│   │       ├── AffordabilityBanner.jsx    # the big YES/NO moment
│   │       ├── AffordabilityScoreGauge.jsx
│   │       ├── BudgetSummary.jsx          # total / cost / remaining
│   │       ├── PlanCard.jsx               # one card, reused x3
│   │       ├── PlanCardGrid.jsx
│   │       ├── TransportComparisonTable.jsx
│   │       └── MakeItAffordablePanel.jsx  # the "wow" interactive moment
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── TripFormPage.jsx
│   │   └── ResultsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

**Setup commands:**
```bash
npm create vite@latest cukuptak -- --template react
cd cukuptak
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 3. Pages & Components

| Screen | Component | Responsibility |
|---|---|---|
| Landing | `Hero` | Headline, subtext, "Plan My Trip" CTA |
| Form | `TripForm` | Origin/destination select, budget, days, travellers, priority |
| Form | `BudgetInput` | RM input with visual affordance |
| Form | `PriorityToggle` | Cheapest / Fastest / Balanced pill selector |
| Results | `AffordabilityBanner` | Big YES/NO, over/under amount — the hero moment |
| Results | `AffordabilityScoreGauge` | 0–100 score, colour-coded (🟢/🟡/🔴) |
| Results | `BudgetSummary` | Total budget / estimated cost / remaining, as a simple bar |
| Results | `PlanCardGrid` + `PlanCard` | 3 cards: Cheapest / Balanced / Comfortable, each with full cost breakdown |
| Results | `TransportComparisonTable` | Car vs Bus vs Train for the chosen route |
| Results | `MakeItAffordablePanel` | Suggestion checklist that live-recalculates total cost |

**Data flow rule of thumb:** components render, `logic/` calculates. Don't put calculation math inside JSX — keep every component a thin wrapper around the pure functions so you can debug logic separately from UI bugs (important with only 4 days).

---

## 4–6. Data structure, cost engine, and scoring formula

Delivered as working code, not pseudocode, so you can drop them straight into `src/`:

- `routes.json` — 4 predefined routes from UTP Seri Iskandar (KL, Penang, Melaka, Johor Bahru) with distance, bus/train/toll costs, and 3-tier accommodation/food/activity pricing.
- `costCalculator.js` — `calculateTripCost()`, `calculateAllPlans()`, and `generateSuggestions()` (drives "Make It Affordable" by recomputing with overrides, not hardcoded savings — so it stays accurate no matter what the user changes).
- `affordabilityScore.js` — `calculateAffordabilityScore()` and `getAffordabilityLabel()`.

See the accompanying files. Formula logic explained inline as code comments.

**Design note on fuel price:** hardcode `PETROL_PRICE_PER_LITER = 2.05` (RON95) and `FUEL_CONSUMPTION_L_PER_100KM = 7` as constants at the top of `costCalculator.js` — easy to tweak live during judging Q&A if someone asks "where did this number come from?"

---

## 7. Realistic 4-Day Schedule

**Day 1 — Foundation (logic before UI)**
- Scaffold Vite + Tailwind, set up folder structure
- Drop in `routes.json`, `costCalculator.js`, `affordabilityScore.js`
- Sanity-check the math in the browser console with 2–3 manual scenarios (including the example: UTP→KL, RM300, 2 days, 2 travellers)
- Build `Hero` + `TripForm` (no styling polish yet — get data flowing)

**Day 2 — Core results screen**
- Wire form submit → `calculateAllPlans()` → `ResultsPage`
- Build `AffordabilityBanner`, `BudgetSummary`, `PlanCard` × 3
- Get the full happy path working end-to-end, ugly is fine today

**Day 3 — The "wow" feature + comparisons**
- Build `MakeItAffordablePanel` with live recompute on toggle
- Build `AffordabilityScoreGauge` and `TransportComparisonTable`
- Start visual design pass: colour palette, type, spacing, icons
- Mobile responsiveness pass

**Day 4 — Polish, edge cases, demo prep**
- Handle edge cases: RM0 budget, 1 traveller, budget wildly over/under
- Empty/invalid form states
- Final styling pass — this is what judges remember
- Deploy (Vercel/Netlify — both are free and take 5 minutes)
- Write and rehearse a 2–3 minute demo script using the UTP→KL example as your walkthrough

**Buffer discipline:** if Day 3 runs long, cut the transport comparison table before cutting "Make It Affordable" — the affordability toggle is your differentiator, the table is nice-to-have.
