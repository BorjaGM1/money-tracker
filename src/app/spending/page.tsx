import Link from "next/link";
import { db, spending, spendingCategories } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { getDisplayCurrency, sumInCurrency, type Currency } from "@/lib/currency";
import { CurrencySelector } from "@/components/currency-selector";
import { SpendingGrid, type SpendingYearGroup, type SpendingMonthData } from "@/components/spending-grid";

async function getSpendingYearGroups(displayCurrency: Currency): Promise<SpendingYearGroup[]> {
  // Get all spending with category info
  const allSpending = await db
    .select({
      id: spending.id,
      amount: spending.amount,
      currency: spending.currency,
      date: spending.date,
      categoryColor: spendingCategories.color,
    })
    .from(spending)
    .innerJoin(spendingCategories, eq(spending.categoryId, spendingCategories.id))
    .orderBy(desc(spending.date));

  // Group by year/month
  const monthMap = new Map<string, {
    year: number;
    month: number;
    spending: Array<{ amount: number; currency: string }>;
    categories: Set<string>;
  }>();

  for (const entry of allSpending) {
    const date = new Date(entry.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        year,
        month,
        spending: [],
        categories: new Set(),
      });
    }

    const data = monthMap.get(key)!;
    data.spending.push({ amount: entry.amount, currency: entry.currency });
    if (entry.categoryColor) {
      data.categories.add(entry.categoryColor);
    }
  }

  // Convert to array and calculate totals
  const monthsData: Array<SpendingMonthData & { key: string }> = [];

  for (const [key, data] of monthMap.entries()) {
    const total = await sumInCurrency(data.spending, displayCurrency);
    monthsData.push({
      key,
      year: data.year,
      month: data.month,
      total,
      entryCount: data.spending.length,
      momChange: null, // Will calculate after sorting
      categories: Array.from(data.categories).map(color => ({ color })),
    });
  }

  // Sort by date descending
  monthsData.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Calculate MoM changes
  for (let i = 0; i < monthsData.length - 1; i++) {
    monthsData[i].momChange = monthsData[i].total - monthsData[i + 1].total;
  }

  // Group by year
  const yearMap = new Map<number, SpendingYearGroup>();

  for (const month of monthsData) {
    if (!yearMap.has(month.year)) {
      yearMap.set(month.year, {
        year: month.year,
        totalSpending: 0,
        yoyChange: 0,
        months: [],
      });
    }
    const group = yearMap.get(month.year)!;
    group.totalSpending += month.total;
    group.months.push({
      year: month.year,
      month: month.month,
      total: month.total,
      entryCount: month.entryCount,
      momChange: month.momChange,
      categories: month.categories,
    });
  }

  // Calculate YoY change
  const years = Array.from(yearMap.keys()).sort((a, b) => b - a);

  for (let i = 0; i < years.length; i++) {
    const currentYear = years[i];
    const prevYear = years[i + 1];
    const currentGroup = yearMap.get(currentYear)!;

    if (prevYear) {
      const prevGroup = yearMap.get(prevYear)!;
      currentGroup.yoyChange = currentGroup.totalSpending - prevGroup.totalSpending;
    } else {
      currentGroup.yoyChange = currentGroup.totalSpending;
    }
  }

  return Array.from(yearMap.values());
}

export default async function SpendingPage() {
  const displayCurrency = await getDisplayCurrency();
  const yearGroups = await getSpendingYearGroups(displayCurrency);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Spending</h1>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySelector currentCurrency={displayCurrency} />
            <Button asChild>
              <Link href="/spending/new">
                <Plus className="h-4 w-4 mr-1" />
                Add Spending
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {yearGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No spending recorded yet.</p>
              <p className="text-sm mt-2">
                <Link href="/spending/new" className="underline">Add your first spending entry</Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <SpendingGrid yearGroups={yearGroups} displayCurrency={displayCurrency} />
        )}
      </main>
    </div>
  );
}
