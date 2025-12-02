"use server";

import { db, earnings, earningSources } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEarning(formData: FormData) {
  const sourceId = parseInt(formData.get("sourceId") as string);
  const amount = parseFloat(formData.get("amount") as string);
  const currency = formData.get("currency") as string;
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string || null;

  await db.insert(earnings).values({
    sourceId,
    amount,
    currency,
    date,
    notes,
  });

  revalidatePath("/earnings");
  revalidatePath("/");
  redirect("/earnings");
}

export async function updateEarning(id: number, formData: FormData) {
  const sourceId = parseInt(formData.get("sourceId") as string);
  const amount = parseFloat(formData.get("amount") as string);
  const currency = formData.get("currency") as string;
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string || null;

  await db.update(earnings).set({
    sourceId,
    amount,
    currency,
    date,
    notes,
  }).where(eq(earnings.id, id));

  revalidatePath("/earnings");
  revalidatePath("/");
  redirect("/earnings");
}

export async function deleteEarning(id: number) {
  await db.delete(earnings).where(eq(earnings.id, id));

  revalidatePath("/earnings");
  revalidatePath("/");
  redirect("/earnings");
}
