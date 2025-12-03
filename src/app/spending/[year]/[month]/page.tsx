import Link from "next/link";
import { db, spending, spendingCategories } from "@/lib/db";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { deleteSpending } from "../../actions";

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

async function getMonthlySpending(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  return await db
    .select({
      id: spending.id,
      amount: spending.amount,
      currency: spending.currency,
      date: spending.date,
      notes: spending.notes,
      categoryName: spendingCategories.name,
      categoryColor: spendingCategories.color,
      categoryParentId: spendingCategories.parentId,
    })
    .from(spending)
    .innerJoin(spendingCategories, eq(spending.categoryId, spendingCategories.id))
    .where(
      and(
        gte(spending.date, startDate),
        lte(spending.date, endDate)
      )
    )
    .orderBy(desc(spending.date), desc(spending.id));
}

export default async function MonthlySpendingPage({ params }: PageProps) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const spendingList = await getMonthlySpending(year, month);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/spending">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Spending
              </Link>
            </Button>
            <h1 className="text-xl font-bold">
              {getMonthName(month)} {year}
            </h1>
          </div>
          <Button asChild>
            <Link href="/spending/new">
              <Plus className="h-4 w-4 mr-1" />
              Add Spending
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {spendingList.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No spending for {getMonthName(month)} {year}.</p>
              <p className="text-sm mt-2">
                <Link href="/spending/new" className="underline">Add a spending entry</Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spendingList.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.categoryColor || "#888" }}
                        />
                        {entry.categoryName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(entry.amount, entry.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {entry.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/spending/edit/${entry.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <form action={async () => {
                          "use server";
                          await deleteSpending(entry.id);
                        }}>
                          <Button variant="ghost" size="icon" type="submit">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
