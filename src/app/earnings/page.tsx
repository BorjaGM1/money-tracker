import Link from "next/link";
import { db, earnings, earningSources } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { deleteEarning } from "./actions";

async function getEarnings() {
  return await db
    .select({
      id: earnings.id,
      amount: earnings.amount,
      currency: earnings.currency,
      date: earnings.date,
      notes: earnings.notes,
      sourceName: earningSources.name,
      sourceColor: earningSources.color,
    })
    .from(earnings)
    .innerJoin(earningSources, eq(earnings.sourceId, earningSources.id))
    .orderBy(desc(earnings.date), desc(earnings.id));
}

export default async function EarningsPage() {
  const earningsList = await getEarnings();

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
            <h1 className="text-xl font-bold">Earnings</h1>
          </div>
          <Button asChild>
            <Link href="/earnings/new">
              <Plus className="h-4 w-4 mr-1" />
              Add Earning
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {earningsList.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No earnings recorded yet.</p>
              <p className="text-sm mt-2">
                <Link href="/earnings/new" className="underline">Add your first earning entry</Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earningsList.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>{new Date(earning.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: earning.sourceColor || "#gray" }}
                        />
                        {earning.sourceName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(earning.amount, earning.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {earning.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/earnings/${earning.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <form action={async () => {
                          "use server";
                          await deleteEarning(earning.id);
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
