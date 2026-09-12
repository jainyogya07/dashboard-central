# ECHO Board — UI Migration Plan
## From: Void/Cyber Dark → To: Echoing Glass (PDF Design)

**Project path:** `C:\Users\user\Desktop\vsc files\aarvak`  
**Design source PDF:** `C:\Users\user\Downloads\dashboard.pdf`  
**Migration scope:** Visual/UI only — zero functional or data changes.  
**Theme identity:** Deep dark + glassmorphism panels + glowing neon accents + soft blur layers. Every surface feels like frosted glass suspended in a dark void with echoing glow.

---

## Quick page-to-PDF mapping

| Route | PDF Page | Description |
|---|---|---|
| `/intro` | Page 1 | Public landing / hero — the first face of the board |
| `/` (Board) | Page 2 | Main board after login |
| Member cards on `/intro` | Page 4 | Team intro cards (glass card style) |
| `/login` | Page 7 | Sign-in / sign-up screen |
| `/submit` | Page 9 | Achievement submission form |
| All other routes | — | Inherit the same glass theme consistently |

---

## Current system snapshot (what exists today)

| Token | Value | Role |
|---|---|---|
| `recess` | `#050507` | Flat void page background |
| `enamel` | `#0B0B12` | Opaque panel surface |
| `seam` | `#23232E` | Opaque dark border |
| `lit` | `#12121B` | Opaque hover surface |
| `lamp` | `#FF2E55` | Rose accent (primary action) |
| `chalk` | `#F2F2F5` | Primary text |
| `muted` | `#7C7C8A` | Secondary text |
| Font label | Martian Mono | All labels, buttons, timestamps |
| Effects | Starfield canvas, scanlines, RGB-split wordmark, echo-wave rings |

---

## Target system (what the glass design requires)

- **Background:** Deep dark (near-black with blue tint) with radial colour blooms
- **Panels:** `backdrop-blur` frosted glass — semi-transparent, white-alpha borders, soft glow
- **Accents:** Keep `lamp #FF2E55` rose as primary; cyan and green status colours unchanged
- **Typography:** Archivo + Instrument Sans + Martian Mono — same families, glass-appropriate weights
- **Effects:** Glass blur, glow borders, soft inner shadows, gradient overlays, haze bloom updated to blue-violet tones
- **Keep:** Starfield, RGB-split glitch wordmark, echo-wave rings, LED status dots

---

## Step 1 — Design tokens: `tailwind.config.js` + `src/index.css`

**Files:**
- `tailwind.config.js`
- `src/index.css`

### 1a. `tailwind.config.js` — colour + shadow + radius updates

**Colours** — rename meanings to glass, keep token names so no component import breaks:

```js
// theme.extend.colors — glass palette
recess:   '#03030A',   // the void — deepest background (was #050507)
enamel:   '#0A0A18',   // glass panel base tint (was #0B0B12)
lit:      '#131328',   // hover state on glass (was #12121B)
seam:     '#1C1C2E',   // hairline border (was #23232E)
lip:      '#1E1E3A',   // deeper raised surface (was #34343F)
chalk:    '#F0F0FF',   // primary text — slightly blue-tinted (was #F2F2F5)
muted:    '#7878A0',   // secondary text (was #7C7C8A)
dim:      '#44445A',   // tertiary / disabled (was #4A4A57)
graphite: '#03030A',   // text on solid fills
lamp:     '#FF2E55',   // rose — primary action (UNCHANGED)
ember:    '#7E1128',   // rose dimmed resting (UNCHANGED)
cyan:     '#35D6FF',   // info / sent-back (UNCHANGED)
posted:   '#3BE8A6',   // verified green (UNCHANGED)
amber:    '#FFC24D',   // in-queue amber (UNCHANGED)
flag:     '#FF5C38',   // destructive (UNCHANGED)
flare:    '#FF8A6B',   // error text (UNCHANGED)
```

**Shadows** — add glass-specific tokens:

```js
boxShadow: {
  none: 'none',
  slot:  'inset 0 1px 0 0 rgba(255,255,255,0.07)',
  lip:   'inset 0 -1px 0 0 rgba(255,255,255,0.03)',
  // Glass panel: soft lift
  lifted: '0 0 0 1px rgba(255,255,255,0.07), 0 24px 48px -16px rgba(0,0,0,0.85)',
  // Focus ring: lamp unchanged
  ring: '0 0 0 2px #03030A, 0 0 0 4px #FF2E55',
  // Primary button glow unchanged
  glow: '0 0 22px rgba(255,46,85,0.20), inset 0 0 22px rgba(255,46,85,0.10)',
  'glow-lg': '0 0 36px rgba(255,46,85,0.36), inset 0 0 26px rgba(255,46,85,0.16)',
  'glow-danger': '0 0 24px rgba(255,92,56,0.28)',
  // Glass panel ambient
  'glass-panel': '0 0 0 1px rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.60)',
  // Member card hover glow
  'card-hover': '0 0 0 1px rgba(255,255,255,0.14), 0 0 28px rgba(53,214,255,0.14)',
}
```

**Border radius** — loosen for glass aesthetic:

```js
borderRadius: {
  none:  '0',
  slot:  '6px',      // inputs, small controls
  panel: '12px',     // glass panels
  card:  '16px',     // member intro cards (new)
  pill:  '9999px',   // status pills, LED dots
}
```

### 1b. `src/index.css` — glass base + utilities

In `@layer base`, update haze bloom gradient from rose-centered to blue-violet midnight:

```css
.haze {
  background:
    radial-gradient(60% 34% at 50% 46%, rgba(80,60,200,0.14), transparent 70%),
    radial-gradient(90% 40% at 50% 104%, rgba(53,214,255,0.10), transparent 70%),
    radial-gradient(50% 30% at 18% 8%, rgba(255,46,85,0.08), transparent 70%);
}
```

In `@layer components`, add glass utilities:

```css
/* Frosted glass panel — used by BoardPanel and any section container */
.glass-panel {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.55);
}

/* Glass card — member intro cards, heavier blur */
.glass-card {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 12px 40px rgba(0,0,0,0.65);
}

/* Glass input — form fields */
.glass-input {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}
.glass-input:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); }
.glass-input:focus { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.07); }
```

Keep untouched: all `.echo-host`, `.echo-wave`, `.echo-rest`, `.wm*`, `.total-glow`, `.led*`, `.scanRoll`, `.glass::after` scanlines.

**After Step 1:** Tokens and utilities exist. Pages still look the same until components adopt them.

---

## Step 2 — `BoardPanel.tsx` → Glass panel primitive

**File:** `src/components/board/BoardPanel.tsx`

Replace the opaque enamel surface with the `.glass-panel` utility. This propagates to every page that uses `<BoardPanel>`.

```tsx
// Before:
<div className={`bg-enamel border-inset border-seam rounded-panel ${padded ? 'p-panel' : ''}`}>

// After:
<div className={`glass-panel rounded-panel ${padded ? 'p-panel' : ''}`}>
```

No prop changes. No import changes.

**After Step 2:** Every `<BoardPanel>` across all pages gets glass treatment automatically.

---

## Step 3 — `Signal.tsx` — update haze, add VoidScreen shimmer

**File:** `src/components/signal/Signal.tsx`

### 3a. `Haze` component
Update the inline style to the new blue-violet haze (same as `src/index.css` — but `Haze` uses an inline style, not the `.haze` CSS class, so update both places).

```tsx
// Haze() — update the style prop:
style={{
  background: `
    radial-gradient(60% 34% at 50% 46%, rgba(80,60,200,0.14), transparent 70%),
    radial-gradient(90% 40% at 50% 104%, rgba(53,214,255,0.10), transparent 70%),
    radial-gradient(50% 30% at 18% 8%, rgba(255,46,85,0.08), transparent 70%)
  `
}}
```

### 3b. `VoidScreen` — add top-edge glass shimmer
Inside `VoidScreen`, after `<Haze />`, add a top-edge reflection layer:

```tsx
{/* Glass surface top-edge light reflection */}
<div
  className="absolute inset-x-0 top-0 h-[400px] pointer-events-none -z-[5]"
  aria-hidden="true"
  style={{
    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 65%)'
  }}
/>
```

### 3c. Keep unchanged
- `Starfield` — no changes
- `Wordmark` — no changes (RGB-split wordmark is perfect for glass)

---

## Step 4 — `PlainLayout.tsx` — Login/Onboarding wrapper

**File:** `src/components/layout/PlainLayout.tsx`

This wraps `/login` (PDF Page 7) and `/onboarding`. After Step 2, `BoardPanel` is already glass. Now polish the layout frame:

- The eyebrow label: already `label text-muted` (Martian Mono) — keep
- The animated signal dot: keep as-is
- `Wordmark size="board"` — keep
- Add a soft glow bloom behind the form card using a `before:` sibling div:

```tsx
// Inside the max-w-form wrapper, before {children}, add:
<div
  className="absolute inset-0 pointer-events-none rounded-panel -z-10"
  style={{ boxShadow: '0 0 80px rgba(255,46,85,0.08), 0 0 140px rgba(53,214,255,0.06)' }}
  aria-hidden="true"
/>
```

- The `{children}` div should be `relative` to contain the glow
- Tagline text: update from `text-chalk/85` to `text-chalk/75 text-lg font-light`

---

## Step 5 — `BoardLayout.tsx` — Board/Submit wrapper

**File:** `src/components/layout/BoardLayout.tsx`

Read the file first. The sticky header (BoardHeader) should become a glass strip:

Update the header container's className to:
```
sticky top-0 z-header
backdrop-blur-md bg-recess/70
border-b border-white/[0.06]
```

The page body wrapper stays the same (`max-w-board` centred column). Ensure a `VoidScreen` or equivalent (Starfield + Haze) is present as the page background — if `BoardLayout` doesn't currently use `VoidScreen`, wrap the outermost div with `VoidScreen` or apply `min-h-screen bg-recess relative` with `Starfield` and `Haze` inserted.

---

## Step 6 — `/intro` page (PDF Pages 1 + 4)

**File:** `src/pages/Intro.tsx`

### 6a. Hero section (PDF Page 1)
- Keep `VoidScreen` wrapper — starfield + haze + glass shimmer (from Step 3) all active
- `Wordmark size="hero"` — keep, already correct
- Tagline `"we echo around win"`: update to `text-xl text-chalk/75 font-light tracking-wider mb-16`
- Sign In `Button`: keep `size="lg"`, add `className="px-16"` for generous padding
- Optionally add a glass pill between wordmark and button showing sprint status or team name

### 6b. Member intro cards (PDF Page 4)
Replace the existing `<BoardPanel>` wrapping each member card with a proper glass card:

```tsx
// Replace the BoardPanel + div combo per member with:
<div
  key={member.id}
  className="
    glass-card rounded-card p-6
    flex flex-col items-center text-center gap-4
    hover:shadow-card-hover
    hover:[border-color:rgba(255,255,255,0.18)]
    transition-[box-shadow,border-color] duration-300
  "
>
  <Avatar name={member.full_name} url={member.url} size="xl" className="ring-2 ring-white/10" />
  <div>
    <h3 className="text-chalk font-display font-bold text-lg leading-tight">
      {member.full_name}
    </h3>
    <span className="
      mt-2 inline-block px-3 py-1 rounded-pill
      bg-white/[0.07] border border-white/[0.10]
      text-xs text-muted font-mono tracking-widest uppercase
    ">
      {member.department}
    </span>
  </div>
</div>
```

Grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6` — unchanged.

Section heading `"Meet Our Team"`: update to `text-xl text-chalk/60 font-mono tracking-widest uppercase mb-8 text-center`.

---

## Step 7 — `/` Board page (PDF Page 2)

**Files:**
- `src/pages/Board.tsx`
- `src/components/board/Meter.tsx`
- `src/components/board/FeedRow.tsx`
- `src/components/board/NumberCard.tsx`

### 7a. Board total (`NumberCard`)
- The outer container: wrap in a glass panel with extra glow behind it
- Add a radial bloom div (`position: absolute, -z-10`) behind the number: `rgba(255,46,85,0.10)` rose bloom
- The number itself: keep Archivo `board` size + `total-glow` text-shadow — no change
- Label "Posted to the board": keep `text-xs text-muted`

### 7b. Day Meter (`Meter.tsx`)
Update bar styling:
- Track: `bg-white/[0.06] rounded-pill` (was `bg-seam`)
- Fill: `bg-lamp rounded-pill` with `box-shadow: 0 0 8px rgba(255,46,85,0.50)`

### 7c. Feed rows (`FeedRow.tsx`)
Update hover and divider treatment:
- Row hover: `hover:bg-white/[0.04]` (was `hover:bg-lit`)  
- Row divider: `border-b border-white/[0.05] last:border-0` (replace `<Seam>` if used between rows)
- Text colours: `chalk` for name and activity, `chalk/50` for date — no change needed

### 7d. "ON THE BOARD" and "YOUR CALLS" section containers
- `SignLabel`: update to `label text-chalk/40` (was `text-muted`) for glass contrast
- The surrounding `BoardPanel` is already glass after Step 2

### 7e. "YOUR CALLS" list items (your own submissions)
Each item shows name + status. The status LED dots already glow — keep as-is.
Row hover: `hover:bg-white/[0.04]` consistent with feed rows.

---

## Step 8 — `/login` page (PDF Page 7)

**Files:**
- `src/pages/Login.tsx`
- `src/components/primitives/Field.tsx`

### 8a. `Login.tsx`
After Steps 2 and 4, the `PlainLayout` and `BoardPanel` are already glass. Check:
- The form `BoardPanel` renders as glass — confirm visually
- The "Sign in" / "Create account" button: primary variant, full-width — keep
- Mode switch `TextButton`: keep `tone="signal"` for the lamp-coloured link

### 8b. `Field.tsx` — glass input styles
Update the `Input` component's className:

```tsx
// Input base className — add glass-input class or inline equivalents:
className="
  w-full rounded-slot px-4 py-3
  bg-white/[0.05] border border-white/[0.08]
  text-chalk placeholder:text-muted
  focus:outline-none focus:border-white/[0.22] focus:bg-white/[0.07]
  transition-[border-color,background-color] duration-200
"
```

Apply the same glass style to `<Select>` and `<Textarea>` components inside `Field.tsx`.

---

## Step 9 — `/submit` page (PDF Page 9)

**File:** `src/pages/Submit.tsx`

After Steps 2, 5, and 8, most of the glass look comes for free. Check and update:

- Page heading "Submit achievement": Archivo `xl`, chalk — keep
- Intro text: `text-chalk/65` — soften slightly
- Activity `<Select>`: glass style from Step 8 applies
- Date `<Input>`: glass style from Step 8 applies
- Details `<Textarea>`: glass style from Step 8 applies
- File drop zone (the `FilePicker` / `FileDrop` component or its inline implementation):

```tsx
// Drop zone container:
className="
  relative rounded-panel p-8
  border-2 border-dashed border-white/[0.12]
  bg-white/[0.03]
  hover:border-white/[0.22] hover:bg-white/[0.05]
  transition-[border-color,background-color] duration-200
  text-center cursor-pointer
"
```

- "Or paste a link" input: same glass-input style
- Submit / Cancel buttons: keep existing variants (primary = lamp, quiet = dim)

---

## Step 10 — Remaining pages: glass consistency pass

Apply the glass theme to every remaining page. For each: confirm layout wrapper (BoardLayout or PlainLayout), then audit any hardcoded colour classes.

### Step 10a — `Onboarding.tsx`
- Uses `PlainLayout` → already glass after Step 4
- Sprint track radio cards: wrap each in a glass-card style `div` instead of plain bordered boxes
- Track card selected state: `border-lamp/60 bg-lamp/[0.08]` glow

### Step 10b — `Review.tsx` (The Booth)
Most complex page. Two-pane layout at `lg`.

- Queue list pane: glass panel left sidebar — `glass-panel` or `backdrop-blur-md bg-white/[0.03] border-r border-white/[0.06]`
- Each queue row: `hover:bg-white/[0.05]`, selected row: `bg-white/[0.07] border-l-2 border-lamp`
- Detail pane: glass panel `glass-panel`
- Proof image viewer: glass overlay container
- Decision buttons (Verify/Ask/Reject): keep existing variants
- Counts in header (Queue / Sent back / Posted): glass pill style `px-3 py-1 rounded-pill bg-white/[0.07] border border-white/[0.08]`

### Step 10c — `RollCall.tsx`
- Checkbox rows: `hover:bg-white/[0.04]`, checked state: `bg-white/[0.06]`
- "Record attendance" button: primary variant — keep

### Step 10d — `Export.tsx`
- Surrounding panels: glass after Step 2
- Code/JSON block: stays monospace with `bg-enamel/80 rounded-panel p-4`; add `border border-white/[0.06]`
- Copy/Download buttons: secondary variant

### Step 10e — `Admin.tsx`
- Tables: glass table rows — `border-b border-white/[0.05]`, hover `bg-white/[0.04]`
- Role badges: glass pill `bg-white/[0.07] border border-white/[0.10] rounded-pill`

### Step 10f — `Profile.tsx`
- Profile card: upgrade to `glass-card rounded-card` treatment
- Avatar: `ring-2 ring-white/10`
- Stat rows: `border-b border-white/[0.05]`

### Step 10g — `Placeholders.tsx` (404)
- Uses `PlainLayout` → already glass
- Empty slot visual: a `glass-panel rounded-panel` blank square with a dim label "Nothing posted here."
- "Back to the board" link: `TextButton tone="signal"`

---

## Step 11 — Status and feedback components

**Files:**
- `src/components/status/StatusPill.tsx` (or wherever status pills are rendered)
- `src/components/feedback/EmptyState.tsx`
- `src/components/feedback/Notice.tsx`
- `src/components/primitives/Skeleton.tsx`

### StatusPill / LED dots
- The LED dots already glow (`.led-posted`, `.led-queue`, etc.) — no changes
- Pill wrapper (if any): `bg-white/[0.06] border border-white/[0.08] rounded-pill px-3 py-1`

### EmptyState / ErrorState
- Icon or empty-slot visual: glass container `glass-panel rounded-panel p-8`
- Headline: `text-chalk font-display font-bold text-xl`
- Body: `text-muted text-base`

### Notice (info/warn/error banners)
- Info (`cyan` tone): `bg-cyan/[0.08] border border-cyan/[0.18] rounded-slot text-cyan/90`
- Warn (`amber` tone): `bg-amber/[0.08] border border-amber/[0.18] rounded-slot text-amber/90`
- Error (`flag` tone): `bg-flag/[0.08] border border-flag/[0.18] rounded-slot text-flare`
- Good/success: `bg-posted/[0.08] border border-posted/[0.18] rounded-slot text-posted/90`

### Skeleton
- Update shimmer from `bg-seam animate-pulse` to `bg-white/[0.05] animate-pulse rounded-slot`

---

## Step 12 — Button and Controls polish

**Files:**
- `src/components/primitives/Button.tsx`
- `src/components/primitives/Controls.tsx`

### Button variants — check on glass backgrounds
- **Primary**: lamp border/glow — confirm `shadow-glow` reads correctly on glass (likely fine)
- **Secondary**: update `border-lip` → `border-white/[0.12]`, `hover:border-chalk` → `hover:border-white/[0.28]`
- **Destructive**: `border-flag/45` → keep; `hover:shadow-glow-danger` → keep
- **Quiet**: `hover:bg-chalk/[0.04]` → `hover:bg-white/[0.04]`
- Keep all echo-wave animations — they are perfect for glass

### TextButton
- `hover:bg-chalk/[0.04]` → `hover:bg-white/[0.04]`
- `signal` tone: keep `text-lamp/85 hover:text-lamp hover:bg-lamp/[0.06]`

### IconButton (in Controls.tsx)
- `hover:bg-chalk/[0.06]` → `hover:bg-white/[0.05]`

---

## Step 13 — Visual QA checklist

Run through each route and verify:

| Check | What to look for |
|---|---|
| Contrast ≥ 4.5:1 | All text on glass panels — use browser DevTools accessibility panel |
| Glass blur renders | `backdrop-blur` works in Chrome, Firefox, Safari (WebKit prefix included) |
| Glow containment | Rose/cyan glows don't leak into adjacent glass panels unexpectedly |
| Mobile 375px | Panels don't clip; blur not clipped by `overflow: hidden` parents |
| Reduced motion | Starfield freezes, wordmark holds still, echo-waves removed |
| Focus rings | `shadow-ring` lamp ring visible against every glass surface |
| LED status dots | `led-posted` (green), `led-queue` (amber), `led-back` (cyan) visible on dark glass |
| Wordmark glitch | RGB-split still fires every ~3–7 seconds on `/intro` and `/login` |
| Board total glow | `total-glow` text-shadow still pops on the glass panel background |
| Performance | No jank on multiple stacked `backdrop-blur` panels on mobile — test on a real device |

---

## Step 14 — Build and deploy check

```bash
# In the project directory:
npm run build

# Confirm:
# - No TypeScript errors
# - No Tailwind class compile errors (rounded-card, glass-panel etc. resolve)
# - dist/ has no service_role key (grep check)
grep -r "service_role" dist/   # must return nothing

# Deploy to Vercel as usual
```

---

## Full implementation order summary

| Step | Scope | Files |
|---|---|---|
| **1** | Design tokens | `tailwind.config.js`, `src/index.css` |
| **2** | Glass panel primitive | `src/components/board/BoardPanel.tsx` |
| **3** | Signal layer (haze + shimmer) | `src/components/signal/Signal.tsx` |
| **4** | PlainLayout (login/onboarding wrapper) | `src/components/layout/PlainLayout.tsx` |
| **5** | BoardLayout (board/submit wrapper) | `src/components/layout/BoardLayout.tsx` |
| **6** | `/intro` — hero + glass member cards (PDF p1, p4) | `src/pages/Intro.tsx` |
| **7** | `/` Board — total, meter, feed, calls (PDF p2) | `Board.tsx`, `Meter.tsx`, `FeedRow.tsx`, `NumberCard.tsx` |
| **8** | `/login` — glass form (PDF p7) | `Login.tsx`, `Field.tsx` |
| **9** | `/submit` — glass form (PDF p9) | `Submit.tsx` |
| **10a** | `Onboarding.tsx` | `src/pages/Onboarding.tsx` |
| **10b** | `Review.tsx` (The Booth) | `src/pages/Review.tsx` |
| **10c** | `RollCall.tsx` | `src/pages/RollCall.tsx` |
| **10d** | `Export.tsx` | `src/pages/Export.tsx` |
| **10e** | `Admin.tsx` | `src/pages/Admin.tsx` |
| **10f** | `Profile.tsx` | `src/pages/Profile.tsx` |
| **10g** | `Placeholders.tsx` (404) | `src/pages/Placeholders.tsx` |
| **11** | Status + feedback components | `StatusPill`, `EmptyState`, `Notice`, `Skeleton` |
| **12** | Button + Controls polish | `Button.tsx`, `Controls.tsx` |
| **13** | Visual QA | All routes |
| **14** | Build + deploy | `npm run build` |

---

## Hard constraints — never break these

- **No functional changes** — routes, guards, Supabase calls, RPC names, all data flow stays identical
- **No new routes or features** — only class names and visual output change
- **No new npm dependencies** — Tailwind v3, all existing packages
- **`tailwind.config.js` stays v3 syntax** — never use `@theme` or any Tailwind v4 pattern
- **`service_role` key never in `src/`** — only `VITE_SUPABASE_ANON_KEY` in browser code
- **All component props/APIs stay identical** — consumers of `<BoardPanel>`, `<Button>` etc. are not edited

---

## Tips for vibe-coding each step

- Always **read the target file first** before writing any replacement code
- The PDF cannot be opened by AI directly — use the design direction in this plan
- Glass panels: start with `bg-white/[0.04]` to `bg-white/[0.06]` range; go higher if it looks too dark
- `backdrop-blur-md` = ~12px blur for panels; `backdrop-blur-lg` = ~16px for cards on top of panels
- The `seam` token in Tailwind maps to `#1C1C2E` — but for borders, prefer `border-white/[0.08]` directly
- The `rounded-card` token is new — confirm `tailwind.config.js` has `card: '16px'` under `borderRadius` (Step 1)
- Keep `.total-glow` and `.led*` CSS classes — they carry the ECHO identity
- Keep the Martian Mono `font-mono` labels — they are the "instrumentation voice" of the system
