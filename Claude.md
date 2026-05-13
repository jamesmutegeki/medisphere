# ChoreFlow: Chore Assignment Web App

## WHAT: Project Overview & Tech Stack
A calendar-based web application for household chore management.
- **Frontend:** React (Vite), Tailwind CSS
- **State Management:** React Context API (Chore/User data)
- **Icons/UI:** Lucide-React, Headless UI (for Modals/Transitions)
- **Persistence:** LocalStorage (initial) / Supabase (future)

## WHY: Core Purpose
To provide a visual, time-allocated schedule for domestic tasks with a specialized "photo-hover" interface for quick identification of responsible parties.

## HOW: Essential Commands
- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Test:** `npm test`

## Key Directories
- `src/components/calendar/`: Core calendar grid and day cells
- `src/components/ui/`: Reusable buttons, inputs, and modals
- `src/hooks/`: `useChores.js`, `useTheme.js`
- `src/context/`: State providers for global theme and chore data
- `src/utils/`: Date manipulation logic and color mapping

## Additional Documentation
See these files in `.claude/docs/` for specific implementation details:
1. **Architectural Patterns:** Design decisions for state and UI.
2. **Component Specs:** Details on the Hover-Popout and Time-Allocation logic.
3. **Theming:** Guide to the Blue/White and Dark Mode implementation.