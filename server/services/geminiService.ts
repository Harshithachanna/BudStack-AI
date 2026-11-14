import { GoogleGenAI, Type } from '@google/genai';

export interface FinancialSummaryPayload {
  periodLabel: string;
  currency: string;
  insightType: 'monthly_comprehensive' | 'spending_alert' | 'budget_review';
  totalIncomeINR: number;
  totalExpensesINR: number;
  totalSavingsINR: number;
  savingsRatePercent: number | null;
  transactionCount: number;
  previousMonth: {
    hasData: boolean;
    label: string;
    totalIncomeINR: number;
    totalExpensesINR: number;
    expenseChangePercent: number | null;
  };
  categoryExpenses: Array<{
    category: string;
    amountINR: number;
    sharePercent: number;
  }>;
  budgets: Array<{
    category: string;
    limitINR: number;
    spentINR: number;
    utilizationPercent: number;
  }>;
  monthlyTrend: Array<{
    monthLabel: string;
    incomeINR: number;
    expensesINR: number;
  }>;
  forecast: {
    hasEnoughHistory: boolean;
    averageMonthlyExpenseINR: number | null;
    monthsUsed: number;
  };
}

export interface GeneratedInsightResult {
  summary: string;
  observations: string[];
  unusualSpending: string[];
  savingsSuggestions: string[];
  budgetRecommendations: string[];
  disclaimer: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('500') || msg.includes('ECONNRESET');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function generateFinancialInsights(
  payload: FinancialSummaryPayload,
): Promise<GeneratedInsightResult> {
  const ai = getGeminiClient();

  const systemInstruction = [
    'You are BudStack AI, an analytical personal finance assistant.',
    'Analyze ONLY the exact summarized financial data supplied in the JSON payload.',
    'Rules you MUST follow strictly:',
    '1. Never invent transactions, totals, categories, or historical months not present in the input.',
    '2. Never recalculate or alter supplied numbers; quote the supplied figures accurately using INR (₹).',
    '3. Clearly note if historical data, income, expenses, or budgets are missing or insufficient for comparisons.',
    '4. Clearly distinguish factual observations from optional suggestions (use phrasing like "Suggested:" or "Consider:").',
    '5. Never guarantee financial returns or savings, and never claim outputs are certified professional financial advice.',
    '6. Keep every list item concise (1-2 sentences), practical, and tailored to Indian personal finance contexts (INR ₹).',
  ].join('\n');

  const prompt = `Analyze this user's verified financial summary for ${payload.periodLabel} (focus: ${payload.insightType}):\n${JSON.stringify(payload, null, 2)}`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Clear 2-4 sentence factual summary of income, expenses, savings, and top spending category.',
            },
            observations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 factual observations grounded directly in the supplied numbers.',
            },
            unusualSpending: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '1 to 3 notes on sudden changes vs previous month or high category shares, or explicit note if history is insufficient.',
            },
            savingsSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 practical, non-guaranteed suggestions on where spending could be trimmed based on top categories.',
            },
            budgetRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 clearly labeled suggested category budget adjustments based on utilization and spending.',
            },
            disclaimer: {
              type: Type.STRING,
              description: 'Brief disclaimer stating this analysis is informational only and not professional financial advice.',
            },
          },
          required: [
            'summary',
            'observations',
            'unusualSpending',
            'savingsSuggestions',
            'budgetRecommendations',
            'disclaimer',
          ],
        },
      },
    }),
  );

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('EMPTY_AI_RESPONSE');
  }

  const parsed = JSON.parse(rawText) as Partial<GeneratedInsightResult>;

  const clampArray = (items: unknown, fallback: string[]): string[] => {
    if (!Array.isArray(items)) return fallback;
    const cleaned = items
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .slice(0, 8)
      .map((s) => s.trim().slice(0, 480));
    return cleaned.length > 0 ? cleaned : fallback;
  };

  return {
    summary: (typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'Summary unavailable for the selected period.'
    ).slice(0, 1950),
    observations: clampArray(parsed.observations, ['No specific spending observations available yet.']),
    unusualSpending: clampArray(parsed.unusualSpending, [
      'Insufficient historical data to evaluate unusual spending shifts.',
    ]),
    savingsSuggestions: clampArray(parsed.savingsSuggestions, [
      'Continue recording daily expenses to identify discretionary savings opportunities.',
    ]),
    budgetRecommendations: clampArray(parsed.budgetRecommendations, [
      'Suggested: Create monthly category limits for your top 3 expense categories to track utilization.',
    ]),
    disclaimer: (typeof parsed.disclaimer === 'string' && parsed.disclaimer.trim()
      ? parsed.disclaimer.trim()
      : 'These insights are generated from your recorded BudStack AI data for informational purposes only and do not constitute professional financial advice.'
    ).slice(0, 480),
  };
}
