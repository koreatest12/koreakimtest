// Anthropic API - Immediate Cost Estimation
// Install: npm i @anthropic-ai/sdk
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Model pricing (USD per 1M tokens) - Update as needed
// Source: https://www.anthropic.com/pricing
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-3-5-sonnet-latest": { in: 3.0, out: 15.0 },
  "claude-3-5-sonnet-20241022": { in: 3.0, out: 15.0 },
  "claude-3-5-haiku-latest": { in: 0.25, out: 1.25 },
  "claude-3-5-haiku-20241022": { in: 0.25, out: 1.25 },
  "claude-3-opus-latest": { in: 15.0, out: 75.0 },
  "claude-3-opus-20240229": { in: 15.0, out: 75.0 },
  "claude-3-sonnet-20240229": { in: 3.0, out: 15.0 },
  "claude-3-haiku-20240307": { in: 0.25, out: 1.25 },
};

/**
 * Calculate estimated cost in USD for a single API call
 * @param model - The model name used
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Estimated cost in USD
 */
function estimateCostUSD(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const price = PRICES[model];
  if (!price) {
    console.warn(`⚠️  Unknown model: ${model}. Cost estimation unavailable.`);
    return 0;
  }
  return (
    inputTokens * (price.in / 1_000_000) +
    outputTokens * (price.out / 1_000_000)
  );
}

/**
 * Format cost with Korean won conversion
 * @param usd - Cost in USD
 * @param exchangeRate - USD to KRW exchange rate (default: 1350)
 * @returns Formatted cost string
 */
function formatCost(usd: number, exchangeRate: number = 1350): string {
  const krw = usd * exchangeRate;
  return `$${usd.toFixed(6)} (₩${krw.toFixed(2)})`;
}

// Example usage
(async () => {
  const model = "claude-3-5-sonnet-latest";

  console.log("🚀 Calling Anthropic API...\n");

  const res = await client.messages.create({
    model,
    max_tokens: 512,
    messages: [{ role: "user", content: "한 줄 자기소개 부탁해요." }],
  });

  const usage = res.usage;
  const usd = estimateCostUSD(model, usage.input_tokens, usage.output_tokens);

  console.log("📊 API Call Summary:");
  console.log("─".repeat(50));
  console.log(`Model: ${model}`);
  console.log(`Input tokens: ${usage.input_tokens.toLocaleString()}`);
  console.log(`Output tokens: ${usage.output_tokens.toLocaleString()}`);
  console.log(`Total tokens: ${(usage.input_tokens + usage.output_tokens).toLocaleString()}`);
  console.log(`Estimated cost: ${formatCost(usd)}`);
  console.log("─".repeat(50));
  console.log(`\n💬 Response:\n${res.content[0].type === 'text' ? res.content[0].text : ''}`);
})();

export { estimateCostUSD, formatCost, PRICES };
