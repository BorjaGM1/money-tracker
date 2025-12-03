import Link from "next/link";
import { db, earnings, earningSources, monthlyBalances, accounts, spending, spendingCategories } from "@/lib/db";
import { desc, eq, sql, and, gte, lte } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDifference, getMonthName } from "@/lib/utils";
import { DollarSign, Wallet, TrendingUp, TrendingDown, Settings, LogOut, MinusCircle } from "lucide-react";
import { getDisplayCurrency, sumInCurrency, type Currency } from "@/lib/currency";
import { CurrencySelector } from "@/components/currency-selector";

async function getStats(displayCurrency: Currency) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Get latest month with balance data
  const [latestBalanceMeta] = await db
    .select({
      year: monthlyBalances.year,
      month: monthlyBalances.month,
    })
    .from(monthlyBalances)
    .orderBy(desc(monthlyBalances.year), desc(monthlyBalances.month))
    .limit(1);

  // Get all balances for the latest month with account currencies
  let currentNetWorth = 0;
  let monthlyChange = 0;

  if (latestBalanceMeta) {
    const latestBalances = await db
      .select({
        amount: monthlyBalances.amount,
        currency: accounts.currency,
      })
      .from(monthlyBalances)
      .innerJoin(accounts, eq(monthlyBalances.accountId, accounts.id))
      .where(
        and(
          eq(monthlyBalances.year, latestBalanceMeta.year),
          eq(monthlyBalances.month, latestBalanceMeta.month)
        )
      );

    // Convert all balances to display currency
    currentNetWorth = await sumInCurrency(
      latestBalances.map((b) => ({ amount: b.amount, currency: b.currency || "EUR" })),
      displayCurrency
    );

    // Get previous month's balance for comparison
    const prevMonth = latestBalanceMeta.month === 1 ? 12 : latestBalanceMeta.month - 1;
    const prevYear = latestBalanceMeta.month === 1 ? latestBalanceMeta.year - 1 : latestBalanceMeta.year;

    const prevBalances = await db
      .select({
        amount: monthlyBalances.amount,
        currency: accounts.currency,
      })
      .from(monthlyBalances)
      .innerJoin(accounts, eq(monthlyBalances.accountId, accounts.id))
      .where(
        and(
          eq(monthlyBalances.year, prevYear),
          eq(monthlyBalances.month, prevMonth)
        )
      );

    if (prevBalances.length > 0) {
      const prevNetWorth = await sumInCurrency(
        prevBalances.map((b) => ({ amount: b.amount, currency: b.currency || "EUR" })),
        displayCurrency
      );
      monthlyChange = currentNetWorth - prevNetWorth;
    }
  }

  // Get this month's earnings with currencies
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`;

  const monthEarningsList = await db
    .select({
      amount: earnings.amount,
      currency: earnings.currency,
    })
    .from(earnings)
    .where(
      and(
        gte(earnings.date, startOfMonth),
        lte(earnings.date, endOfMonth)
      )
    );

  const thisMonthEarnings = await sumInCurrency(
    monthEarningsList.map((e) => ({ amount: e.amount, currency: e.currency })),
    displayCurrency
  );

  // Get YTD earnings with currencies
  const startOfYear = `${currentYear}-01-01`;
  const ytdEarningsList = await db
    .select({
      amount: earnings.amount,
      currency: earnings.currency,
    })
    .from(earnings)
    .where(gte(earnings.date, startOfYear));

  const ytdEarnings = await sumInCurrency(
    ytdEarningsList.map((e) => ({ amount: e.amount, currency: e.currency })),
    displayCurrency
  );

  // Get recent earnings
  const recentEarnings = await db
    .select({
      id: earnings.id,
      amount: earnings.amount,
      currency: earnings.currency,
      date: earnings.date,
      sourceName: earningSources.name,
      sourceColor: earningSources.color,
    })
    .from(earnings)
    .innerJoin(earningSources, eq(earnings.sourceId, earningSources.id))
    .orderBy(desc(earnings.date), desc(earnings.id))
    .limit(5);

  // Get this month's spending with currencies
  const monthSpendingList = await db
    .select({
      amount: spending.amount,
      currency: spending.currency,
    })
    .from(spending)
    .where(
      and(
        gte(spending.date, startOfMonth),
        lte(spending.date, endOfMonth)
      )
    );

  const thisMonthSpending = await sumInCurrency(
    monthSpendingList.map((s) => ({ amount: s.amount, currency: s.currency })),
    displayCurrency
  );

  // Get YTD spending with currencies
  const ytdSpendingList = await db
    .select({
      amount: spending.amount,
      currency: spending.currency,
    })
    .from(spending)
    .where(gte(spending.date, startOfYear));

  const ytdSpending = await sumInCurrency(
    ytdSpendingList.map((s) => ({ amount: s.amount, currency: s.currency })),
    displayCurrency
  );

  // Calculate net income
  const thisMonthNetIncome = thisMonthEarnings - thisMonthSpending;

  // Get recent spending
  const recentSpending = await db
    .select({
      id: spending.id,
      amount: spending.amount,
      currency: spending.currency,
      date: spending.date,
      categoryName: spendingCategories.name,
      categoryColor: spendingCategories.color,
    })
    .from(spending)
    .innerJoin(spendingCategories, eq(spending.categoryId, spendingCategories.id))
    .orderBy(desc(spending.date), desc(spending.id))
    .limit(5);

  return {
    currentNetWorth,
    latestBalanceMonth: latestBalanceMeta ? { year: latestBalanceMeta.year, month: latestBalanceMeta.month } : null,
    monthlyChange,
    thisMonthEarnings,
    thisMonthSpending,
    thisMonthNetIncome,
    ytdEarnings,
    ytdSpending,
    recentEarnings,
    recentSpending,
  };
}

export default async function DashboardPage() {
  const displayCurrency = await getDisplayCurrency();
  const stats = await getStats(displayCurrency);
  const now = new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Money Tracker</h1>
          <div className="flex items-center gap-3">
            <CurrencySelector currentCurrency={displayCurrency} />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Link>
            </Button>
            <form action="/api/auth" method="DELETE">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <Link
              href="/"
              className="py-3 px-1 border-b-2 border-primary font-medium text-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/earnings"
              className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground text-sm"
            >
              Earnings
            </Link>
            <Link
              href="/spending"
              className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground text-sm"
            >
              Spending
            </Link>
            <Link
              href="/balances"
              className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground text-sm"
            >
              Balances
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards - Row 1: Net Worth & Monthly Change */}
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.currentNetWorth, displayCurrency)}</div>
              {stats.latestBalanceMonth && (
                <p className="text-xs text-muted-foreground">
                  As of {getMonthName(stats.latestBalanceMonth.month)} {stats.latestBalanceMonth.year}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.monthlyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatDifference(stats.monthlyChange, displayCurrency)}
              </div>
              <p className="text-xs text-muted-foreground">From last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards - Row 2: This Month Earnings, Spending, Net Income */}
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.thisMonthEarnings, displayCurrency)}</div>
              <p className="text-xs text-muted-foreground">
                Income in {getMonthName(now.getMonth() + 1)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month Spending</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.thisMonthSpending, displayCurrency)}</div>
              <p className="text-xs text-muted-foreground">
                Expenses in {getMonthName(now.getMonth() + 1)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.thisMonthNetIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatDifference(stats.thisMonthNetIncome, displayCurrency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Earnings - Spending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards - Row 3: YTD Earnings & Spending */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">YTD Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.ytdEarnings, displayCurrency)}</div>
              <p className="text-xs text-muted-foreground">Total income in {now.getFullYear()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">YTD Spending</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.ytdSpending, displayCurrency)}</div>
              <p className="text-xs text-muted-foreground">Total expenses in {now.getFullYear()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/earnings/new">Add Earning</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/spending/new">Add Spending</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/balances/${now.getFullYear()}/${now.getMonth() + 1}`}>
                Update Balances
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentEarnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No earnings recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentEarnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: earning.sourceColor || "#888" }}
                        />
                        <span>{earning.sourceName}</span>
                        <span className="text-muted-foreground">
                          {new Date(earning.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(earning.amount, earning.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Spending</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentSpending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No spending recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentSpending.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: entry.categoryColor || "#888" }}
                        />
                        <span>{entry.categoryName}</span>
                        <span className="text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(entry.amount, entry.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
