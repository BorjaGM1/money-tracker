import Link from "next/link";
import { db, monthlyBalances, accounts } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMonthName } from "@/lib/utils";
import { Plus, ArrowLeft } from "lucide-react";
import { getDisplayCurrency, sumInCurrency, type Currency } from "@/lib/currency";
import { CurrencySelector } from "@/components/currency-selector";
import { BalancesTable, type YearGroup } from "@/components/balances-table";

async function getYearGroups(displayCurrency: Currency): Promise<YearGroup[]> {
  // Get distinct year/month combinations
  const periods = await db
    .selectDistinct({
      year: monthlyBalances.year,
      month: monthlyBalances.month,
    })
    .from(monthlyBalances)
    .orderBy(desc(monthlyBalances.year), desc(monthlyBalances.month));

  // Calculate totals for each period
  const snapshots = [];
  for (const period of periods) {
    const balances = await db
      .select({
        amount: monthlyBalances.amount,
        currency: accounts.currency,
      })
      .from(monthlyBalances)
      .innerJoin(accounts, eq(monthlyBalances.accountId, accounts.id))
      .where(
        and(
          eq(monthlyBalances.year, period.year),
          eq(monthlyBalances.month, period.month)
        )
      );

    const total = await sumInCurrency(
      balances.map((b) => ({ amount: b.amount, currency: b.currency || "EUR" })),
      displayCurrency
    );

    snapshots.push({
      year: period.year,
      month: period.month,
      total,
    });
  }

  // Group by year
  const yearMap = new Map<number, YearGroup>();

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const prevSnapshot = snapshots[i + 1];
    const difference = prevSnapshot ? snapshot.total - prevSnapshot.total : null;

    if (!yearMap.has(snapshot.year)) {
      yearMap.set(snapshot.year, {
        year: snapshot.year,
        latestTotal: snapshot.total, // First one we encounter is the latest (desc order)
        yoyChange: 0, // Will calculate after grouping
        months: [],
      });
    }

    yearMap.get(snapshot.year)!.months.push({
      year: snapshot.year,
      month: snapshot.month,
      total: snapshot.total,
      difference,
    });
  }

  // Calculate YoY change for each year
  // Compare latest month's net worth to exactly 12 months ago (same month, previous year)
  // If that month doesn't exist, assume 0
  const snapshotMap = new Map<string, number>(); // "YYYY-MM" -> total
  for (const s of snapshots) {
    snapshotMap.set(`${s.year}-${s.month}`, s.total);
  }

  for (const group of yearMap.values()) {
    // Find the latest month in this year
    const latestMonth = group.months[0]; // First is latest (desc order)
    const prevYearKey = `${latestMonth.year - 1}-${latestMonth.month}`;
    const prevYearTotal = snapshotMap.get(prevYearKey) ?? 0;
    group.yoyChange = group.latestTotal - prevYearTotal;
  }

  return Array.from(yearMap.values());
}

export default async function BalancesPage() {
  const displayCurrency = await getDisplayCurrency();
  const yearGroups = await getYearGroups(displayCurrency);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

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
            <h1 className="text-xl font-bold">Monthly Balances</h1>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySelector currentCurrency={displayCurrency} />
            <Button asChild>
              <Link href={`/balances/${currentYear}/${currentMonth}`}>
                <Plus className="h-4 w-4 mr-1" />
                Add Balance
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-4">
          Record account balances at day 1 of each month to track net worth over time.
        </p>

        {yearGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No balance snapshots recorded yet.</p>
              <p className="text-sm mt-2">
                <Link href={`/balances/${currentYear}/${currentMonth}`} className="underline">
                  Add balances for {getMonthName(currentMonth)} {currentYear}
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <BalancesTable yearGroups={yearGroups} displayCurrency={displayCurrency} />
        )}
      </main>
    </div>
  );
}
