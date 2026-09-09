# Dispatch: e2e_test_writer_1

**Identity**: You are e2e_test_writer_1 (teamwork_preview_test_writer).
**Working Directory**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_test_writer_1
**Project Scope**: /home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md
**Original User Request**: /home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md
**Parent Orchestrator**: sub_orch_e2e_1 (conv ID: 7eef4fd8-0661-4fa1-a41c-da6d2258ba41)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Inputs & Specifications
1. Read `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/ORIGINAL_REQUEST.md` (requirements R1..R5 and initial fixes).
2. Read `/home/ehtisham/Desktop/Projects/ComputerShopOS/PROJECT.md` (Features F1..F16, Architecture, Interface Contracts).
3. Read `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_spec_miner_1/report.md` (contains the exact ground truths, formulas, edge cases, and test matrices for Tiers 1-4).
4. Read `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_explorer_1/report.md` (runner architecture: `npx tsx --test`, `node:test`, `node:assert`, TypeScript compile conventions).
5. Read `/home/ehtisham/Desktop/Projects/ComputerShopOS/.agents/e2e_explorer_2/report.md` (DB isolation pattern: in-place `memoryStore` snapshot & restore in `beforeEach()`, public interface contracts).

## Deliverables to Implement
1. `/home/ehtisham/Desktop/Projects/ComputerShopOS/TEST_INFRA.md`:
   - Follow the Project Pattern `TEST_INFRA.md` template.
   - Outline test philosophy (opaque-box, requirement-driven), feature inventory (F1..F16), runner architecture, real-world application scenarios, and tier thresholds.
2. `tests/e2e/harness.ts`:
   - Setup & teardown hooks using `beforeEach`/`afterEach`.
   - In-place `memoryStore` snapshot & restore fixture (`dbReset`) so tests are completely isolated.
   - Dynamic/safe contract loaders for domain services (`expenseService`, `reportService`, `posService`, etc.) so that tests fail with informative assertion messages if a service/function is pending implementation rather than crashing the TS loader.
   - Baseline constants from `Monthly Report 2026.xlsx` (March-August 2026 ground truths).
3. `tests/e2e/tier1_feature_coverage.test.ts`:
   - >= 5 test cases per feature for F1 through F16 (at least 80 test cases).
   - Verifies baseline functional contracts in isolation.
4. `tests/e2e/tier2_boundary_limits.test.ts`:
   - >= 5 boundary/corner test cases per feature for F1 through F16 (at least 80 test cases).
   - Tests edge inputs, 28/29/30/31-day months, leap years, negative amounts, 0-day sales, July 2025 typo normalization, special characters, SQL injection resistance.
5. `tests/e2e/tier3_cross_feature.test.ts`:
   - 25 pairwise cross-feature interaction scenarios (e.g. expense creation recalculating monthly report net profit, recurring overhead generation idempotency, voiding sales restoring inventory and updating report totals).
6. `tests/e2e/tier4_application_flows.test.ts`:
   - 5 comprehensive real-world shop operating workflows (Multi-day retail cycle, month-end closing, deficit management, inventory lifecycle with profit tracking, 6-month historical audit).
7. `tests/e2e/runner.ts`:
   - Standalone test orchestrator that runs all 4 tiers, aggregates results, logs formatted summary table, and exits with code 0 on pass or 1 on fail.

## Verification
- Run `pnpm lint` (`tsc --noEmit`) to verify zero TypeScript errors.
- Run `npx tsx tests/e2e/runner.ts` and `npx tsx --test tests/e2e/**/*.test.ts` to verify the runner executes cleanly and tests are properly evaluated.
- Document test counts, execution logs, and pass/fail statistics in your handoff report.

## 2026-09-04T11:48:15Z
Received dispatch from sub_orch_e2e_1 with tasks for TEST_INFRA.md, harness.ts, tier1..tier4 tests, and runner.ts.
