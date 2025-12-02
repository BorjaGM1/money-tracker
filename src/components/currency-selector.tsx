"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, type Currency } from "@/lib/currency-types";

interface CurrencySelectorProps {
  currentCurrency: Currency;
}

export function CurrencySelector({ currentCurrency }: CurrencySelectorProps) {
  const router = useRouter();

  const handleChange = async (value: string) => {
    // Call server action to update currency
    await fetch("/api/settings/currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: value }),
    });

    // Refresh the page to show updated values
    router.refresh();
  };

  return (
    <Select defaultValue={currentCurrency} onValueChange={handleChange}>
      <SelectTrigger className="w-[80px] h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
