"use server";

import { db, monthlyBalances, accounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveMonthlyBalances(year: number, month: number, formData: FormData) {
  // Get all active accounts
  const activeAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.isActive, true));

  // Update or insert balance for each account
  for (const account of activeAccounts) {
    const amountStr = formData.get(`balance_${account.id}`) as string;
    const amount = parseFloat(amountStr) || 0;

    // Check if balance exists
    const [existing] = await db
      .select()
      .from(monthlyBalances)
      .where(
        and(
          eq(monthlyBalances.year, year),
          eq(monthlyBalances.month, month),
          eq(monthlyBalances.accountId, account.id)
        )
      );

    if (existing) {
      await db
        .update(monthlyBalances)
        .set({ amount })
        .where(eq(monthlyBalances.id, existing.id));
    } else {
      await db.insert(monthlyBalances).values({
        year,
        month,
        accountId: account.id,
        amount,
      });
    }
  }

  revalidatePath("/balances");
  revalidatePath("/");
  redirect("/balances");
}
