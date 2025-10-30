import * as https from "https";

interface UsageReportParams {
  startingAt: string;
  endingAt: string;
  groupBy?: string[];
  bucketWidth?: string;
}

interface UsageDataPoint {
  time: string;
  model?: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  requests: number;
}

interface UsageReportResponse {
  data: UsageDataPoint[];
  summary: {
    total_input_tokens: number;
    total_output_tokens: number;
    total_cache_creation_input_tokens?: number;
    total_cache_read_input_tokens?: number;
    total_requests: number;
  };
}

/**
 * Fetches usage report from Anthropic API
 * @param params - Parameters for the usage report
 * @param apiKey - Admin API key (defaults to ANTHROPIC_ADMIN_API_KEY env var)
 * @returns Promise resolving to usage report data
 */
export async function fetchAnthropicUsage(
  params: UsageReportParams,
  apiKey?: string,
): Promise<UsageReportResponse> {
  const key = apiKey || process.env.ANTHROPIC_ADMIN_API_KEY;

  if (!key) {
    throw new Error(
      "API key is required. Set ANTHROPIC_ADMIN_API_KEY environment variable or pass it as a parameter.",
    );
  }

  // Validate and format dates
  const startDate = new Date(params.startingAt);
  const endDate = new Date(params.endingAt);

  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start date: ${params.startingAt}`);
  }

  if (isNaN(endDate.getTime())) {
    throw new Error(`Invalid end date: ${params.endingAt}`);
  }

  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }

  // Build query parameters
  const queryParams = new URLSearchParams({
    starting_at: startDate.toISOString(),
    ending_at: endDate.toISOString(),
    bucket_width: params.bucketWidth || "1d",
  });

  // Add groupBy parameters
  if (params.groupBy && params.groupBy.length > 0) {
    params.groupBy.forEach((group) => {
      queryParams.append("group_by[]", group);
    });
  }

  const url = `https://api.anthropic.com/v1/organizations/usage_report/messages?${queryParams.toString()}`;

  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "anthropic-version": "2023-06-01",
        "x-api-key": key,
      },
    };

    https
      .get(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error}`));
            }
          } else {
            reject(
              new Error(
                `API request failed with status ${res.statusCode}: ${data}`,
              ),
            );
          }
        });
      })
      .on("error", (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
  });
}

/**
 * Formats usage data into a human-readable table
 */
export function formatUsageReport(report: UsageReportResponse): string {
  const lines: string[] = [];

  lines.push("\n=== ANTHROPIC USAGE REPORT ===\n");

  // Summary
  lines.push("SUMMARY:");
  lines.push(
    `Total Requests: ${report.summary.total_requests.toLocaleString()}`,
  );
  lines.push(
    `Total Input Tokens: ${report.summary.total_input_tokens.toLocaleString()}`,
  );
  lines.push(
    `Total Output Tokens: ${report.summary.total_output_tokens.toLocaleString()}`,
  );

  if (report.summary.total_cache_creation_input_tokens) {
    lines.push(
      `Total Cache Creation Tokens: ${report.summary.total_cache_creation_input_tokens.toLocaleString()}`,
    );
  }

  if (report.summary.total_cache_read_input_tokens) {
    lines.push(
      `Total Cache Read Tokens: ${report.summary.total_cache_read_input_tokens.toLocaleString()}`,
    );
  }

  const totalTokens =
    report.summary.total_input_tokens + report.summary.total_output_tokens;
  lines.push(`Total Tokens: ${totalTokens.toLocaleString()}\n`);

  // Data points
  if (report.data && report.data.length > 0) {
    lines.push("DETAILED DATA:");
    lines.push("-".repeat(80));

    // Group by model if present
    const groupedByModel = new Map<string, UsageDataPoint[]>();

    report.data.forEach((point) => {
      const model = point.model || "unknown";
      if (!groupedByModel.has(model)) {
        groupedByModel.set(model, []);
      }
      groupedByModel.get(model)!.push(point);
    });

    groupedByModel.forEach((points, model) => {
      if (groupedByModel.size > 1) {
        lines.push(`\nModel: ${model}`);
      }

      points.forEach((point) => {
        const date = new Date(point.time).toLocaleDateString();
        lines.push(`  ${date}:`);
        lines.push(`    Requests: ${point.requests.toLocaleString()}`);
        lines.push(`    Input Tokens: ${point.input_tokens.toLocaleString()}`);
        lines.push(
          `    Output Tokens: ${point.output_tokens.toLocaleString()}`,
        );

        if (point.cache_creation_input_tokens) {
          lines.push(
            `    Cache Creation: ${point.cache_creation_input_tokens.toLocaleString()}`,
          );
        }

        if (point.cache_read_input_tokens) {
          lines.push(
            `    Cache Read: ${point.cache_read_input_tokens.toLocaleString()}`,
          );
        }
      });
    });
  }

  lines.push("\n" + "=".repeat(80) + "\n");

  return lines.join("\n");
}

/**
 * CLI helper function to fetch and display usage
 */
export async function runUsageReport(
  startDate: string,
  endDate: string,
): Promise<void> {
  try {
    console.log(`Fetching usage data from ${startDate} to ${endDate}...`);

    const report = await fetchAnthropicUsage({
      startingAt: startDate,
      endingAt: endDate,
      groupBy: ["model"],
      bucketWidth: "1d",
    });

    console.log(formatUsageReport(report));

    // Also save to JSON file
    const fs = require("fs");
    const filename = `usage-report-${startDate}-to-${endDate}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`Raw data saved to: ${filename}`);
  } catch (error) {
    console.error("Error fetching usage report:", error);
    process.exit(1);
  }
}
