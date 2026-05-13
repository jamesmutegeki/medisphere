# Chore_manager - TODO

- [x] Implement Chore Timer & Alarm in `src/components/calendar/Calendar.jsx`
  - [ ] Add Start button per assignment in Assignment panel
  - [ ] Live timer counts up and triggers audible alarm when exceeds durationMinutes
  - [ ] Display elapsed time in UI


- [ ] Implement Face-Pop Hover Effect in `src/components/calendar/Calendar.jsx`
  - [ ] Add hover-triggered popover on each day cell
  - [ ] Popover shows person photo (Data URL from localStorage), chore name, start time, and duration for chores scheduled that day
  - [ ] Ensure this is in addition to the detailed assignment list below calendar

- [ ] Refactor Calendar grid logic for accurate May 2026 in `src/components/calendar/Calendar.jsx`
  - [ ] Compute correct weekday offset for May 2026
  - [ ] Ensure 31 days are represented for May
  - [ ] Keep month/year navigation functioning

- [ ] UI/Theme refactor in `src/components/calendar/Calendar.jsx`
  - [ ] Default Light Mode background pure white: `bg-white`
  - [ ] Dark Mode background pure black: `bg-black`
  - [ ] Use ThemeContext/dark class approach

- [ ] Navbar header month/year color in `src/components/calendar/Calendar.jsx`
  - [ ] Render Month (“May”) as `text-blue-600`
  - [ ] Render Year (“2026”) as `text-indigo-500`

- [ ] Test/run app manually: start timer, trigger alarm, hover popover, verify May 2026 layout, verify theme backgrounds and header colors

