import { Router } from 'express';
import type { Response } from 'express';
import { verifyFirebaseAuth } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { generateFinancialInsights } from '../services/geminiService.ts';
import type { FinancialSummaryPayload } from '../services/geminiService.ts';

const router = Router();

function isFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

router.post('/generate', verifyFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Partial<FinancialSummaryPayload> | undefined;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Invalid request payload.' });
      return;
    }

    if (
      typeof body.periodLabel !== 'string' ||
      !body.periodLabel.trim() ||
      !isFiniteNumber(body.totalIncomeINR) ||
      !isFiniteNumber(body.totalExpensesINR) ||
      !isFiniteNumber(body.totalSavingsINR) ||
      !isFiniteNumber(body.transactionCount) ||
      !Array.isArray(body.categoryExpenses)
    ) {
      res.status(400).json({ error: 'Missing required financial summary fields.' });
      return;
    }

    if (body.transactionCount <= 0) {
      res.status(400).json({
        error: 'At least one transaction is required in the selected period before generating AI insights.',
      });
      return;
    }

    const insightType =
      body.insightType === 'spending_alert' || body.insightType === 'budget_review'
        ? body.insightType
        : 'monthly_comprehensive';

    const sanitizedPayload: FinancialSummaryPayload = {
      periodLabel: body.periodLabel.trim().slice(0, 40),
      currency: typeof body.currency === 'string' ? body.currency.slice(0, 3) : 'INR',
      insightType,
      totalIncomeINR: body.totalIncomeINR,
      totalExpensesINR: body.totalExpensesINR,
      totalSavingsINR: body.totalSavingsINR,
      savingsRatePercent: isFiniteNumber(body.savingsRatePercent) ? body.savingsRatePercent : null,
      transactionCount: body.transactionCount,
      previousMonth: {
        hasData: Boolean(body.previousMonth?.hasData),
        label: typeof body.previousMonth?.label === 'string' ? body.previousMonth.label.slice(0, 30) : '',
        totalIncomeINR: isFiniteNumber(body.previousMonth?.totalIncomeINR)
          ? body.previousMonth.totalIncomeINR
          : 0,
        totalExpensesINR: isFiniteNumber(body.previousMonth?.totalExpensesINR)
          ? body.previousMonth.totalExpensesINR
          : 0,
        expenseChangePercent: isFiniteNumber(body.previousMonth?.expenseChangePercent)
          ? body.previousMonth.expenseChangePercent
          : null,
      },
      categoryExpenses: body.categoryExpenses.slice(0, 15).map((item) => ({
        category: String(item.category ?? 'Other').slice(0, 50),
        amountINR: isFiniteNumber(item.amountINR) ? item.amountINR : 0,
        sharePercent: isFiniteNumber(item.sharePercent) ? item.sharePercent : 0,
      })),
      budgets: Array.isArray(body.budgets)
        ? body.budgets.slice(0, 15).map((b) => ({
            category: String(b.category ?? 'Other').slice(0, 50),
            limitINR: isFiniteNumber(b.limitINR) ? b.limitINR : 0,
            spentINR: isFiniteNumber(b.spentINR) ? b.spentINR : 0,
            utilizationPercent: isFiniteNumber(b.utilizationPercent) ? b.utilizationPercent : 0,
          }))
        : [],
      monthlyTrend: Array.isArray(body.monthlyTrend)
        ? body.monthlyTrend.slice(0, 12).map((m) => ({
            monthLabel: String(m.monthLabel ?? '').slice(0, 20),
            incomeINR: isFiniteNumber(m.incomeINR) ? m.incomeINR : 0,
            expensesINR: isFiniteNumber(m.expensesINR) ? m.expensesINR : 0,
          }))
        : [],
      forecast: {
        hasEnoughHistory: Boolean(body.forecast?.hasEnoughHistory),
        averageMonthlyExpenseINR: isFiniteNumber(body.forecast?.averageMonthlyExpenseINR)
          ? body.forecast.averageMonthlyExpenseINR
          : null,
        monthsUsed: isFiniteNumber(body.forecast?.monthsUsed) ? body.forecast.monthsUsed : 0,
      },
    };

    const insights = await generateFinancialInsights(sanitizedPayload);
    res.json({ insights });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('AI Insights generation error:', message);

    if (message === 'GEMINI_API_KEY_MISSING' || message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
      res.status(503).json({
        error:
          'Gemini AI service is not configured or the API key is invalid. Check GEMINI_API_KEY in AI Studio Settings > Secrets.',
      });
      return;
    }

    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      res.status(429).json({
        error: 'Gemini AI rate limit reached. Please wait a moment and try again.',
      });
      return;
    }

    res.status(500).json({
      error: 'Unable to generate AI insights right now. Your financial data remains safe — please try again.',
    });
  }
});

export default router;
