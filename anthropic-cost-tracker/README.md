# Anthropic API Cost Tracker

Claude API 사용량과 비용을 추적하는 도구 모음입니다.

## 기능

### A) 즉시 비용 추정 (Immediate Cost Estimation)
- API 호출마다 실시간으로 비용 계산
- 토큰 사용량 기반 USD/KRW 비용 표시
- Node.js (TypeScript) 및 Python 지원

### B) 조직 비용 리포트 (Admin API Cost Report)
- 조직 레벨 공식 사용량 및 비용 조회
- 일별/시간별/분별 집계 가능
- 모델별, 워크스페이스별 그룹핑 지원
- **조직 계정 전용** (개인 계정 사용 불가)

## 설치 및 설정

### 1. API 키 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 API 키를 입력하세요:

```bash
cp .env.example .env
```

```env
# 일반 API 키 (즉시 비용 추정용)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Admin API 키 (조직 비용 리포트용)
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-...
```

**API 키 발급:**
- 일반 API 키: https://console.anthropic.com/
- Admin API 키: https://console.anthropic.com/settings/admin-api (조직 계정만)

### 2. Node.js 설정

```bash
cd nodejs
npm install
```

**필요 패키지:**
- `@anthropic-ai/sdk` - Anthropic 공식 SDK
- `tsx` - TypeScript 실행기
- `typescript` - TypeScript 컴파일러

### 3. Python 설정

```bash
cd python
pip install -r requirements.txt
```

**필요 패키지:**
- `anthropic` - Anthropic 공식 SDK
- `python-dotenv` - 환경변수 관리

## 사용법

### A) 즉시 비용 추정

#### Node.js (TypeScript)

```bash
cd nodejs
npm run estimate
```

**출력 예시:**
```
🚀 Calling Anthropic API...

📊 API Call Summary:
──────────────────────────────────────────────────
Model: claude-3-5-sonnet-latest
Input tokens: 1,234
Output tokens: 567
Total tokens: 1,801
Estimated cost: $0.012345 (₩16.67)
──────────────────────────────────────────────────

💬 Response:
안녕하세요! 저는 Claude예요. 도움이 필요하신 부분이 있으시면 말씀해주세요!
```

#### Python

```bash
cd python
python immediate_cost_estimate.py
```

**코드에서 사용하기:**

```python
from immediate_cost_estimate import estimate_cost_usd, format_cost

# API 호출 후
usage = response.usage
cost = estimate_cost_usd(model, usage.input_tokens, usage.output_tokens)
print(f"비용: {format_cost(cost)}")
```

### B) 조직 비용 리포트 (Admin API)

```bash
cd nodejs
npm run admin-report
```

**출력 예시:**
```
🔍 Analyzing period: 2025-10-15T00:00:00Z to 2025-10-22T00:00:00Z

📊 Fetching usage report...
💰 Fetching cost report...

📈 Usage Report Summary:
============================================================

📅 Period: 2025-10-15T00:00:00Z to 2025-10-16T00:00:00Z
  🤖 claude-3-5-sonnet-latest:
     Input:  123,456 tokens
     Output: 45,678 tokens
     Total:  169,134 tokens

────────────────────────────────────────────────────────────
📊 Grand Total:
   Input:  1,234,567 tokens
   Output: 456,789 tokens
   Total:  1,691,356 tokens

💵 Cost Report Summary:
============================================================

📅 Period: 2025-10-15T00:00:00Z to 2025-10-16T00:00:00Z
   Amount: $12.345678 (₩16,666.67)

────────────────────────────────────────────────────────────
💰 Total Cost: $86.543210 (₩116,833.33)

✅ Report generation complete!
```

## 모델별 가격 (2025년 기준)

| 모델 | 입력 (per 1M tokens) | 출력 (per 1M tokens) |
|------|---------------------|---------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3.5 Haiku | $0.25 | $1.25 |
| Claude 3 Opus | $15.00 | $75.00 |
| Claude 3 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |

**최신 가격 확인:** https://www.anthropic.com/pricing

## API 문서

### 즉시 비용 추정

**estimateCostUSD(model, inputTokens, outputTokens)**
- `model`: 사용한 모델 이름
- `inputTokens`: 입력 토큰 수
- `outputTokens`: 출력 토큰 수
- 반환값: USD 비용

**formatCost(usd, exchangeRate)**
- `usd`: USD 비용
- `exchangeRate`: 환율 (기본값: 1350)
- 반환값: 포맷된 문자열 "$X.XX (₩Y.YY)"

### Admin API 리포트

**getUsageReport(params)**
- `starting_at`: 시작 시간 (ISO 8601)
- `ending_at`: 종료 시간 (ISO 8601)
- `bucket_width`: 시간 버킷 ("1m" | "1h" | "1d")
- `group_by`: 그룹핑 기준 (["model", "workspace_id", ...])

**getCostReport(params)**
- `starting_at`: 시작 시간 (ISO 8601)
- `ending_at`: 종료 시간 (ISO 8601)
- `bucket_width`: 시간 버킷 ("1m" | "1h" | "1d")

## 주의사항

1. **비용 추정의 정확도**
   - 즉시 비용 추정은 정가 기준입니다
   - 실제 청구 금액은 할인, 배치 요금, 우선순위 티어 등에 따라 다를 수 있습니다
   - 공식 비용은 Admin API의 Cost Report를 참고하세요

2. **Admin API 제한사항**
   - 조직 계정에서만 사용 가능
   - 개인 계정은 Admin API 키를 발급받을 수 없습니다
   - Admin API 키는 별도로 관리하세요 (일반 API 키와 다름)

3. **환율**
   - 기본 환율은 1 USD = 1,350 KRW로 설정되어 있습니다
   - 실시간 환율을 사용하려면 코드를 수정하세요

## 프로젝트 구조

```
anthropic-cost-tracker/
├── nodejs/
│   ├── immediate-cost-estimate.ts    # 즉시 비용 추정
│   ├── admin-api-cost-report.ts      # Admin API 리포트
│   ├── package.json
│   └── tsconfig.json
├── python/
│   ├── immediate_cost_estimate.py    # 즉시 비용 추정
│   └── requirements.txt
├── docs/                              # 추가 문서
├── .env.example                       # 환경변수 템플릿
└── README.md                          # 이 파일
```

## 참고 자료

- [Anthropic API 문서](https://docs.anthropic.com/)
- [Admin API 문서](https://docs.anthropic.com/en/api/admin-api)
- [가격 정보](https://www.anthropic.com/pricing)
- [Console](https://console.anthropic.com/)

## 라이선스

MIT

## 기여

이슈 및 PR 환영합니다!
