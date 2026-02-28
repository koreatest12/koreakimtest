import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "money-mcp",
    version: "2.0.0"
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
    },
    {
      name: "loan_calculator",
      description: "대출 상환 계산기 - 원리금균등/원금균등/만기일시 상환 방식별 월 납부액 및 총 이자 계산",
      inputSchema: {
        type: "object",
        properties: {
          principal: { type: "number", description: "대출 원금" },
          rate: { type: "number", description: "연이율 (%)" },
          months: { type: "number", description: "대출 기간 (개월)" },
          method: { type: "string", description: "상환방식: equal_payment (원리금균등, 기본값), equal_principal (원금균등), bullet (만기일시)" }
        },
        required: ["principal", "rate", "months"]
      }
    },
    {
      name: "retirement_pay",
      description: "퇴직금 계산기 - 근속기간과 최근 3개월 평균임금 기반 퇴직금 계산 (1년 이상 근속 시)",
      inputSchema: {
        type: "object",
        properties: {
          avg_monthly_salary: { type: "number", description: "최근 3개월 평균 월급 (세전)" },
          years: { type: "number", description: "근속 연수" },
          months: { type: "number", description: "근속 개월 (연수 외 추가 개월, 기본값 0)" }
        },
        required: ["avg_monthly_salary", "years"]
      }
    },
    {
      name: "rent_converter",
      description: "전월세 전환 계산기 - 전세↔월세 전환 시 적정 보증금/월세 계산 (전월세전환율 기반)",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "jeonse_to_wolse (전세→월세) 또는 wolse_to_jeonse (월세→전세)" },
          jeonse_deposit: { type: "number", description: "전세 보증금 (전세→월세 시 필수)" },
          wolse_deposit: { type: "number", description: "월세 보증금 (월세→전세 시 필수)" },
          monthly_rent: { type: "number", description: "월세 금액 (월세→전세 시 필수)" },
          conversion_rate: { type: "number", description: "전월세전환율 (%, 기본값 2026년 기준 5.5%)" },
          new_deposit: { type: "number", description: "전세→월세 시 희망 보증금 (선택)" }
        },
        required: ["type"]
      }
    },
    {
      name: "investment_return",
      description: "투자 수익률 계산기 - 매수/매도 금액 기반 수익률, 수수료, 세금 포함 실현손익 계산",
      inputSchema: {
        type: "object",
        properties: {
          buy_price: { type: "number", description: "매수 단가" },
          sell_price: { type: "number", description: "매도 단가" },
          quantity: { type: "number", description: "수량 (기본값 1)" },
          fee_rate: { type: "number", description: "매매 수수료율 (%, 기본값 0.015)" },
          tax_rate: { type: "number", description: "매도 세금율 (%, 주식: 0.18, 기본값 0)" },
          asset_type: { type: "string", description: "자산 유형: stock (국내주식), crypto (암호화폐), general (일반, 기본값)" }
        },
        required: ["buy_price", "sell_price"]
      }
    },
    {
      name: "excel_savings_analyzer",
      description: "엑셀 파일 기반 자동 저축 분석 - 수입/지출 엑셀 파일을 읽어 저축 가능 금액, 저축 플랜, 카테고리별 지출 분석 제공",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "엑셀 파일 경로 (C:\\Users\\kwonn 하위)" },
          income_col: { type: "string", description: "수입 컬럼명 (기본값: 자동 감지)" },
          expense_col: { type: "string", description: "지출 컬럼명 (기본값: 자동 감지)" },
          category_col: { type: "string", description: "카테고리 컬럼명 (기본값: 자동 감지)" },
          date_col: { type: "string", description: "날짜 컬럼명 (기본값: 자동 감지)" },
          savings_goal_rate: { type: "number", description: "목표 저축률 (%, 기본값 20)" },
          sheet_name: { type: "string", description: "시트 이름 (기본값: 첫 번째 시트)" }
        },
        required: ["file_path"]
      }
    },
    {
      name: "excel_savings_plan",
      description: "엑셀 데이터 기반 맞춤 저축 플랜 생성 및 저축 결과 엑셀 파일 자동 저장",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "수입/지출 엑셀 파일 경로" },
          target_amount: { type: "number", description: "목표 저축 금액" },
          target_months: { type: "number", description: "목표 기간 (개월)" },
          savings_type: { type: "string", description: "저축 방식: auto (자동 계산, 기본값), fixed (고정 금액), percent (수입 비율)" },
          fixed_amount: { type: "number", description: "고정 저축 금액 (savings_type=fixed 시)" },
          percent: { type: "number", description: "저축 비율 (%, savings_type=percent 시)" },
          output_path: { type: "string", description: "결과 엑셀 저장 경로 (기본값: 원본파일명_저축플랜.xlsx)" }
        },
        required: ["file_path"]
      }
    },
    {
      name: "security_news",
      description: "KISA 보호나라 최신 보안공지 조회 - 최신 보안 취약점, 업데이트 권고 등",
      inputSchema: {
        type: "object",
        properties: {
          count: { type: "number", description: "조회할 건수 (기본값 5, 최대 10)" },
          keyword: { type: "string", description: "검색 키워드 (선택)" }
        }
      }
    },
    {
      name: "kisec_exam_schedule",
      description: "2026년 정보보안기사/정보보안산업기사 시험일정 조회 - 회차별 필기/실기 원서접수, 시험일, 합격발표 일정표",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "기사 (정보보안기사, 기본값) 또는 산업기사 (정보보안산업기사)" },
          round: { type: "number", description: "회차 (1 또는 2). 미지정 시 전체 회차 표시" }
        }
      }
    },
    {
      name: "stock_tax_calculator",
      description: "주식 투자 세금 계산기 - 국내주식 매매 증권거래세, 해외주식 양도소득세, 배당소득세 계산 (2026년 기준)",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "계산 유형: domestic_transaction (국내주식 매매), overseas_capital_gains (해외주식 양도), dividend (배당소득)" },
          sell_price: { type: "number", description: "매도 총액 (원) - domestic_transaction, overseas_capital_gains 시 사용" },
          buy_price: { type: "number", description: "매수 총액 (원) - domestic_transaction, overseas_capital_gains 시 사용" },
          market: { type: "string", description: "시장 구분: KOSPI (기본값), KOSDAQ, KONEX - domestic_transaction 시 사용" },
          is_major_shareholder: { type: "boolean", description: "대주주 여부 (기본값 false) - domestic_transaction 시 사용. 종목당 10억 이상 또는 지분율 초과 시 true" },
          dividend_amount: { type: "number", description: "배당금 총액 (원) - dividend 시 사용" },
          annual_financial_income: { type: "number", description: "연간 금융소득 합계 (원) - dividend 시 금융소득종합과세 판단용 (기본값 0)" }
        },
        required: ["type"]
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
      incomeTax = taxableMonthly * 0.38 - 1940000;
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

  /* --- loan_calculator --- */
  if (name === "loan_calculator") {
    const { principal, rate, months } = args;
    const method = args.method || "equal_payment";

    if (principal == null || principal <= 0) {
      return { content: [{ type: "text", text: "오류: 대출 원금(principal)은 0보다 커야 합니다." }] };
    }
    if (rate == null || rate < 0) {
      return { content: [{ type: "text", text: "오류: 이율(rate)은 0 이상이어야 합니다." }] };
    }
    if (months == null || months <= 0 || !Number.isInteger(months)) {
      return { content: [{ type: "text", text: "오류: 대출 기간(months)은 1 이상의 정수여야 합니다." }] };
    }
    if (!["equal_payment", "equal_principal", "bullet"].includes(method)) {
      return { content: [{ type: "text", text: "오류: method는 equal_payment, equal_principal, bullet 중 하나여야 합니다." }] };
    }

    const f = (n) => Math.round(n).toLocaleString();
    const monthlyRate = rate / 100 / 12;
    let text = `[ 대출 상환 계산 ]\n`;
    text += `대출금: ${f(principal)}원 | 연이율: ${rate}% | 기간: ${months}개월\n`;

    if (method === "equal_payment") {
      // 원리금균등상환
      let monthlyPayment;
      if (monthlyRate === 0) {
        monthlyPayment = principal / months;
      } else {
        monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      }
      const totalPayment = monthlyPayment * months;
      const totalInterest = totalPayment - principal;

      text += `상환방식: 원리금균등상환\n`;
      text += `──────────────\n`;
      text += `월 납부금: ${f(monthlyPayment)}원 (매월 동일)\n`;
      text += `총 이자: ${f(totalInterest)}원\n`;
      text += `총 상환액: ${f(totalPayment)}원`;
    } else if (method === "equal_principal") {
      // 원금균등상환
      const monthlyPrincipal = principal / months;
      let totalInterest = 0;
      const firstMonthInterest = principal * monthlyRate;
      const firstPayment = monthlyPrincipal + firstMonthInterest;
      let remaining = principal;
      for (let i = 0; i < months; i++) {
        totalInterest += remaining * monthlyRate;
        remaining -= monthlyPrincipal;
      }
      const lastMonthInterest = (principal - monthlyPrincipal * (months - 1)) * monthlyRate;
      const lastPayment = monthlyPrincipal + lastMonthInterest;

      text += `상환방식: 원금균등상환\n`;
      text += `──────────────\n`;
      text += `월 원금: ${f(monthlyPrincipal)}원 (매월 동일)\n`;
      text += `첫 달 납부금: ${f(firstPayment)}원\n`;
      text += `마지막 달 납부금: ${f(lastPayment)}원\n`;
      text += `총 이자: ${f(totalInterest)}원\n`;
      text += `총 상환액: ${f(principal + totalInterest)}원`;
    } else {
      // 만기일시상환
      const monthlyInterest = principal * monthlyRate;
      const totalInterest = monthlyInterest * months;

      text += `상환방식: 만기일시상환\n`;
      text += `──────────────\n`;
      text += `월 이자: ${f(monthlyInterest)}원\n`;
      text += `만기 시 원금: ${f(principal)}원\n`;
      text += `총 이자: ${f(totalInterest)}원\n`;
      text += `총 상환액: ${f(principal + totalInterest)}원`;
    }

    return { content: [{ type: "text", text }] };
  }

  /* --- retirement_pay --- */
  if (name === "retirement_pay") {
    const { avg_monthly_salary, years } = args;
    const extraMonths = args.months || 0;

    if (avg_monthly_salary == null || avg_monthly_salary <= 0) {
      return { content: [{ type: "text", text: "오류: 평균 월급(avg_monthly_salary)은 0보다 커야 합니다." }] };
    }
    if (years == null || years < 0) {
      return { content: [{ type: "text", text: "오류: 근속 연수(years)는 0 이상이어야 합니다." }] };
    }

    const totalDays = years * 365 + Math.round(extraMonths * 30.44);
    if (totalDays < 365) {
      return { content: [{ type: "text", text: `근속기간이 ${years}년 ${extraMonths}개월 (${totalDays}일)로,\n1년(365일) 미만이므로 퇴직금 지급 대상이 아닙니다.` }] };
    }

    // 퇴직금 = (1일 평균임금 × 30일) × (총 근속일수 / 365)
    const dailyWage = avg_monthly_salary / 30;
    const retirementPay = (dailyWage * 30) * (totalDays / 365);

    const f = (n) => Math.round(n).toLocaleString();
    let text = `[ 퇴직금 계산 ]\n`;
    text += `평균 월급: ${f(avg_monthly_salary)}원\n`;
    text += `근속기간: ${years}년 ${extraMonths}개월 (${totalDays.toLocaleString()}일)\n`;
    text += `──────────────\n`;
    text += `1일 평균임금: ${f(dailyWage)}원\n`;
    text += `퇴직금: ${f(retirementPay)}원\n`;
    text += `\n※ 퇴직금 = 평균임금 × 30일 × (근속일수/365)`;

    return { content: [{ type: "text", text }] };
  }

  /* --- rent_converter --- */
  if (name === "rent_converter") {
    const { type } = args;
    const conversionRate = args.conversion_rate || 5.5; // 2026년 기준 전월세전환율

    if (!["jeonse_to_wolse", "wolse_to_jeonse"].includes(type)) {
      return { content: [{ type: "text", text: "오류: type은 jeonse_to_wolse 또는 wolse_to_jeonse여야 합니다." }] };
    }

    const f = (n) => Math.round(n).toLocaleString();

    if (type === "jeonse_to_wolse") {
      const jeonseDeposit = args.jeonse_deposit;
      if (jeonseDeposit == null || jeonseDeposit <= 0) {
        return { content: [{ type: "text", text: "오류: 전세 보증금(jeonse_deposit)이 필요합니다." }] };
      }
      const newDeposit = args.new_deposit || 0;
      if (newDeposit >= jeonseDeposit) {
        return { content: [{ type: "text", text: "오류: 희망 보증금(new_deposit)은 전세 보증금보다 작아야 합니다." }] };
      }

      const diff = jeonseDeposit - newDeposit;
      const monthlyRent = Math.round(diff * (conversionRate / 100) / 12);

      let text = `[ 전세 → 월세 전환 ]\n`;
      text += `전세 보증금: ${f(jeonseDeposit)}원\n`;
      text += `전환율: ${conversionRate}%\n`;
      text += `──────────────\n`;
      text += `월세 보증금: ${f(newDeposit)}원\n`;
      text += `전환 대상 금액: ${f(diff)}원\n`;
      text += `적정 월세: ${f(monthlyRent)}원`;

      return { content: [{ type: "text", text }] };
    } else {
      const wolseDeposit = args.wolse_deposit;
      const monthlyRent = args.monthly_rent;
      if (monthlyRent == null || monthlyRent <= 0) {
        return { content: [{ type: "text", text: "오류: 월세 금액(monthly_rent)이 필요합니다." }] };
      }
      if (wolseDeposit == null || wolseDeposit < 0) {
        return { content: [{ type: "text", text: "오류: 월세 보증금(wolse_deposit)이 필요합니다." }] };
      }

      const convertedDeposit = Math.round(monthlyRent * 12 / (conversionRate / 100));
      const jeonseDeposit = wolseDeposit + convertedDeposit;

      let text = `[ 월세 → 전세 전환 ]\n`;
      text += `월세 보증금: ${f(wolseDeposit)}원\n`;
      text += `월세: ${f(monthlyRent)}원\n`;
      text += `전환율: ${conversionRate}%\n`;
      text += `──────────────\n`;
      text += `월세 환산 보증금: ${f(convertedDeposit)}원\n`;
      text += `적정 전세금: ${f(jeonseDeposit)}원`;

      return { content: [{ type: "text", text }] };
    }
  }

  /* --- investment_return --- */
  if (name === "investment_return") {
    const { buy_price, sell_price } = args;
    const quantity = args.quantity || 1;
    const assetType = args.asset_type || "general";

    if (buy_price == null || buy_price <= 0) {
      return { content: [{ type: "text", text: "오류: 매수 단가(buy_price)는 0보다 커야 합니다." }] };
    }
    if (sell_price == null || sell_price <= 0) {
      return { content: [{ type: "text", text: "오류: 매도 단가(sell_price)는 0보다 커야 합니다." }] };
    }

    // 자산별 기본 수수료/세율 설정
    let feeRate = args.fee_rate;
    let taxRate = args.tax_rate;

    if (assetType === "stock") {
      if (feeRate == null) feeRate = 0.015;   // 증권사 수수료 0.015%
      if (taxRate == null) taxRate = 0.18;     // 증권거래세 0.18% (2026년)
    } else if (assetType === "crypto") {
      if (feeRate == null) feeRate = 0.05;     // 거래소 수수료 0.05%
      if (taxRate == null) taxRate = 0;         // 별도 과세 (250만원 초과분 22%)
    } else {
      if (feeRate == null) feeRate = 0;
      if (taxRate == null) taxRate = 0;
    }

    const totalBuy = buy_price * quantity;
    const totalSell = sell_price * quantity;
    const buyFee = totalBuy * (feeRate / 100);
    const sellFee = totalSell * (feeRate / 100);
    const sellTax = totalSell * (taxRate / 100);
    const totalFees = buyFee + sellFee + sellTax;
    const grossProfit = totalSell - totalBuy;
    const netProfit = grossProfit - totalFees;
    const grossReturn = ((sell_price - buy_price) / buy_price) * 100;
    const netReturn = (netProfit / totalBuy) * 100;

    const f = (n) => Math.round(n).toLocaleString();
    const assetLabel = assetType === "stock" ? "국내주식" : assetType === "crypto" ? "암호화폐" : "일반";

    let text = `[ 투자 수익률 계산 - ${assetLabel} ]\n`;
    text += `매수 단가: ${f(buy_price)}원 × ${quantity}개 = ${f(totalBuy)}원\n`;
    text += `매도 단가: ${f(sell_price)}원 × ${quantity}개 = ${f(totalSell)}원\n`;
    text += `──────────────\n`;
    text += `매수 수수료 (${feeRate}%): ${f(buyFee)}원\n`;
    text += `매도 수수료 (${feeRate}%): ${f(sellFee)}원\n`;
    if (taxRate > 0) {
      text += `매도 세금 (${taxRate}%): ${f(sellTax)}원\n`;
    }
    text += `총 비용: ${f(totalFees)}원\n`;
    text += `──────────────\n`;
    text += `총 수익 (세전): ${grossProfit >= 0 ? "+" : ""}${f(grossProfit)}원 (${grossReturn >= 0 ? "+" : ""}${grossReturn.toFixed(2)}%)\n`;
    text += `실현 손익: ${netProfit >= 0 ? "+" : ""}${f(netProfit)}원 (${netReturn >= 0 ? "+" : ""}${netReturn.toFixed(2)}%)`;

    if (assetType === "crypto" && netProfit > 2500000) {
      const taxableProfit = netProfit - 2500000;
      const cryptoTax = Math.round(taxableProfit * 0.22);
      text += `\n──────────────\n`;
      text += `※ 암호화폐 과세 (250만원 공제 후 22%)\n`;
      text += `과세 대상: ${f(taxableProfit)}원\n`;
      text += `예상 세금: ${f(cryptoTax)}원\n`;
      text += `세후 순이익: ${f(netProfit - cryptoTax)}원`;
    }

    return { content: [{ type: "text", text }] };
  }

  /* --- excel_savings_analyzer --- */
  if (name === "excel_savings_analyzer") {
    const { file_path: filePath } = args;
    const savingsGoalRate = args.savings_goal_rate || 20;

    try {
      // 파일 경로 정규화
      const normalizedPath = path.resolve(filePath.replace(/\\/g, "/"));
      if (!fs.existsSync(normalizedPath)) {
        return { content: [{ type: "text", text: `오류: 파일을 찾을 수 없습니다.\n경로: ${normalizedPath}` }] };
      }

      const workbook = XLSX.readFile(normalizedPath);
      const sheetName = args.sheet_name || workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        return { content: [{ type: "text", text: `오류: "${sheetName}" 시트를 찾을 수 없습니다.\n사용 가능: ${workbook.SheetNames.join(", ")}` }] };
      }

      const data = XLSX.utils.sheet_to_json(sheet);
      if (data.length === 0) {
        return { content: [{ type: "text", text: "오류: 시트에 데이터가 없습니다." }] };
      }

      const headers = Object.keys(data[0]);

      // 컬럼 자동 감지
      const incomeKeywords = ["수입", "income", "급여", "월급", "소득", "입금", "수령", "매출"];
      const expenseKeywords = ["지출", "expense", "비용", "출금", "소비", "결제", "사용"];
      const categoryKeywords = ["카테고리", "category", "분류", "항목", "구분", "내역", "용도"];
      const dateKeywords = ["날짜", "date", "일자", "일시", "거래일"];
      const amountKeywords = ["금액", "amount", "액수", "원"];

      const findCol = (keywords, explicit) => {
        if (explicit) return headers.find(h => h === explicit) || explicit;
        return headers.find(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
      };

      const incomeCol = findCol(incomeKeywords, args.income_col);
      const expenseCol = findCol(expenseKeywords, args.expense_col);
      const categoryCol = findCol(categoryKeywords, args.category_col);
      const dateCol = findCol(dateKeywords, args.date_col);

      // 금액 컬럼도 감지 (단일 금액 컬럼 + 유형 구분 방식 지원)
      const amountCol = headers.find(h => amountKeywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
      const typeKeywords = ["유형", "type", "타입", "구분", "입출금"];
      const typeCol = headers.find(h => typeKeywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

      const f = (n) => Math.round(n).toLocaleString();
      let totalIncome = 0;
      let totalExpense = 0;
      const categoryMap = {};
      const monthlyData = {};

      for (const row of data) {
        let income = 0;
        let expense = 0;

        // 수입/지출 컬럼이 각각 있는 경우
        if (incomeCol && row[incomeCol] != null) {
          const val = typeof row[incomeCol] === "string" ? parseFloat(row[incomeCol].replace(/[,원₩\s]/g, "")) : row[incomeCol];
          if (!isNaN(val) && val > 0) income = val;
        }
        if (expenseCol && row[expenseCol] != null) {
          const val = typeof row[expenseCol] === "string" ? parseFloat(row[expenseCol].replace(/[,원₩\s]/g, "")) : row[expenseCol];
          if (!isNaN(val) && val > 0) expense = val;
        }

        // 단일 금액 컬럼 + 유형 구분 방식
        if (!incomeCol && !expenseCol && amountCol && row[amountCol] != null) {
          const val = typeof row[amountCol] === "string" ? parseFloat(row[amountCol].replace(/[,원₩\s]/g, "")) : row[amountCol];
          if (!isNaN(val)) {
            if (typeCol) {
              const t = String(row[typeCol]).toLowerCase();
              if (["수입", "입금", "income", "in"].some(k => t.includes(k))) income = Math.abs(val);
              else expense = Math.abs(val);
            } else {
              if (val >= 0) income = val; else expense = Math.abs(val);
            }
          }
        }

        totalIncome += income;
        totalExpense += expense;

        // 카테고리별 집계
        if (categoryCol && row[categoryCol]) {
          const cat = String(row[categoryCol]).trim();
          if (!categoryMap[cat]) categoryMap[cat] = { income: 0, expense: 0 };
          categoryMap[cat].income += income;
          categoryMap[cat].expense += expense;
        }

        // 월별 집계
        if (dateCol && row[dateCol]) {
          let dateStr = String(row[dateCol]);
          // 엑셀 날짜 숫자 변환
          if (!isNaN(row[dateCol]) && row[dateCol] > 30000) {
            const d = XLSX.SSF.parse_date_code(row[dateCol]);
            dateStr = `${d.y}-${String(d.m).padStart(2, "0")}`;
          } else {
            const match = dateStr.match(/(\d{4})[.-/](\d{1,2})/);
            if (match) dateStr = `${match[1]}-${match[2].padStart(2, "0")}`;
          }
          const monthKey = dateStr.substring(0, 7);
          if (/\d{4}-\d{2}/.test(monthKey)) {
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0 };
            monthlyData[monthKey].income += income;
            monthlyData[monthKey].expense += expense;
          }
        }
      }

      const savings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
      const monthCount = Object.keys(monthlyData).length || 1;
      const avgMonthlyIncome = totalIncome / monthCount;
      const avgMonthlyExpense = totalExpense / monthCount;
      const avgMonthlySavings = savings / monthCount;
      const targetSavings = avgMonthlyIncome * (savingsGoalRate / 100);
      const gap = targetSavings - avgMonthlySavings;

      let text = `[ 엑셀 저축 분석 결과 ]\n`;
      text += `파일: ${path.basename(normalizedPath)}\n`;
      text += `시트: ${sheetName} | 데이터: ${data.length}건\n`;
      text += `감지 컬럼: ${[incomeCol && `수입(${incomeCol})`, expenseCol && `지출(${expenseCol})`, categoryCol && `분류(${categoryCol})`, dateCol && `날짜(${dateCol})`, amountCol && `금액(${amountCol})`].filter(Boolean).join(", ") || "자동감지 실패"}\n`;
      text += `══════════════════\n`;
      text += `📊 전체 요약 (${monthCount}개월)\n`;
      text += `──────────────\n`;
      text += `총 수입: ${f(totalIncome)}원\n`;
      text += `총 지출: ${f(totalExpense)}원\n`;
      text += `총 저축: ${f(savings)}원 (저축률 ${savingsRate.toFixed(1)}%)\n`;
      text += `\n📅 월 평균\n`;
      text += `──────────────\n`;
      text += `월 수입: ${f(avgMonthlyIncome)}원\n`;
      text += `월 지출: ${f(avgMonthlyExpense)}원\n`;
      text += `월 저축: ${f(avgMonthlySavings)}원\n`;

      // 목표 저축률 대비
      text += `\n🎯 목표 저축률: ${savingsGoalRate}% (월 ${f(targetSavings)}원)\n`;
      if (gap > 0) {
        text += `현재 저축률: ${savingsRate.toFixed(1)}% → 월 ${f(gap)}원 추가 절약 필요\n`;
      } else {
        text += `✅ 목표 달성! (현재 ${savingsRate.toFixed(1)}%)\n`;
      }

      // 카테고리별 지출 분석
      const catEntries = Object.entries(categoryMap).filter(([, v]) => v.expense > 0).sort((a, b) => b[1].expense - a[1].expense);
      if (catEntries.length > 0) {
        text += `\n📂 카테고리별 지출 TOP\n`;
        text += `──────────────\n`;
        catEntries.slice(0, 10).forEach(([cat, val], i) => {
          const pct = totalExpense > 0 ? (val.expense / totalExpense * 100).toFixed(1) : 0;
          text += `${i + 1}. ${cat}: ${f(val.expense)}원 (${pct}%)\n`;
        });
      }

      // 월별 추이
      const monthKeys = Object.keys(monthlyData).sort();
      if (monthKeys.length > 1) {
        text += `\n📈 월별 저축 추이\n`;
        text += `──────────────\n`;
        monthKeys.forEach(m => {
          const d = monthlyData[m];
          const ms = d.income - d.expense;
          const bar = ms >= 0 ? "▓".repeat(Math.min(Math.round(ms / avgMonthlySavings * 5), 20)) : "░";
          text += `${m}: ${f(ms)}원 ${bar}\n`;
        });
      }

      // 저축 추천
      text += `\n💡 저축 추천\n`;
      text += `──────────────\n`;
      if (catEntries.length > 0) {
        const topExpense = catEntries[0];
        text += `• 최대 지출 "${topExpense[0]}" (${f(topExpense[1].expense)}원) 10% 절감 시 월 ${f(topExpense[1].expense * 0.1 / monthCount)}원 추가 저축 가능\n`;
      }
      if (avgMonthlySavings > 0) {
        text += `• 현재 페이스로 1년 저축 예상: ${f(avgMonthlySavings * 12)}원\n`;
        text += `• 복리 3.5% 적금 시 1년 후: ${f(avgMonthlySavings * 12 * (1 + 0.035 / 2))}원\n`;
      }

      return { content: [{ type: "text", text }] };
    } catch (err) {
      return { content: [{ type: "text", text: `엑셀 분석 오류: ${err.message}` }] };
    }
  }

  /* --- excel_savings_plan --- */
  if (name === "excel_savings_plan") {
    const { file_path: filePath } = args;
    const savingsType = args.savings_type || "auto";

    try {
      const normalizedPath = path.resolve(filePath.replace(/\\/g, "/"));
      if (!fs.existsSync(normalizedPath)) {
        return { content: [{ type: "text", text: `오류: 파일을 찾을 수 없습니다.\n경로: ${normalizedPath}` }] };
      }

      const workbook = XLSX.readFile(normalizedPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      if (data.length === 0) {
        return { content: [{ type: "text", text: "오류: 시트에 데이터가 없습니다." }] };
      }

      const headers = Object.keys(data[0]);
      const incomeKeywords = ["수입", "income", "급여", "월급", "소득", "입금"];
      const expenseKeywords = ["지출", "expense", "비용", "출금", "소비", "결제"];
      const dateKeywords = ["날짜", "date", "일자", "일시"];
      const amountKeywords = ["금액", "amount"];
      const typeKeywords = ["유형", "type", "구분", "입출금"];

      const findCol = (keywords) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
      const incomeCol = findCol(incomeKeywords);
      const expenseCol = findCol(expenseKeywords);
      const dateCol = findCol(dateKeywords);
      const amountCol = findCol(amountKeywords);
      const typeCol = findCol(typeKeywords);

      // 월별 수입/지출 집계
      const monthlyData = {};
      for (const row of data) {
        let income = 0, expense = 0;
        if (incomeCol && row[incomeCol] != null) {
          const v = typeof row[incomeCol] === "string" ? parseFloat(row[incomeCol].replace(/[,원₩\s]/g, "")) : row[incomeCol];
          if (!isNaN(v) && v > 0) income = v;
        }
        if (expenseCol && row[expenseCol] != null) {
          const v = typeof row[expenseCol] === "string" ? parseFloat(row[expenseCol].replace(/[,원₩\s]/g, "")) : row[expenseCol];
          if (!isNaN(v) && v > 0) expense = v;
        }
        if (!incomeCol && !expenseCol && amountCol && row[amountCol] != null) {
          const v = typeof row[amountCol] === "string" ? parseFloat(row[amountCol].replace(/[,원₩\s]/g, "")) : row[amountCol];
          if (!isNaN(v)) {
            if (typeCol) {
              const t = String(row[typeCol]).toLowerCase();
              if (["수입", "입금", "income"].some(k => t.includes(k))) income = Math.abs(v);
              else expense = Math.abs(v);
            } else {
              if (v >= 0) income = v; else expense = Math.abs(v);
            }
          }
        }

        let monthKey = "unknown";
        if (dateCol && row[dateCol]) {
          let ds = String(row[dateCol]);
          if (!isNaN(row[dateCol]) && row[dateCol] > 30000) {
            const d = XLSX.SSF.parse_date_code(row[dateCol]);
            monthKey = `${d.y}-${String(d.m).padStart(2, "0")}`;
          } else {
            const m = ds.match(/(\d{4})[.-/](\d{1,2})/);
            if (m) monthKey = `${m[1]}-${m[2].padStart(2, "0")}`;
          }
        }
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0 };
        monthlyData[monthKey].income += income;
        monthlyData[monthKey].expense += expense;
      }

      const months = Object.keys(monthlyData).filter(k => k !== "unknown").sort();
      const monthCount = months.length || 1;
      let totalIncome = 0, totalExpense = 0;
      Object.values(monthlyData).forEach(v => { totalIncome += v.income; totalExpense += v.expense; });

      const avgIncome = totalIncome / monthCount;
      const avgExpense = totalExpense / monthCount;
      const avgSavings = avgIncome - avgExpense;

      // 저축 금액 결정
      let monthlySavingsTarget;
      const targetAmount = args.target_amount || 0;
      const targetMonths = args.target_months || 12;

      if (savingsType === "fixed" && args.fixed_amount) {
        monthlySavingsTarget = args.fixed_amount;
      } else if (savingsType === "percent" && args.percent) {
        monthlySavingsTarget = avgIncome * (args.percent / 100);
      } else if (targetAmount > 0) {
        monthlySavingsTarget = targetAmount / targetMonths;
      } else {
        // auto: 현재 저축 가능액의 80% (안전 마진)
        monthlySavingsTarget = Math.max(avgSavings * 0.8, 0);
      }

      const f = (n) => Math.round(n).toLocaleString();

      // 저축 플랜 엑셀 생성
      const planData = [];
      let cumulative = 0;
      const interestRate = 0.035; // 연 3.5% 적금 가정
      let totalInterest = 0;

      for (let i = 1; i <= targetMonths; i++) {
        cumulative += monthlySavingsTarget;
        const monthlyInterest = cumulative * (interestRate / 12);
        totalInterest += monthlyInterest;
        planData.push({
          "월차": `${i}개월`,
          "월 저축액": Math.round(monthlySavingsTarget),
          "누적 저축액": Math.round(cumulative),
          "예상 이자 (연 3.5%)": Math.round(totalInterest),
          "예상 총액": Math.round(cumulative + totalInterest),
          "목표 달성률 (%)": targetAmount > 0 ? Math.min(((cumulative + totalInterest) / targetAmount * 100), 100).toFixed(1) : "-"
        });
      }

      // 월별 실적 시트 데이터
      const monthlySheet = months.map(m => ({
        "월": m,
        "수입": Math.round(monthlyData[m].income),
        "지출": Math.round(monthlyData[m].expense),
        "저축": Math.round(monthlyData[m].income - monthlyData[m].expense),
        "저축률 (%)": monthlyData[m].income > 0 ? ((monthlyData[m].income - monthlyData[m].expense) / monthlyData[m].income * 100).toFixed(1) : "0"
      }));

      // 요약 시트
      const summaryData = [
        { "항목": "분석 기간", "값": `${monthCount}개월` },
        { "항목": "월 평균 수입", "값": Math.round(avgIncome) },
        { "항목": "월 평균 지출", "값": Math.round(avgExpense) },
        { "항목": "월 평균 저축", "값": Math.round(avgSavings) },
        { "항목": "현재 저축률", "값": `${(avgIncome > 0 ? avgSavings / avgIncome * 100 : 0).toFixed(1)}%` },
        { "항목": "──────────", "값": "──────────" },
        { "항목": "월 목표 저축액", "값": Math.round(monthlySavingsTarget) },
        { "항목": "목표 기간", "값": `${targetMonths}개월` },
        { "항목": "목표 총 저축액", "값": targetAmount > 0 ? targetAmount : Math.round(monthlySavingsTarget * targetMonths) },
        { "항목": "예상 이자 포함 총액", "값": Math.round(planData[planData.length - 1]["예상 총액"]) },
      ];

      // 엑셀 파일 생성
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(summaryData), "요약");
      XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(planData), "저축플랜");
      if (monthlySheet.length > 0) {
        XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(monthlySheet), "월별실적");
      }

      const baseName = path.basename(normalizedPath, path.extname(normalizedPath));
      const outputPath = args.output_path
        ? path.resolve(args.output_path.replace(/\\/g, "/"))
        : path.join(path.dirname(normalizedPath), `${baseName}_저축플랜.xlsx`);

      XLSX.writeFile(newWb, outputPath);

      const finalTotal = planData[planData.length - 1]["예상 총액"];
      let text = `[ 저축 플랜 생성 완료 ]\n`;
      text += `══════════════════\n`;
      text += `📊 현재 재무 상태\n`;
      text += `  월 평균 수입: ${f(avgIncome)}원\n`;
      text += `  월 평균 지출: ${f(avgExpense)}원\n`;
      text += `  월 평균 저축: ${f(avgSavings)}원\n`;
      text += `\n🎯 저축 플랜\n`;
      text += `  월 저축 목표: ${f(monthlySavingsTarget)}원\n`;
      text += `  저축 기간: ${targetMonths}개월\n`;
      text += `  예상 이자 (연 3.5%): ${f(totalInterest)}원\n`;
      text += `  ${targetMonths}개월 후 예상 총액: ${f(finalTotal)}원\n`;
      if (targetAmount > 0) {
        const achieveMonth = planData.findIndex(p => p["예상 총액"] >= targetAmount) + 1;
        if (achieveMonth > 0) {
          text += `  목표 ${f(targetAmount)}원 달성: ${achieveMonth}개월 소요\n`;
        } else {
          text += `  ⚠️ ${targetMonths}개월 내 목표 미달성 (부족: ${f(targetAmount - finalTotal)}원)\n`;
        }
      }

      if (monthlySavingsTarget > avgSavings) {
        const cutNeeded = monthlySavingsTarget - avgSavings;
        text += `\n⚠️ 현재 저축액 대비 월 ${f(cutNeeded)}원 추가 절약 필요\n`;
      }

      text += `\n📁 결과 파일 저장됨:\n  ${outputPath}\n`;
      text += `  (시트: 요약, 저축플랜, 월별실적)`;

      return { content: [{ type: "text", text }] };
    } catch (err) {
      return { content: [{ type: "text", text: `저축 플랜 생성 오류: ${err.message}` }] };
    }
  }

  /* --- security_news --- */
  if (name === "security_news") {
    const count = Math.min(Math.max((args.count != null ? args.count : 5), 1), 10);
    const keyword = args.keyword || "";

    try {
      const html = await new Promise((resolve, reject) => {
        const url = "https://www.boho.or.kr/kr/bbs/list.do?menuNo=205020&bbsId=B0000133";
        const req = https.get(url, { timeout: 5000 }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            https.get(res.headers.location, { timeout: 5000 }, (res2) => {
              let data = "";
              res2.on("data", (chunk) => data += chunk);
              res2.on("end", () => resolve(data));
              res2.on("error", reject);
            }).on("error", reject);
            return;
          }
          let data = "";
          res.on("data", (chunk) => data += chunk);
          res.on("end", () => resolve(data));
          res.on("error", reject);
        });
        req.on("error", reject);
        req.on("timeout", () => { req.destroy(); reject(new Error("요청 시간 초과 (5초)")); });
      });

      // 게시물 파싱: <td class="title"> 안의 링크와 날짜
      const rows = [];
      const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
      let rowMatch;
      while ((rowMatch = rowRegex.exec(html)) !== null) {
        const row = rowMatch[0];
        // 제목 링크 추출
        const titleMatch = row.match(/<td[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleMatch) continue;
        const title = titleMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        if (!title) continue;

        // nttId 추출
        const nttIdMatch = row.match(/nttId[=:](\d+)/);
        const nttId = nttIdMatch ? nttIdMatch[1] : null;

        // 날짜 추출
        const dateMatch = row.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : "";

        rows.push({ title, nttId, date });
      }

      // keyword 필터링
      let filtered = keyword
        ? rows.filter(r => r.title.toLowerCase().includes(keyword.toLowerCase()))
        : rows;

      filtered = filtered.slice(0, count);

      if (filtered.length === 0) {
        const msg = keyword
          ? `"${keyword}" 키워드에 해당하는 보안공지가 없습니다.`
          : "보안공지를 가져올 수 없습니다. 페이지 구조가 변경되었을 수 있습니다.";
        return { content: [{ type: "text", text: msg }] };
      }

      let text = keyword
        ? `[ KISA 보안공지 - "${keyword}" 검색 결과 ${filtered.length}건 ]\n`
        : `[ KISA 보안공지 - 최신 ${filtered.length}건 ]\n`;
      text += `──────────────\n`;

      filtered.forEach((item, i) => {
        const link = item.nttId
          ? `https://www.boho.or.kr/kr/bbs/view.do?bbsId=B0000133&nttId=${item.nttId}&menuNo=205020`
          : "https://www.boho.or.kr/kr/bbs/list.do?menuNo=205020&bbsId=B0000133";
        text += `${i + 1}. ${item.title}`;
        if (item.date) text += ` (${item.date})`;
        text += `\n   🔗 ${link}\n`;
        if (i < filtered.length - 1) text += `\n`;
      });

      return { content: [{ type: "text", text }] };
    } catch (err) {
      return { content: [{ type: "text", text: `보안공지 조회 실패: ${err.message}\n\n직접 확인: https://www.boho.or.kr/kr/bbs/list.do?menuNo=205020&bbsId=B0000133` }] };
    }
  }

  /* --- kisec_exam_schedule --- */
  if (name === "kisec_exam_schedule") {
    const examType = (args.type || "기사").trim();
    const round = args.round || null;

    // 2026년 정보보안기사 시험일정 (출처: 한국방송통신전파진흥원 cq.or.kr)
    const schedule = {
      "기사": {
        name: "정보보안기사",
        year: 2026,
        rounds: [
          {
            round: 1,
            필기시험_원서접수: "1.26(월) ~ 1.29(목)",
            필기시험: "2.9(월) ~ 3.6(금)",
            필기합격_발표: "3.13(금)",
            응시자격_서류제출: "2.9(월) ~ 3.17(화)",
            실기시험_원서접수: "3.16(월) ~ 3.19(목)",
            실기시험: "3.28(토) ~ 3.30(월)",
            최종합격_발표: "4.10(금)"
          },
          {
            round: 2,
            필기시험_원서접수: "5.11(월) ~ 5.14(목)",
            필기시험: "5.22(금) ~ 6.15(월)",
            필기합격_발표: "6.19(금)",
            응시자격_서류제출: "5.26(화) ~ 6.25(목)",
            실기시험_원서접수: "6.22(월) ~ 6.25(목)",
            실기시험: "7.4(토) ~ 7.6(월)",
            최종합격_발표: "7.17(금)"
          }
        ]
      },
      "산업기사": {
        name: "정보보안산업기사",
        year: 2026,
        rounds: [
          {
            round: 1,
            필기시험_원서접수: "1.26(월) ~ 1.29(목)",
            필기시험: "2.9(월) ~ 3.6(금)",
            필기합격_발표: "3.13(금)",
            응시자격_서류제출: "2.9(월) ~ 3.17(화)",
            실기시험_원서접수: "3.16(월) ~ 3.19(목)",
            실기시험: "3.28(토) ~ 3.30(월)",
            최종합격_발표: "4.10(금)"
          },
          {
            round: 2,
            필기시험_원서접수: "5.11(월) ~ 5.14(목)",
            필기시험: "5.22(금) ~ 6.15(월)",
            필기합격_발표: "6.19(금)",
            응시자격_서류제출: "5.26(화) ~ 6.25(목)",
            실기시험_원서접수: "6.22(월) ~ 6.25(목)",
            실기시험: "7.4(토) ~ 7.6(월)",
            최종합격_발표: "7.17(금)"
          }
        ]
      }
    };

    const key = examType.includes("산업") ? "산업기사" : "기사";
    const exam = schedule[key];

    if (!exam) {
      return { content: [{ type: "text", text: "오류: type은 '기사' 또는 '산업기사'여야 합니다." }] };
    }

    let rounds = exam.rounds;
    if (round) {
      rounds = rounds.filter(r => r.round === round);
      if (rounds.length === 0) {
        return { content: [{ type: "text", text: `오류: ${round}회차 일정이 없습니다. (1회 또는 2회만 가능)` }] };
      }
    }

    // 오늘 날짜 기준 다음 일정 안내
    const today = new Date();
    const todayStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

    let text = `[ ${exam.year}년 ${exam.name} 시험일정 ]\n`;
    text += `출처: 한국방송통신전파진흥원 (cq.or.kr)\n`;
    text += `══════════════════════════════════════\n`;

    for (const r of rounds) {
      text += `\n▶ 제${r.round}회\n`;
      text += `┌──────────────────────────────────────┐\n`;
      text += `│ 필기시험 원서접수  │ ${r.필기시험_원서접수.padEnd(24)}│\n`;
      text += `│ 필기시험 (CBT)    │ ${r.필기시험.padEnd(24)}│\n`;
      text += `│ 필기합격 발표      │ ${r.필기합격_발표.padEnd(24)}│\n`;
      text += `│ 응시자격 서류제출  │ ${r.응시자격_서류제출.padEnd(24)}│\n`;
      text += `│ 실기시험 원서접수  │ ${r.실기시험_원서접수.padEnd(24)}│\n`;
      text += `│ 실기시험           │ ${r.실기시험.padEnd(24)}│\n`;
      text += `│ 최종합격 발표      │ ${r.최종합격_발표.padEnd(24)}│\n`;
      text += `└──────────────────────────────────────┘\n`;
    }

    text += `\n──────────────────────────────────────\n`;
    text += `※ 필기시험: CBT(컴퓨터 기반 시험) 평일 검정\n`;
    text += `※ 시험시간: 필기 120분, 실기 150분\n`;
    text += `※ 원서접수: 첫날 10:00 ~ 마지막날 18:00\n`;
    text += `※ 합격발표: 발표일 10:00 (cq.or.kr)\n`;
    text += `※ 연 2회 시행 (한국방송통신전파진흥원 주관)\n`;

    // 다음 일정 안내
    const parseDate = (str) => {
      const m = str.match(/(\d{1,2})\.(\d{1,2})/);
      if (!m) return null;
      return new Date(2026, parseInt(m[1]) - 1, parseInt(m[2]));
    };

    let nextEvent = null;
    for (const r of exam.rounds) {
      const events = [
        { label: `제${r.round}회 필기 원서접수`, date: parseDate(r.필기시험_원서접수) },
        { label: `제${r.round}회 필기시험`, date: parseDate(r.필기시험) },
        { label: `제${r.round}회 필기합격 발표`, date: parseDate(r.필기합격_발표) },
        { label: `제${r.round}회 실기 원서접수`, date: parseDate(r.실기시험_원서접수) },
        { label: `제${r.round}회 실기시험`, date: parseDate(r.실기시험) },
        { label: `제${r.round}회 최종합격 발표`, date: parseDate(r.최종합격_발표) }
      ];
      for (const e of events) {
        if (e.date && e.date >= today) {
          if (!nextEvent || e.date < nextEvent.date) {
            nextEvent = e;
          }
          break;
        }
      }
    }

    if (nextEvent) {
      const diff = Math.ceil((nextEvent.date - today) / (1000 * 60 * 60 * 24));
      text += `\n📌 다음 일정: ${nextEvent.label}`;
      if (diff === 0) text += ` (오늘!)`;
      else if (diff > 0) text += ` (${diff}일 남음)`;
    }

    return { content: [{ type: "text", text }] };
  }

  /* --- stock_tax_calculator --- */
  if (name === "stock_tax_calculator") {
    const { type } = args;
    const f = (n) => Math.round(n).toLocaleString();

    if (type === "domestic_transaction") {
      const { sell_price, buy_price, market = "KOSPI", is_major_shareholder = false } = args;
      if (!sell_price || sell_price <= 0) {
        return { content: [{ type: "text", text: "오류: 매도 총액(sell_price)을 입력해주세요." }] };
      }

      // 2026년 증권거래세율 (KOSPI: 농어촌특별세 0.15%, KOSDAQ: 거래세 0.15%, KONEX: 0.10%)
      const marketKey = (market || "KOSPI").toUpperCase();
      const taxRates = { KOSPI: 0.0015, KOSDAQ: 0.0015, KONEX: 0.001 };
      const taxRate = taxRates[marketKey] ?? 0.0015;
      const transactionTax = sell_price * taxRate;

      const gain = (buy_price != null) ? sell_price - buy_price : null;
      let capitalGainsTax = 0;
      let capitalGainsTaxDetail = "";

      if (is_major_shareholder && gain != null && gain > 0) {
        // 대주주 양도소득세: 3억 이하 20%, 3억 초과 25% + 지방소득세 10%
        const under3B = Math.min(gain, 300000000);
        const over3B = Math.max(0, gain - 300000000);
        const baseTax = under3B * 0.20 + over3B * 0.25;
        const localTax = baseTax * 0.10;
        capitalGainsTax = baseTax + localTax;
        capitalGainsTaxDetail = `양도세 ${f(baseTax)}원 + 지방세 ${f(localTax)}원`;
      }

      let text = `[ 국내주식 매매 세금 계산 ]\n`;
      text += `시장: ${marketKey}\n`;
      text += `매도금액: ${f(sell_price)}원\n`;
      if (buy_price != null) text += `매수금액: ${f(buy_price)}원\n`;
      if (gain != null) text += `손익: ${gain >= 0 ? "+" : ""}${f(gain)}원\n`;
      text += `──────────────\n`;
      text += `증권거래세 (${(taxRate * 100).toFixed(2)}%): ${f(transactionTax)}원\n`;
      if (is_major_shareholder && gain != null && gain > 0) {
        text += `양도소득세 (대주주): ${f(capitalGainsTax)}원 (${capitalGainsTaxDetail})\n`;
      } else if (is_major_shareholder && gain != null && gain <= 0) {
        text += `양도소득세: 없음 (손실)\n`;
      } else {
        text += `양도소득세: 비과세 (소액주주)\n`;
      }
      text += `──────────────\n`;
      text += `총 세금: ${f(transactionTax + capitalGainsTax)}원\n`;
      text += `실수령액: ${f(sell_price - transactionTax - capitalGainsTax)}원\n`;
      text += `\n※ 2026년 기준: KOSPI 농어촌특별세 0.15%, KOSDAQ 거래세 0.15%, KONEX 0.10%\n`;
      if (!is_major_shareholder) {
        text += `※ 소액주주 기준: 종목당 보유액 10억 미만 & 지분율 1%(KOSPI)/2%(KOSDAQ)/4%(KONEX) 미만`;
      }
      return { content: [{ type: "text", text }] };
    }

    if (type === "overseas_capital_gains") {
      const { sell_price, buy_price } = args;
      if (!sell_price || sell_price <= 0 || !buy_price || buy_price <= 0) {
        return { content: [{ type: "text", text: "오류: 매도 총액(sell_price)과 매수 총액(buy_price)을 모두 입력해주세요." }] };
      }

      const gain = sell_price - buy_price;
      const basicDeduction = 2500000; // 연 250만원 기본공제
      const taxableGain = Math.max(0, gain - basicDeduction);
      const incomeTax = taxableGain * 0.20;
      const localTax = taxableGain * 0.02;
      const totalTax = incomeTax + localTax;

      let text = `[ 해외주식 양도소득세 계산 ]\n`;
      text += `매도금액: ${f(sell_price)}원\n`;
      text += `매수금액: ${f(buy_price)}원\n`;
      text += `양도차익: ${gain >= 0 ? "+" : ""}${f(gain)}원\n`;
      text += `──────────────\n`;
      if (gain <= 0) {
        text += `손실 발생 → 세금 없음\n`;
        text += `\n※ 손실은 같은 연도 다른 해외주식 이익과 통산 가능`;
      } else {
        text += `기본공제: -${f(Math.min(gain, basicDeduction))}원 (연 250만원)\n`;
        text += `과세표준: ${f(taxableGain)}원\n`;
        text += `양도소득세 (20%): ${f(incomeTax)}원\n`;
        text += `지방소득세 (2%): ${f(localTax)}원\n`;
        text += `──────────────\n`;
        if (taxableGain === 0) {
          text += `기본공제 범위 내 → 세금 없음\n`;
        } else {
          text += `총 세금: ${f(totalTax)}원 (실효세율 ${((totalTax / gain) * 100).toFixed(2)}%)\n`;
          text += `실수령액: ${f(sell_price - totalTax)}원\n`;
        }
        text += `\n※ 기본공제 250만원은 연간 전체 해외주식 손익 합산 기준\n`;
        text += `※ 신고: 다음 해 5월 양도소득세 종합신고`;
      }
      return { content: [{ type: "text", text }] };
    }

    if (type === "dividend") {
      const { dividend_amount, annual_financial_income = 0 } = args;
      if (!dividend_amount || dividend_amount <= 0) {
        return { content: [{ type: "text", text: "오류: 배당금(dividend_amount)을 입력해주세요." }] };
      }

      const withholdingTax = dividend_amount * 0.14;
      const localTax = dividend_amount * 0.014;
      const totalTax = withholdingTax + localTax;
      const netDividend = dividend_amount - totalTax;
      const totalFinancialIncome = annual_financial_income + dividend_amount;
      const isGlobalTaxable = totalFinancialIncome > 20000000;

      let text = `[ 배당소득세 계산 ]\n`;
      text += `배당금: ${f(dividend_amount)}원\n`;
      text += `──────────────\n`;
      text += `배당소득세 (14%): -${f(withholdingTax)}원\n`;
      text += `지방소득세 (1.4%): -${f(localTax)}원\n`;
      text += `──────────────\n`;
      text += `원천징수 세금: ${f(totalTax)}원 (15.4%)\n`;
      text += `실수령 배당금: ${f(netDividend)}원\n`;
      if (annual_financial_income > 0) {
        text += `\n연간 금융소득 합계: ${f(totalFinancialIncome)}원\n`;
        if (isGlobalTaxable) {
          text += `⚠️ 금융소득종합과세 대상 (2,000만원 초과)\n`;
          text += `  초과분: ${f(totalFinancialIncome - 20000000)}원\n`;
          text += `  → 다음 해 5월 종합소득세 신고 필요 (최고세율 45%+지방세)`;
        } else {
          text += `✅ 금융소득종합과세 비대상 (2,000만원 이하)\n`;
          text += `  잔여 한도: ${f(20000000 - totalFinancialIncome)}원`;
        }
      } else {
        text += `\n※ 금융소득 연 2,000만원 초과 시 종합과세 대상\n`;
        text += `※ annual_financial_income 입력 시 종합과세 여부 판단 가능`;
      }
      return { content: [{ type: "text", text }] };
    }

    return { content: [{ type: "text", text: "오류: type은 domestic_transaction, overseas_capital_gains, dividend 중 하나여야 합니다." }] };
  }

  return { content: [{ type: "text", text: "오류: 알 수 없는 도구입니다." }] };
});

/* =========================
   START SERVER
========================= */
const transport = new StdioServerTransport();
await server.connect(transport);
