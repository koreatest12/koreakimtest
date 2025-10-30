"""
Anthropic API - Immediate Cost Estimation
Install: pip install anthropic
"""
import os
from typing import Dict, Tuple
import anthropic

# Model pricing (USD per 1M tokens) - Update as needed
# Source: https://www.anthropic.com/pricing
PRICES: Dict[str, Dict[str, float]] = {
    "claude-3-5-sonnet-latest": {"in": 3.0, "out": 15.0},
    "claude-3-5-sonnet-20241022": {"in": 3.0, "out": 15.0},
    "claude-3-5-haiku-latest": {"in": 0.25, "out": 1.25},
    "claude-3-5-haiku-20241022": {"in": 0.25, "out": 1.25},
    "claude-3-opus-latest": {"in": 15.0, "out": 75.0},
    "claude-3-opus-20240229": {"in": 15.0, "out": 75.0},
    "claude-3-sonnet-20240229": {"in": 3.0, "out": 15.0},
    "claude-3-haiku-20240307": {"in": 0.25, "out": 1.25},
}


def estimate_cost_usd(model: str, in_tokens: int, out_tokens: int) -> float:
    """
    Calculate estimated cost in USD for a single API call

    Args:
        model: The model name used
        in_tokens: Number of input tokens
        out_tokens: Number of output tokens

    Returns:
        Estimated cost in USD
    """
    price = PRICES.get(model)
    if not price:
        print(f"⚠️  Unknown model: {model}. Cost estimation unavailable.")
        return 0.0

    return (in_tokens * (price["in"] / 1_000_000) +
            out_tokens * (price["out"] / 1_000_000))


def format_cost(usd: float, exchange_rate: float = 1350) -> str:
    """
    Format cost with Korean won conversion

    Args:
        usd: Cost in USD
        exchange_rate: USD to KRW exchange rate (default: 1350)

    Returns:
        Formatted cost string
    """
    krw = usd * exchange_rate
    return f"${usd:.6f} (₩{krw:.2f})"


def main():
    """Example usage"""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    model = "claude-3-5-sonnet-latest"

    print("🚀 Calling Anthropic API...\n")

    res = client.messages.create(
        model=model,
        max_tokens=512,
        messages=[{"role": "user", "content": "한 줄 자기소개 부탁해요."}],
    )

    usage = res.usage
    usd = estimate_cost_usd(model, usage.input_tokens, usage.output_tokens)

    print("📊 API Call Summary:")
    print("─" * 50)
    print(f"Model: {model}")
    print(f"Input tokens: {usage.input_tokens:,}")
    print(f"Output tokens: {usage.output_tokens:,}")
    print(f"Total tokens: {usage.input_tokens + usage.output_tokens:,}")
    print(f"Estimated cost: {format_cost(usd)}")
    print("─" * 50)

    # Extract text from response
    response_text = ""
    if res.content and len(res.content) > 0:
        if hasattr(res.content[0], 'text'):
            response_text = res.content[0].text

    print(f"\n💬 Response:\n{response_text}")


if __name__ == "__main__":
    main()
