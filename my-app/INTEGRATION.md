# FloatingFoodHero Integration & shadcn/Tailwind/TypeScript Setup

This project now supports **Tailwind CSS**, **TypeScript**, and a **shadcn-style** layout. The `FloatingFoodHero` component lives in `src/components/ui/`.

---

## Current Setup (Already Done)

- **Tailwind CSS v3** – `tailwind.config.js`, `postcss.config.js`, and `src/index.css` with `@tailwind` directives.
- **Path alias** – `@/` points to `src/` in `vite.config.js` and `tsconfig.json`.
- **`cn()` utility** – `src/lib/utils.ts` (uses `clsx` + `tailwind-merge`) for class merging.
- **Float animation** – Defined in `tailwind.config.js` under `theme.extend.keyframes.float` and `animation.float`.
- **Component** – `src/components/ui/hero-section-7.tsx` (FloatingFoodHero).
- **Demo** – `src/components/ui/floating-food-hero-demo.tsx` (Unsplash images).

---

## Why `components/ui`?

- **shadcn/ui** and many design systems expect a single place for reusable UI pieces (e.g. `components/ui`).
- A fixed path makes imports consistent (`@/components/ui/...`) and keeps layout, forms, and heros together.
- If your default was something else (e.g. `src/components` only), creating **`src/components/ui`** and putting shared primitives there keeps future shadcn installs and design-system docs aligned.

---

## How to Use the Hero in the App

**Option A – Replace the current hero on the home page**

In `App.jsx` (or your home page component), import and render the demo:

```jsx
import FloatingFoodHeroDemo from '@/components/ui/floating-food-hero-demo';

// Inside your home view:
<FloatingFoodHeroDemo />
```

**Option B – Use the component with your own content**

```jsx
import { FloatingFoodHero } from '@/components/ui/hero-section-7';

const myImages = [
  { src: 'https://...', alt: '...', className: 'w-40 top-10 left-10 animate-float' },
  // ...
];

<FloatingFoodHero
  title="Your headline"
  description="Your subtext."
  images={myImages}
/>
```

**Option C – Preview only the hero**

In `src/main.jsx`, temporarily swap the app:

```jsx
import FloatingFoodHeroDemo from '@/components/ui/floating-food-hero-demo';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FloatingFoodHeroDemo />
  </StrictMode>,
);
```

---

## Optional: Full shadcn CLI Setup

If you want the full shadcn/ui workflow (more components, themes):

1. **Install and run the CLI**

   ```bash
   npx shadcn@latest init
   ```

2. When prompted:
   - **Style:** Default or New York.
   - **Base color:** e.g. Slate.
   - **CSS variables:** Yes (so `bg-background`, `text-primary`, etc. work).
   - **Tailwind config:** Use existing (we already have Tailwind).
   - **Path for components:** `@/components` (or keep `@/components/ui`).
   - **Path for utils:** `@/lib/utils` (already present).
   - **React Server Components:** No (for a Vite SPA).
   - **Write components with:** TypeScript.

3. **Add more components**

   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add card
   ```

After init, shadcn will add a `components.json` and may add CSS variables in your global CSS. You can then switch `FloatingFoodHero` back to `bg-background` / `text-primary` / `text-muted-foreground` if you use those variables.

---

## Optional: Tailwind v4

The snippet you had used Tailwind v4-style CSS:

```css
@import "tailwindcss";
@import "tw-animate-css";
@keyframes float { ... }
```

This project is currently on **Tailwind v3** with a JS config and `@tailwind base/components/utilities` in `index.css`. The **float** animation is defined in **`tailwind.config.js`** under `theme.extend.keyframes` and `animation.float`, so `animate-float` works as-is.

If you later move to Tailwind v4:

1. Install Tailwind v4 and the Vite plugin (see [Tailwind v4 docs](https://tailwindcss.com/docs/installation)).
2. Replace the `@tailwind` lines in `index.css` with `@import "tailwindcss";` (and optionally `tw-animate-css`).
3. Move the `@keyframes float` (and any custom theme) into that CSS file or the new v4 config.

---

## Dependencies Added

- `tailwindcss`, `postcss`, `autoprefixer` (dev)
- `clsx`, `tailwind-merge` (deps for `cn()`)
- `typescript` (dev, for TS/TSX and type-checking)

---

## Data / Props for FloatingFoodHero

- **title** (string) – Main heading.
- **description** (string) – Subtext below the heading.
- **images** – Array of `{ src, alt, className }` (use `className` for position/size and `animate-float` for the floating effect).
- **className** (optional) – Extra classes on the section.

No global state or context is required. Assets are image URLs (e.g. Unsplash in the demo); no local image files are required.
