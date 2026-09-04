/**
 * ComputerShopOS E2E Test Runner Orchestrator
 *
 * Discovers and executes all test tiers (Tiers 1-4), captures structured metrics,
 * formats an executive summary table, and exits with code 0 on 100% pass or 1 on failure.
 *
 * Usage:
 *   npx tsx tests/e2e/runner.ts               # Run all 4 tiers
 *   npx tsx tests/e2e/runner.ts --tier=1      # Run Tier 1 only
 *   npx tsx tests/e2e/runner.ts --tier=2      # Run Tier 2 only
 *   npx tsx tests/e2e/runner.ts --tier=3      # Run Tier 3 only
 *   npx tsx tests/e2e/runner.ts --tier=4      # Run Tier 4 only
 */

import { spawnSync } from "node:child_process";
import * as path from "node:path";

interface TierConfig {
  tierNumber: number;
  name: string;
  scope: string;
  filePath: string;
}

const TIERS: TierConfig[] = [
  {
    tierNumber: 1,
    name: "Feature Coverage (Isolation)",
    scope: "F1 - F16 Baseline Contracts",
    filePath: "tests/e2e/tier1_feature_coverage.test.ts",
  },
  {
    tierNumber: 2,
    name: "Boundary & Limit Cases",
    scope: "F1 - F16 Edge & Stress Limits",
    filePath: "tests/e2e/tier2_boundary_limits.test.ts",
  },
  {
    tierNumber: 3,
    name: "Cross-Feature Interactions",
    scope: "25 Subsystem Pairwise Scenarios",
    filePath: "tests/e2e/tier3_cross_feature.test.ts",
  },
  {
    tierNumber: 4,
    name: "Real-World Application Flows",
    scope: "5 Multi-Step Retail Shop Flows",
    filePath: "tests/e2e/tier4_application_flows.test.ts",
  },
];

interface TierResult {
  tierNumber: number;
  name: string;
  scope: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  exitCode: number;
  rawOutput: string;
}

function parseTestCounts(output: string): { total: number; passed: number; failed: number; durationMs: number } {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let durationMs = 0;

  const totalMatch = output.match(/ℹ tests\s+(\d+)/);
  const passMatch = output.match(/ℹ pass\s+(\d+)/);
  const failMatch = output.match(/ℹ fail\s+(\d+)/);
  const durationMatch = output.match(/ℹ duration_ms\s+([\d.]+)/);

  if (totalMatch) total = parseInt(totalMatch[1], 10);
  if (passMatch) passed = parseInt(passMatch[1], 10);
  if (failMatch) failed = parseInt(failMatch[1], 10);
  if (durationMatch) durationMs = Math.round(parseFloat(durationMatch[1]));

  // Fallback count if TAP summary missing
  if (total === 0) {
    const checkMarks = (output.match(/✔/g) || []).length;
    const crossMarks = (output.match(/✖/g) || []).length;
    passed = checkMarks;
    failed = crossMarks;
    total = checkMarks + crossMarks;
  }

  return { total, passed, failed, durationMs };
}

function parseCliArgs(): number | null {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith("--tier=")) {
      const num = parseInt(arg.replace("--tier=", ""), 10);
      if (num >= 1 && num <= 4) return num;
    }
    if (arg === "-t" && args.indexOf(arg) + 1 < args.length) {
      const num = parseInt(args[args.indexOf(arg) + 1], 10);
      if (num >= 1 && num <= 4) return num;
    }
  }
  return null;
}

function runTier(tier: TierConfig): TierResult {
  const startTime = Date.now();
  console.log(`\n======================================================================`);
  console.log(`▶ Executing Tier ${tier.tierNumber}: ${tier.name}`);
  console.log(`  Target: ${tier.scope}`);
  console.log(`  File:   ${tier.filePath}`);
  console.log(`======================================================================`);

  const fullPath = path.resolve(process.cwd(), tier.filePath);
  const proc = spawnSync("npx", ["tsx", "--test", fullPath], {
    cwd: process.cwd(),
    encoding: "utf-8",
    env: process.env,
    shell: true,
  });

  const durationMs = Date.now() - startTime;
  const rawOutput = (proc.stdout || "") + "\n" + (proc.stderr || "");
  const counts = parseTestCounts(rawOutput);

  // If node:test duration is parsed, prefer it
  const finalDuration = counts.durationMs > 0 ? counts.durationMs : durationMs;

  const result: TierResult = {
    tierNumber: tier.tierNumber,
    name: tier.name,
    scope: tier.scope,
    total: counts.total,
    passed: counts.passed,
    failed: counts.failed,
    durationMs: finalDuration,
    exitCode: proc.status ?? (counts.failed > 0 ? 1 : 0),
    rawOutput,
  };

  if (result.exitCode === 0) {
    console.log(`✔ Tier ${tier.tierNumber} PASSED: ${result.passed}/${result.total} tests passed in ${result.durationMs}ms`);
  } else {
    console.log(`✖ Tier ${tier.tierNumber} FAILED: ${result.failed} failed, ${result.passed} passed of ${result.total} tests`);
  }

  return result;
}

function printSummaryTable(results: TierResult[]): void {
  console.log("\n");
  console.log("=".repeat(88));
  console.log("                     ComputerShopOS E2E Test Suite Summary");
  console.log("=".repeat(88));
  console.log(
    " " +
      "Tier".padEnd(6) +
      "Suite Name".padEnd(32) +
      "Total".padStart(8) +
      "Pass".padStart(8) +
      "Fail".padStart(8) +
      "Status".padStart(10) +
      "Time".padStart(12)
  );
  console.log("-".repeat(88));

  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;
  let totalDuration = 0;

  for (const r of results) {
    totalTests += r.total;
    totalPass += r.passed;
    totalFail += r.failed;
    totalDuration += r.durationMs;

    const statusStr = r.failed === 0 && r.total > 0 ? "PASSED" : "FAILED";
    console.log(
      " " +
        `T${r.tierNumber}`.padEnd(6) +
        r.name.padEnd(32) +
        String(r.total).padStart(8) +
        String(r.passed).padStart(8) +
        String(r.failed).padStart(8) +
        statusStr.padStart(10) +
        `${r.durationMs}ms`.padStart(12)
    );
  }

  console.log("-".repeat(88));
  const overallStatus = totalFail === 0 && totalTests > 0 ? "ALL PASSED" : "FAILED";
  console.log(
    " " +
      "TOTAL".padEnd(38) +
      String(totalTests).padStart(8) +
      String(totalPass).padStart(8) +
      String(totalFail).padStart(8) +
      overallStatus.padStart(10) +
      `${totalDuration}ms`.padStart(12)
  );
  console.log("=".repeat(88));
}

function main(): void {
  const selectedTier = parseCliArgs();
  const tiersToRun = selectedTier
    ? TIERS.filter((t) => t.tierNumber === selectedTier)
    : TIERS;

  console.log(`Starting ComputerShopOS E2E Test Suite Runner...`);
  if (selectedTier) {
    console.log(`Filtering execution to Tier ${selectedTier}`);
  } else {
    console.log(`Executing all 4 tiers (Feature Coverage, Boundaries, Interactions, Workflows)`);
  }

  const results: TierResult[] = [];
  for (const tier of tiersToRun) {
    const res = runTier(tier);
    results.push(res);
  }

  printSummaryTable(results);

  const hasFailures = results.some((r) => r.failed > 0 || r.exitCode !== 0);
  if (hasFailures) {
    console.log(`\n❌ E2E Test Suite run completed with test failures. Exiting with code 1.`);
    process.exit(1);
  } else {
    console.log(`\n✅ E2E Test Suite run completed successfully. All tests passed. Exiting with code 0.`);
    process.exit(0);
  }
}

main();
