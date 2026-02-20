# PROJECT CONTEXT: Libya Rental Marketplace (Airbnb-style)

## 1. Tech Stack & Core Dependencies
- **Framework:** Next.js 16.1.6 (App Router, Turbopack enabled).
- **Styling:** Tailwind CSS, Lucide React (Icons), `tailwindcss-animate`.
- **Database:** Supabase (Table: `listings`).
- **Maps:** MapLibre GL JS + `react-map-gl` v7/v8.
- **Date Handling:** `date-fns`, `react-day-picker`.
- **Language:** TypeScript.

## 2. CRITICAL CONFIGURATION (DO NOT BREAK)
* **Map Imports:** MUST use `import ... from "react-map-gl/maplibre"`.
    * *Reason:* Standard `react-map-gl` defaults to Mapbox and crashes. We are using MapLibre.
* **Package Installation:** MUST use `--legacy-peer-deps` flag.
    * *Reason:* Next.js 16 conflicts with strict peer dependencies of map libraries.
* **Turbopack Caching:** If "Module not found" errors persist after install, delete `.next` folder and restart.
* **Images:** Public assets are in `/public/images/` (e.g., `/images/tripoli.jpg`).

## 3. Data Structure & Localization
* **City Data:** Hardcoded in `app/page.tsx`.
    * Keys: `label` (Arabic name), `img` (path), `description` (Arabic text).
    * *Note:* Do NOT use `labelAr`. We unified everything under `label`.
* **Supabase `listings` Table:**
    * `id`, `title`, `price`, `city` (matches `label`), `lat`, `lng`, `images` (array).

## 4. Current Architecture Status
### A. Homepage (`app/page.tsx`) - ✅ COMPLETE
- Hero section with search bar.
- City discovery grid (Tripoli, Benghazi, Misrata, Al-Khoms).
- Arabic localization applied.

### B. Search Page (`app/search/page.tsx`) - ✅ COMPLETE
- **Layout:** Split-screen (Scrollable List Left / Sticky Map Right).
- **Logic:** Reads URL params (`?city=...`) to filter Supabase results.
- **Map:** Markers show property locations; clicking links to Property Details.

### C. Property Details (`app/properties/[id]/page.tsx`) - 🚧 IN PROGRESS
- **Goal:** Modularize into sub-components.
- **Components Needed:**
    1.  `PropertyGallery`: 5-image grid (1 main + 4 small).
    2.  `BookingWidget`: Sticky sidebar with `react-day-picker`.
    3.  `InfoSection`: Amenities list, Host info, and mini-map.

## 5. Next Immediate Tasks
1.  Implement `PropertyGallery` component with proper aspect ratios.
2.  Build `BookingWidget` with date range selection logic.
3.  Fetch real data from Supabase for the specific `[id]`.
