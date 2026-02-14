import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "money-mcp",
    version: "1.4.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/* =========================
   TOOL LIST
========================= */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "money_calculator",
      description: "Perform money calculation (add, subtract, multiply, divide, tax, discount, exchange)",
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          amount1: { type: "number" },
          amount2: { type: "number" },
          rate: { type: "number" }
        },
        required: ["operation", "amount1"]
      }
    },
    {
      name: "savings_calculator",
      description: "적금/복리 계산 (단리: simple, 복리: compound)",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "simple (단리) 또는 compound (복리)" },
          principal: { type: "number", description: "원금" },
          rate: { type: "number", description: "연이율 (%)" },
          years: { type: "number", description: "기간 (년)" }
        },
        required: ["type", "principal", "rate", "years"]
      }
    },
    {
      name: "installment_calculator",
      description: "할부 계산 - 월 납부금액 계산 (원리금균등상환)",
      inputSchema: {
        type: "object",
        properties: {
          principal: { type: "number", description: "총 금액" },
          months: { type: "number", description: "할부 개월 수" },
          rate: { type: "number", description: "연이율 (%). 무이자는 0" }
        },
        required: ["principal", "months"]
      }
    },
    {
      name: "dutch_pay",
      description: "더치페이 (N빵) - 총 금액을 인원수로 나눠 1인당 금액 계산",
      inputSchema: {
        type: "object",
        properties: {
          total: { type: "number", description: "총 금액" },
          people: { type: "number", description: "인원 수" }
        },
        required: ["total", "people"]
      }
    },
    {
      name: "currency_formatter",
      description: "통화 포맷터 - 숫자를 원화(KRW), 달러(USD), 엔화(JPY), 유로(EUR) 형식으로 변환",
      inputSchema: {
        type: "object",
        properties: {
          amount: { type: "number", description: "금액" },
          currency: { type: "string", description: "통화 코드: KRW, USD, JPY, EUR" }
        },
        required: ["amount", "currency"]
      }
    },
    {
      name: "salary_calculator",
      description: "급여 실수령액 계산 - 월급/연봉에서 4대보험 및 소득세 공제 후 실수령액 계산 (2026년 기준)",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "monthly (월급) 또는 annual (연봉)" },
          amount: { type: "number", description: "월급 또는 연봉 (세전)" },
          dependents: { type: "number", description: "부양가족 수 (본인 포함, 기본값 1)" }
        },
        required: ["type", "amount"]
      }
    },
    {
      name: "minimum_wage",
      description: "2026년 최저임금 계산기 - 시급 10,320원 기준 일급/주급/월급/연봉 계산",
      inputSchema: {
        type: "object",
        properties: {
          hours_per_day: { type: "number", description: "일 근무시간 (기본값 8)" },
          days_per_week: { type: "number", description: "주 근무일수 (기본값 5)" }
        }
      }
    },
    {
      name: "vat_calculator",
      description: "부가세(VAT) 계산 - 공급가액↔합계금액 간 부가세 10% 계산",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "supply (공급가액→합계) 또는 total (합계→공급가액)" },
          amount: { type: "number", description: "금액" }
        },
        required: ["type", "amount"]
      }
    }
  ]
}));

/* =========================
   TOOL CALL
========================= */
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = req.params.arguments;

  /* --- money_calculator --- */
  if (name === "money_calculator") {
    const { operation, amount1, amount2, rate } = args;

    const needsAmount2 = ["add", "subtract", "multiply", "divide"];
    const needsRate = ["tax", "discount", "exchange"];

    if (needsAmount2.includes(operation) && (amount2 == null || typeof amount2 !== "number")) {
      return { content: [{ type: "text", text: "오류: amount2 값이 필요합니다." }] };
    }
    if (needsRate.includes(operation) && (rate == null || typeof rate !== "number")) {
      return { content: [{ type: "text", text: "오류: rate 값이 필요합니다." }] };
    }
    if (operation === "divide" && amount2 === 0) {
      return { content: [{ type: "text", text: "오류: 0으로 나눌 수 없습니다." }] };
    }

    let result;
    switch (operation) {
      case "add":      result = amount1 + amount2; break;
      case "subtract": result = amount1 - amount2; break;
      case "multiply": result = amount1 * amount2; break;
      case "divide":   result = amount1 / amount2; break;
      case "tax":      result = amount1 + (amount1 * (rate / 100)); break;
      case "discount": result = amount1 - (amount1 * (rate / 100)); break;
      case "exchange": result = amount1 * rate; break;
      default:
        return { content: [{ type: "text", text: "오류: 잘못된 연산입니다. (add, subtract, multiply, divide, tax, discount, exchange)" }] };
    }

    return { content: [{ type: "text", text: `결과: ${result.toLocaleString()}` }] };
  }

  /* --- savings_calculator --- */
  if (name === "savings_calculator") {
    const { type, principal, rate, years } = args;

    if (principal == null || principal <= 0) {
      return { content: [{ type: "text", text: "오류: 원금(principal)은 0보다 커야 합니다." }] };
    }
    if (rate == null || rate < 0) {
      return { content: [{ type: "text", text: "오류: 이율(rate)은 0 이상이어야 합니다." }] };
    }
    if (years == null || years <= 0) {
      return { content: [{ type: "text", text: "오류: 기간(years)은 0보다 커야 합니다." }] };
    }

    const r = rate / 100;
    let total, interest;

    if (type === "simple") {
      interest = principal * r * years;
      total = principal + interest;
    } else if (type === "compound") {
      total = principal * Math.pow(1 + r, years);
      interest = total - principal;
    } else {
      return { content: [{ type: "text", text: "오류: type은 simple(단리) 또는 compound(복리)여야 합니다." }] };
    }

    return {
      content: [{ type: "text", text: `원금: ${principal.toLocaleString()}원\n이율: ${rate}%\n기간: ${years}년\n이자: ${Math.round(interest).toLocaleString()}원\n만기금액: ${Math.round(total).toLocaleString()}원` }]
    };
  }

  /* --- installment_calculator --- */
  if (name === "installment_calculator") {
    const { principal, months, rate } = args;

    if (principal == null || principal <= 0) {
      return { content: [{ type: "text", text: "오류: 총 금액(principal)은 0보다 커야 합니다." }] };
    }
    if (months == null || months <= 0 || !Number.isInteger(months)) {
      return { content: [{ type: "text", text: "오류: 할부 개월수(months)는 1 이상의 정수여야 합니다." }] };
    }

    const annualRate = rate || 0;
    let monthly, totalPayment, totalInterest;

    if (annualRate === 0) {
      monthly = principal / months;
      totalPayment = principal;
      totalInterest = 0;
    } else {
      const monthlyRate = annualRate / 100 / 12;
      monthly = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      totalPayment = monthly * months;
      totalInterest = totalPayment - principal;
    }

    return {
      content: [{ type: "text", text: `총 금액: ${principal.toLocaleString()}원\n할부: ${months}개월 (이율 ${annualRate}%)\n월 납부금: ${Math.round(monthly).toLocaleString()}원\n총 이자: ${Math.round(totalInterest).toLocaleString()}원\n총 납부금: ${Math.round(totalPayment).toLocaleString()}원` }]
    };
  }

  /* --- dutch_pay --- */
  if (name === "dutch_pay") {
    const { total, people } = args;

    if (total == null || total <= 0) {
      return { content: [{ type: "text", text: "오류: 총 금액(total)은 0보다 커야 합니다." }] };
    }
    if (people == null || people <= 0 || !Number.isInteger(people)) {
      return { content: [{ type: "text", text: "오류: 인원수(people)는 1 이상의 정수여야 합니다." }] };
    }

    const perPerson = Math.ceil(total / people);
    const remainder = total - perPerson * (people - 1);

    let text = `총 금액: ${total.toLocaleString()}원\n인원: ${people}명\n1인당: ${perPerson.toLocaleString()}원`;
    if (remainder !== perPerson) {
      text += `\n(마지막 1명: ${remainder.toLocaleString()}원)`;
    }

    return { content: [{ type: "text", text }] };
  }

  /* --- currency_formatter --- */
  if (name === "currency_formatter") {
    const { amount, currency } = args;

    if (amount == null || typeof amount !== "number") {
      return { content: [{ type: "text", text: "오류: 금액(amount)이 필요합니다." }] };
    }

    const formatters = {
      KRW: () => amount.toLocaleString("ko-KR", { style: "currency", currency: "KRW" }),
      USD: () => amount.toLocaleString("en-US", { style: "currency", currency: "USD" }),
      JPY: () => amount.toLocaleString("ja-JP", { style: "currency", currency: "JPY" }),
      EUR: () => amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
    };

    const upper = (currency || "").toUpperCase();
    if (!formatters[upper]) {
      return { content: [{ type: "text", text: `오류: 지원하지 않는 통화입니다. (KRW, USD, JPY, EUR)` }] };
    }

    return { content: [{ type: "text", text: `결과: ${formatters[upper]()}` }] };
  }

  /* --- salary_calculator --- */
  if (name === "salary_calculator") {
    const { type, amount, dependents } = args;

    if (!["monthly", "annual"].includes(type)) {
      return { content: [{ type: "text", text: "오류: type은 monthly(월급) 또는 annual(연봉)이어야 합니다." }] };
    }
    if (amount == null || amount <= 0) {
      return { content: [{ type: "text", text: "오류: 금액(amount)은 0보다 커야 합니다." }] };
    }

    const monthly = type === "annual" ? amount / 12 : amount;
    const deps = (dependents != null && dependents >= 1) ? dependents : 1;

    // 2026년 기준 4대보험 근로자 부담률
    const nationalPension = Math.min(monthly * 0.0475, 280250);   // 국민연금 4.75% (상한 590만원 기준)
    const healthInsurance = monthly * 0.03595;                     // 건강보험 3.595%
    const longTermCare = healthInsurance * 0.1314;                 // 장기요양 13.14% (0.9448/7.19)
    const employment = monthly * 0.009;                            // 고용보험 0.9%

    const totalInsurance = nationalPension + healthInsurance + longTermCare + employment;

    // 간이세액표 기반 근사 소득세 계산
    const taxableMonthly = monthly - totalInsurance;
    let incomeTax = 0;
    if (taxableMonthly > 10000000) {
      incomeTax = taxableMonthly * 0.35 - 1490000;
    } else if (taxableMonthly > 8800000) {
      incomeTax = taxableMonthly * 0.35 - 1490000;
    } else if (taxableMonthly > 4600000) {
      incomeTax = taxableMonthly * 0.24 - 522000;
    } else if (taxableMonthly > 1500000) {
      incomeTax = taxableMonthly * 0.15 - 108000;
    } else if (taxableMonthly > 1060000) {
      incomeTax = taxableMonthly * 0.06;
    }

    // 부양가족 공제 (1인당 약 12,500원 감면)
    incomeTax = Math.max(0, incomeTax - (deps - 1) * 12500);
    const localTax = incomeTax * 0.1; // 지방소득세 10%

    const totalDeduction = totalInsurance + incomeTax + localTax;
    const netPay = monthly - totalDeduction;

    const f = (n) => Math.round(n).toLocaleString();

    let text = type === "annual"
      ? `연봉: ${f(amount)}원 (월 환산: ${f(monthly)}원)\n`
      : `월급: ${f(amount)}원\n`;

    text += `부양가족: ${deps}명\n`;
    text += `──────────────\n`;
    text += `국민연금: -${f(nationalPension)}원\n`;
    text += `건강보험: -${f(healthInsurance)}원\n`;
    text += `장기요양: -${f(longTermCare)}원\n`;
    text += `고용보험: -${f(employment)}원\n`;
    text += `소득세: -${f(incomeTax)}원\n`;
    text += `지방소득세: -${f(localTax)}원\n`;
    text += `──────────────\n`;
    text += `총 공제: -${f(totalDeduction)}원\n`;
    text += `실수령액: ${f(netPay)}원`;

    return { content: [{ type: "text", text }] };
  }

  /* --- minimum_wage --- */
  if (name === "minimum_wage") {
    const hoursPerDay = (args.hours_per_day != null && args.hours_per_day > 0) ? args.hours_per_day : 8;
    const daysPerWeek = (args.days_per_week != null && args.days_per_week > 0) ? args.days_per_week : 5;

    const HOURLY = 10320; // 2026년 최저시급
    const dailyPay = HOURLY * hoursPerDay;
    const weeklyHours = hoursPerDay * daysPerWeek;
    const weeklyPaidHours = weeklyHours >= 15 ? weeklyHours + hoursPerDay : weeklyHours; // 주휴수당 포함
    const weeklyPay = HOURLY * weeklyPaidHours;
    const monthlyHours = weeklyPaidHours * (365 / 7 / 12);
    const monthlyPay = Math.round(HOURLY * monthlyHours);
    const annualPay = monthlyPay * 12;

    const f = (n) => Math.round(n).toLocaleString();

    let text = `[ 2026년 최저임금 계산 ]\n`;
    text += `시급: ${f(HOURLY)}원\n`;
    text += `근무조건: 일 ${hoursPerDay}시간, 주 ${daysPerWeek}일\n`;
    text += `──────────────\n`;
    text += `일급: ${f(dailyPay)}원\n`;
    text += `주급: ${f(weeklyPay)}원`;
    if (weeklyHours >= 15) {
      text += ` (주휴수당 포함)`;
    }
    text += `\n월급: ${f(monthlyPay)}원\n`;
    text += `연봉: ${f(annualPay)}원`;

    return { content: [{ type: "text", text }] };
  }

  /* --- vat_calculator --- */
  if (name === "vat_calculator") {
    const { type, amount } = args;

    if (!["supply", "total"].includes(type)) {
      return { content: [{ type: "text", text: "오류: type은 supply(공급가액→합계) 또는 total(합계→공급가액)이어야 합니다." }] };
    }
    if (amount == null || amount <= 0) {
      return { content: [{ type: "text", text: "오류: 금액(amount)은 0보다 커야 합니다." }] };
    }

    const f = (n) => Math.round(n).toLocaleString();
    let supply, vat, total;

    if (type === "supply") {
      supply = amount;
      vat = amount * 0.1;
      total = amount + vat;
    } else {
      total = amount;
      supply = Math.round(amount / 1.1);
      vat = amount - supply;
    }

    let text = `공급가액: ${f(supply)}원\n`;
    text += `부가세(10%): ${f(vat)}원\n`;
    text += `합계금액: ${f(total)}원`;

    return { content: [{ type: "text", text }] };
  }

  return { content: [{ type: "text", text: "오류: 알 수 없는 도구입니다." }] };
});

/* =========================
   START SERVER
========================= */
const transport = new StdioServerTransport();
await server.connect(transport);
