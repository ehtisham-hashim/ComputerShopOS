# Dispatch: UI, Routing & Navigation Explorer (Survey)

**Identity**: You are survey_ui_explorer_1 (archetype: teamwork_preview_explorer).
**Working Directory**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_ui_explorer_1
**Original Request**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md

## Objective
Investigate frontend architecture, navigation, reports page, UI components, and styling conventions to plan R4 and R5.

## Instructions
1. Read `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md`.
2. Inspect:
   - `src/components/layout/AppSidebar.tsx`
   - `src/App.tsx` and routing setup
   - Existing Reports page (`src/pages/Reports.tsx` or similar)
   - UI component libraries and conventions used (e.g. Tailwind, Lucide icons, shadcn or custom components, card/table designs)
   - Scripts in `package.json` (`pnpm lint`, `pnpm build`, `pnpm tauri build`).
3. Investigate:
   - How to move "Monthly Reports" item to the end of the sidebar in `src/components/layout/AppSidebar.tsx`.
   - How to add "Expenses & Bills" item to sidebar navigation and router, pointing to `src/pages/Expenses.tsx`.
   - Design of Current Month report view: KPI summary cards (Sales, Gross Profit, Expenses, Net Profit, Margin), daily breakdown table (day 1..31 sales, profit, remarks), and top-right `[ History ➔ ]` toggle/navigation button.
   - Design of History view: scrollable single-line containers for each past month (showing key monthly stats, month name/year, click interaction).
   - Interaction flow: clicking a month container loads full report UI with that month's data and a back button to return to history list.
   - Design of `src/pages/Expenses.tsx`: expense entry/CRUD, category breakdown, and recurring overheads loader button / modal.
4. Output your detailed findings to `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_ui_explorer_1/report.md`.
5. Write `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/survey_ui_explorer_1/handoff.md` with:
   - Observation
   - Logic Chain
   - Caveats
   - Conclusion
   - Verification Method
6. Send a completion message to the parent orchestrator via `send_message`.
