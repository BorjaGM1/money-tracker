import { NextResponse } from "next/server";
import { setDisplayCurrency } from "@/lib/currency";
import { CURRENCIES, type Currency } from "@/lib/currency-types";

export async function POST(request: Request) {
  try {
    const { currency } = await request.json();

    if (!currency || !CURRENCIES.includes(currency)) {
      return NextResponse.json(
        { error: "Invalid currency" },
        { status: 400 }
      );
    }

    await setDisplayCurrency(currency as Currency);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting currency:", error);
    return NextResponse.json(
      { error: "Failed to update currency" },
      { status: 500 }
    );
  }
}
