#!/usr/bin/env ts-node

import { runUsageReport } from "./fetchAnthropicUsage";

/**
 * CLI tool for fetching Anthropic usage reports
 *
 * Usage:
 *   ts-node usageReportCli.ts <start-date> <end-date>
 *   ts-node usageReportCli.ts 2025-10-01 2025-10-19
 *
 * Or with npm script:
 *   npm run usage-report 2025-10-01 2025-10-19
 *
 * Date formats supported:
 *   - YYYY-MM-DD
 *   - ISO 8601 (2025-10-01T00:00:00Z)
 */

function printUsage(): void {
  console.log(`
Usage: ts-node usageReportCli.ts <start-date> <end-date>

Arguments:
  start-date    Start date for the report (YYYY-MM-DD or ISO 8601)
  end-date      End date for the report (YYYY-MM-DD or ISO 8601)

Examples:
  ts-node usageReportCli.ts 2025-10-01 2025-10-19
  ts-node usageReportCli.ts 2025-10-01T00:00:00Z 2025-10-19T23:59:59Z

Environment:
  ANTHROPIC_ADMIN_API_KEY    Required. Your Anthropic admin API key

Options:
  --help, -h    Show this help message
  `);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  if (args.length < 2) {
    console.error("Error: Both start date and end date are required.\n");
    printUsage();
    process.exit(1);
  }

  const [startDate, endDate] = args;

  await runUsageReport(startDate, endDate);
}

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
