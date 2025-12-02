import Link from "next/link";
import { db, accounts, monthlyBalances } from "@/lib/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { getMonthName } from "@/lib/utils";
import { saveMonthlyBalances } from "../../actions";

interface PageProps {
  params: Promise<{ year: string; month: string }>;
}

export default async function MonthlyBalancePage({ params }: PageProps) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  // Get all active accounts
  const activeAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.isActive, true))
    .orderBy(asc(accounts.displayOrder));

  // Get existing balances for this month
  const existingBalances = await db
    .select()
    .from(monthlyBalances)
    .where(
      and(
        eq(monthlyBalances.year, year),
        eq(monthlyBalances.month, month)
      )
    );

  // Get previous month's balances for pre-fill
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevBalances = await db
    .select()
    .from(monthlyBalances)
    .where(
      and(
        eq(monthlyBalances.year, prevYear),
        eq(monthlyBalances.month, prevMonth)
      )
    );

  // Create a map of account balances
  const balanceMap = new Map(existingBalances.map(b => [b.accountId, b.amount]));
  const prevBalanceMap = new Map(prevBalances.map(b => [b.accountId, b.amount]));

  const handleSave = async (formData: FormData) => {
    "use server";
    await saveMonthlyBalances(year, month, formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/balances">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">
            Balances - {getMonthName(month)} {year}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Account Balances</CardTitle>
            <CardDescription>
              Enter balances as of day 1 of {getMonthName(month)} {year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSave} className="space-y-4">
              {activeAccounts.map((account) => {
                const existingAmount = balanceMap.get(account.id);
                const prevAmount = prevBalanceMap.get(account.id);
                const defaultValue = existingAmount ?? prevAmount ?? "";

                return (
                  <div key={account.id} className="space-y-2">
                    <Label htmlFor={`balance_${account.id}`} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color || "#gray" }}
                      />
                      {account.name}
                      <span className="text-muted-foreground text-xs">({account.currency})</span>
                    </Label>
                    <Input
                      id={`balance_${account.id}`}
                      name={`balance_${account.id}`}
                      type="number"
                      step="0.01"
                      defaultValue={defaultValue}
                      placeholder="0.00"
                    />
                    {prevAmount !== undefined && existingAmount === undefined && (
                      <p className="text-xs text-muted-foreground">
                        Previous: {prevAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="pt-4">
                <Button type="submit" className="w-full">
                  Save Balances
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
