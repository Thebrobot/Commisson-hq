# Mobile Viewport Analysis (9:16 / iPhone Pro Max)

**Target:** ~430×932px (iPhone 14/15 Pro Max) • **Breakpoint:** sm=640px, md=768px, lg=1024px

---

## Executive Summary

You're experiencing a **zoom-in effect** and **elements that can be freely moved** on mobile. This analysis identifies the causes and recommends fixes.

---

## 1. Zoom & "Elements Moving Freely"

### Likely Causes

| Issue | Cause | Impact |
|-------|-------|--------|
| **Weird zoom in** | iOS Safari double-tap zoom, or inputs <16px triggering focus zoom | Page zooms unexpectedly |
| **Elements moving freely** | Horizontal overflow + touch scroll, or overscroll bounce | Content pans/drags, feels disconnected |

### Current Viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

- No `maximum-scale` or `user-scalable=no` – allows pinch/double-tap zoom.
- No `viewport-fit=cover` – safe area on notched devices may not be handled.
- No `overflow-x: hidden` on html/body – horizontal overflow can enable panning.

---

## 2. Page-by-Page Analysis

### Index (Dashboard)

- **Layout:** Single column on mobile, responsive grid.
- **Potential issues:**
  - `EarningsHero` – large money amounts (`font-mono-tabular text-5xl`) can overflow on narrow screens.
  - `RepPayoutSummary` / `ManagerSpotlightBoard` – similar oversized typography.
  - `Rolling90DayChart` – `max-w-[200px]` could cause layout shifts.
- **Hierarchy:** Headings and stats generally scale down; some values may still overflow.

### Clients

- **Mobile:** Card layout (`lg:hidden`), table hidden. Good separation.
- **Potential issues:**
  - `ClientCard` – `font-mono-tabular text-lg` for commission; long numbers may overflow.
  - Filter buttons – `flex-wrap` helps, but on very narrow screens spacing can feel tight.
- **Edit sheet:** Full-screen on sm+, but base sheet uses `w-3/4` on mobile; content may feel narrow.

### Client Edit Sheet (Bump Out)

- **Base sheet:** `w-3/4` on mobile – only 75% of viewport width.
- **Overrides:** `w-full max-w-full` – but base `w-3/4` may still apply depending on CSS order.
- **Content:** `pl-8 pr-4` – ~10% of 390px on each side; on smallest phones may feel cramped.
- **Two-column layout:** `lg:grid-cols-2` – single column on mobile; products/setup can be long and scroll.
- **Potential issues:** Scrollable area with no `-webkit-overflow-scrolling: touch` for smooth iOS scrolling.

### Settings Sheet (Profile Bump Out)

- Same base sheet as above.
- Single column, vertical layout.
- **Potential issue:** No explicit `overflow-y-auto` on content; relies on sheet’s overflow.

### Client Profile Sheet

- Same sheet behavior.
- Compact layout; generally fine on mobile.

### HandoffKit

- Content-heavy page with checklist, progress, product links.
- **Potential issues:**
  - Long URLs or client names.
  - Pre blocks for Discord copy – can overflow if content is wide.
  - Fixed positioning in copy logic – ensure it doesn’t cause layout issues.

### HandoffList

- Card grid layout.
- Uses `min-w-0` – helps avoid overflow.
- Generally good mobile behavior.

### Commission (Rep Calculator)

- `InteractiveCalc` – `min-w-[5rem]` on inputs can add up.
- Grid: `grid-cols-1 md:grid-cols-2` – responsive.
- **Potential issue:** `xl:min-w-[27rem]` on `XpLevelBar` – forces ~432px on xl; below that it can still cause odd behavior if parent doesn’t constrain.

### Login

- `max-w-sm` – appropriate for mobile.
- Inputs use `text-base` (16px) on mobile – avoids iOS focus zoom.

---

## 3. Input Font Size (Zoom on Focus)

**Finding:** Input component uses `text-base` on mobile and `md:text-sm` on desktop. **16px on mobile is correct** and should prevent iOS auto-zoom on focus.

**Exception:** Any input with an overriding `text-sm` or smaller could trigger zoom. Audit form fields for smaller font sizes.

---

## 4. Overflow & Horizontal Scroll

### Risk Areas

1. **Body/html** – No `overflow-x: hidden`; horizontal overflow will allow panning.
2. **Base sheet (`sheetVariants`)** – `w-3/4` without `max-w-full` could cause issues when combined with wide content.
3. **Money amounts** – `font-mono-tabular` with large numbers; need `overflow-wrap` or `min-w-0` on parents.
4. **DashboardHeader rep selector** – `xl:min-w-[14rem]` (~224px); on smaller viewports parent needs proper constraints.
5. **StatsRow** – `xl:col-span-2 xl:min-w-0`; layout is responsive, but long values could still overflow.

---

## 5. Hierarchy & Sizing

### Typography

- Many `text-xs` and `text-[10px]` labels – readable but can feel small on mobile.
- `text-5xl` / `text-6xl` hero values – fine for impact but watch truncation.
- `font-mono-tabular` for numbers – ensure parent has `min-w-0` and overflow handling.

### Spacing

- `px-4 pt-4 pb-8` on mobile (`DashboardLayout`) – reasonable.
- Sheets use `p-6` – fine for mobile.
- `ClientEditSheet` – `pl-8 pr-4` may be heavy on ~360px width; consider `pl-4` or `pl-6` on mobile.

---

## 6. Recommendations

### High Priority (Zoom & Pan)

1. **Add `overflow-x: hidden` to html/body**  
   Prevents horizontal panning when content overflows.

2. **Optional: Tune viewport for app-like behavior**  
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
   ```  
   - Use only if zoom is unacceptable and accessibility trade-offs are accepted.
   - `viewport-fit=cover` helps with notched devices.

3. **Confirm input font sizes**  
   Ensure all text inputs are at least 16px on mobile to avoid focus zoom.

### Medium Priority (Layout)

4. **Sheets on mobile**  
   - Use `w-full` and `max-w-full` on mobile for Edit, Settings, and Profile sheets.
   - Add `overflow-x: hidden` to sheet content where appropriate.

5. **Large numbers and money values**  
   - Add `min-w-0` and `overflow-hidden` or `truncate` to containers for large values.
   - Consider `break-words` for very long amounts.

6. **ClientEditSheet padding**  
   - Use responsive padding: e.g. `pl-4 sm:pl-6 lg:pl-8` to avoid crowding on small screens.

### Lower Priority (Polish)

7. **Smooth scroll in sheets**  
   - Add `-webkit-overflow-scrolling: touch` to scrollable areas for better iOS feel.

8. **Touch targets**  
   - Confirm buttons and links meet ~44×44px minimum for touch.

9. **Safe areas**  
   - Use `env(safe-area-inset-*)` if using `viewport-fit=cover`.

---

## 7. Quick Wins Checklist

- [ ] `overflow-x: hidden` on `html` and `body`
- [ ] Verify sheet `w-full` on mobile (override base `w-3/4`)
- [ ] Add `touch-action: pan-y` on main scroll container (allows vertical scroll, limits horizontal)
- [ ] Reduce ClientEditSheet left padding on mobile (`pl-4` or `pl-5`)
- [ ] Ensure all `<input>` and `<select>` elements use `text-base` or 16px on mobile
- [ ] Add `min-w-0` to flex/grid children that contain long numbers

---

## 8. Testing Notes

**iPhone Pro Max:** ~430×932px  
**Common mobile:** 375×667, 390×844, 414×896  

Test with Safari on iOS and Chrome DevTools device emulation. Use "Responsive" mode at 430×932 and check:

- No horizontal scroll
- No unexpected zoom on input focus
- Sheets open edge-to-edge on mobile
- Cards and forms wrap and truncate correctly
