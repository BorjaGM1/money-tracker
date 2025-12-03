"use server";

import { db, spending, spendingCategories } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSpending(formData: FormData) {
  const categoryId = parseInt(formData.get("categoryId") as string);
  const amount = parseFloat(formData.get("amount") as string);
  const currency = formData.get("currency") as string;
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string || null;

  await db.insert(spending).values({
    categoryId,
    amount,
    currency,
    date,
    notes,
  });

  revalidatePath("/spending");
  revalidatePath("/");
  redirect("/spending");
}

export async function updateSpending(id: number, formData: FormData) {
  const categoryId = parseInt(formData.get("categoryId") as string);
  const amount = parseFloat(formData.get("amount") as string);
  const currency = formData.get("currency") as string;
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string || null;

  await db.update(spending).set({
    categoryId,
    amount,
    currency,
    date,
    notes,
  }).where(eq(spending.id, id));

  revalidatePath("/spending");
  revalidatePath("/");
  redirect("/spending");
}

export async function deleteSpending(id: number) {
  await db.delete(spending).where(eq(spending.id, id));

  revalidatePath("/spending");
  revalidatePath("/");
  redirect("/spending");
}
