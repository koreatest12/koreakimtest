/**
 * Anthropic Admin API - Official Cost & Usage Reporting
 *
 * Requirements:
 * - Organization-level Admin API Key (sk-ant-admin...)
 * - Not available for individual accounts
 *
 * Docs: https://docs.anthropic.com/en/api/admin-api
 */

const ADMIN_API_KEY = process.env.ANTHROPIC_ADMIN_API_KEY;
const BASE_URL = "https://api.anthropic.com/v1/organizations";
const API_VERSION = "2023-06-01";

interface UsageReportParams {
  starting_at: string; // ISO 8601 timestamp
  ending_at: string;   // ISO 8601 timestamp
  bucket_width?: "1m" | "1h" | "1d"; // Time bucket width
  group_by?: string[]; // e.g., ["model", "workspace_id"]
}

interface CostReportParams {
  starting_at: string;
  ending_at: string;
  bucket_width?: "1m" | "1h" | "1d";
}

/**
 * Make a request to the Admin API
 */
async function getJson(url: string): Promise<any> {
  if (!ADMIN_API_KEY) {
    throw new Error("ANTHROPIC_ADMIN_API_KEY environment variable not set");
  }

  const response = await fetch(url, {
    headers: {
      "anthropic-version": API_VERSION,
      "x-api-key": ADMIN_API_KEY,
      "User-Agent": "AnthropicCostTracker/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(`${key}[]`, v));
    } else if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Get usage report (token counts) grouped by model and time
 *
 * @param params - Query parameters
 * @returns Usage report data
 */
export async function getUsageReport(params: UsageReportParams) {
  const queryParams = {
    starting_at: params.starting_at,
    ending_at: params.ending_at,
    bucket_width: params.bucket_width || "1d",
    ...(params.group_by && { "group_by": params.group_by }),
  };

  const queryString = buildQueryString(queryParams);
  const url = `${BASE_URL}/usage_report/messages?${queryString}`;

  console.log(`📊 Fetching usage report...`);
  return getJson(url);
}

/**
 * Get cost report (USD amounts) by time period
 *
 * @param params - Query parameters
 * @returns Cost report data
 */
export async function getCostReport(params: CostReportParams) {
  const queryParams = {
    starting_at: params.starting_at,
    ending_at: params.ending_at,
    bucket_width: params.bucket_width || "1d",
  };

  const queryString = buildQueryString(queryParams);
  const url = `${BASE_URL}/cost_report?${queryString}`;

  console.log(`💰 Fetching cost report...`);
  return getJson(url);
}

/**
 * Format and display usage summary
 */
function displayUsageSummary(usageData: any) {
  console.log("\n📈 Usage Report Summary:");
  console.log("=".repeat(60));

  if (usageData.data && Array.isArray(usageData.data)) {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    usageData.data.forEach((bucket: any) => {
      console.log(`\n📅 Period: ${bucket.start_time} to ${bucket.end_time}`);

      if (bucket.results && Array.isArray(bucket.results)) {
        bucket.results.forEach((result: any) => {
          const model = result.model || "Unknown";
          const inputTokens = result.input_tokens || 0;
          const outputTokens = result.output_tokens || 0;

          totalInputTokens += inputTokens;
          totalOutputTokens += outputTokens;

          console.log(`  🤖 ${model}:`);
          console.log(`     Input:  ${inputTokens.toLocaleString()} tokens`);
          console.log(`     Output: ${outputTokens.toLocaleString()} tokens`);
          console.log(`     Total:  ${(inputTokens + outputTokens).toLocaleString()} tokens`);
        });
      }
    });

    console.log("\n" + "─".repeat(60));
    console.log(`📊 Grand Total:`);
    console.log(`   Input:  ${totalInputTokens.toLocaleString()} tokens`);
    console.log(`   Output: ${totalOutputTokens.toLocaleString()} tokens`);
    console.log(`   Total:  ${(totalInputTokens + totalOutputTokens).toLocaleString()} tokens`);
  }
}

/**
 * Format and display cost summary
 */
function displayCostSummary(costData: any, exchangeRate: number = 1350) {
  console.log("\n💵 Cost Report Summary:");
  console.log("=".repeat(60));

  if (costData.data && Array.isArray(costData.data)) {
    let totalUSD = 0;

    costData.data.forEach((bucket: any) => {
      console.log(`\n📅 Period: ${bucket.start_time} to ${bucket.end_time}`);

      const amount = bucket.amount ? parseFloat(bucket.amount) : 0;
      totalUSD += amount;

      console.log(`   Amount: $${amount.toFixed(6)} (₩${(amount * exchangeRate).toFixed(2)})`);
    });

    console.log("\n" + "─".repeat(60));
    console.log(`💰 Total Cost: $${totalUSD.toFixed(6)} (₩${(totalUSD * exchangeRate).toFixed(2)})`);
  }
}

/**
 * Example: Get last 7 days usage and cost report
 */
async function main() {
  try {
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const params = {
      starting_at: startDate.toISOString(),
      ending_at: endDate.toISOString(),
      bucket_width: "1d" as const,
    };

    console.log(`\n🔍 Analyzing period: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

    // Get usage report (grouped by model)
    const usageReport = await getUsageReport({
      ...params,
      group_by: ["model"],
    });

    displayUsageSummary(usageReport);

    // Get cost report
    const costReport = await getCostReport(params);

    displayCostSummary(costReport);

    console.log("\n✅ Report generation complete!\n");

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
