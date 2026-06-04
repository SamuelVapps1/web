# Wider Site Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen the shared site layout on desktop and make the gallery feel more premium with slightly larger, airier cards.

**Architecture:** Update the shared container widths in `app/globals.css` so every page gets the same broader canvas. Then tune the gallery grid and card proportions to use the extra width without making the page feel sparse.

**Tech Stack:** Next.js App Router, CSS, existing shared layout classes.

---

### Task 1: Widen shared containers

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update shared width tokens**

```css
.wrap { max-width: 1320px; margin: 0 auto; padding-inline: clamp(1.25rem, 3vw, 2.25rem); }
.wrap--narrow { max-width: 1220px; }
.topbar { max-width: 1320px; }
.pagehead { max-width: 1320px; }
.hero { max-width: 1320px; }
```

- [ ] **Step 2: Recheck page balance**

Run: open the homepage and gallery in the browser
Expected: less empty space on the sides, but text remains readable and centered.

### Task 2: Polish gallery presentation

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Give the gallery more breathing room**

```css
.gallery { gap: clamp(1.15rem, 1.9vw, 2rem); }
.g-item { gap: 1rem; }
.g-item__pair { gap: 4px; padding: 4px; border-radius: var(--radius-lg); }
.g-item__breed { font-size: 1.08rem; }
```

- [ ] **Step 2: Keep the desktop grid at four columns**

```css
.gallery { grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (max-width: 1200px) { .gallery { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
```

- [ ] **Step 3: Verify the gallery feels premium**

Run: open `/galeria` in the browser
Expected: cards feel wider and more balanced, with less cramped content.

### Task 3: Commit the layout update

**Files:**
- Modify: none

- [ ] **Step 1: Commit the CSS changes**

```bash
git add app/globals.css docs/superpowers/plans/2026-06-05-wide-premium-layout.md
git commit -m "Widen site layout and polish gallery"
```

- [ ] **Step 2: Push to origin**

```bash
git push origin master
```
