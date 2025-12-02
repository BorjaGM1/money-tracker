import Link from "next/link";
import { db, monthlyBalances, accounts } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Plus, Pencil, ArrowLeft } from "lucide-react";
import { getDisplayCurrency, sumInCurrency, type Currency } from "@/lib/currency";
import { CurrencySelector } from "@/components/currency-selector";

async function getMonthlySnapshots(displayCurrency: Currency) {
  // Get distinct year/month combinations
  const periods = await db
    .selectDistinct({
      year: monthlyBalances.year,
      month: monthlyBalances.month,
    })
    .from(monthlyBalances)
    .orderBy(desc(monthlyBalances.year), desc(monthlyBalances.month));

  // For each period, calculate the total in display currency
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

  return snapshots;
}

export default async function BalancesPage() {
  const displayCurrency = await getDisplayCurrency();
  const snapshots = await getMonthlySnapshots(displayCurrency);
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

        {snapshots.length === 0 ? (
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
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Net Worth</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((snapshot, index) => {
                  const prevSnapshot = snapshots[index + 1];
                  const difference = prevSnapshot ? snapshot.total - prevSnapshot.total : null;

                  return (
                    <TableRow key={`${snapshot.year}-${snapshot.month}`}>
                      <TableCell className="font-medium">
                        {getMonthName(snapshot.month)} {snapshot.year}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">{formatCurrency(snapshot.total, displayCurrency)}</div>
                        {difference !== null && (
                          <div className={`text-sm ${difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {difference >= 0 ? "+" : ""}{formatCurrency(difference, displayCurrency)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/balances/${snapshot.year}/${snapshot.month}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
