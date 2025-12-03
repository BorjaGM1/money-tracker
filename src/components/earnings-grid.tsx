"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";
import { type Currency } from "@/lib/currency-types";

export type EarningsMonthData = {
  year: number;
  month: number;
  total: number;
  entryCount: number;
  momChange: number | null;
  sources: Array<{ color: string }>;
};

export type EarningsYearGroup = {
  year: number;
  totalEarnings: number;
  yoyChange: number;
  months: EarningsMonthData[];
};

interface EarningsGridProps {
  yearGroups: EarningsYearGroup[];
  displayCurrency: Currency;
}

export function EarningsGrid({ yearGroups, displayCurrency }: EarningsGridProps) {
  // Default: expand first (most recent) year
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    new Set(yearGroups.length > 0 ? [yearGroups[0].year] : [])
  );

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {yearGroups.map((group) => {
        const isExpanded = expandedYears.has(group.year);

        return (
          <Card key={group.year}>
            {/* Year Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleYear(group.year)}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <span className="text-lg font-semibold">{group.year}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(group.totalEarnings, displayCurrency)}
                </div>
                <div className={`text-sm ${group.yoyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {group.yoyChange >= 0 ? "+" : ""}
                  {formatCurrency(group.yoyChange, displayCurrency)} YoY
                </div>
              </div>
            </div>

            {/* Month Cards Grid */}
            {isExpanded && (
              <CardContent className="pt-0 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {group.months.map((month) => (
                    <Link
                      key={`${month.year}-${month.month}`}
                      href={`/earnings/${month.year}/${month.month}`}
                      className="block"
                    >
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className="font-medium text-sm text-muted-foreground mb-1">
                            {getMonthName(month.month)}
                          </div>
                          <div className="text-xl font-bold mb-1">
                            {formatCurrency(month.total, displayCurrency)}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {month.entryCount} {month.entryCount === 1 ? "entry" : "entries"}
                            </span>
                            {month.momChange !== null && (
                              <span className={month.momChange >= 0 ? "text-green-600" : "text-red-600"}>
                                {month.momChange >= 0 ? "+" : ""}
                                {formatCurrency(month.momChange, displayCurrency)}
                              </span>
                            )}
                          </div>
                          {/* Source dots */}
                          {month.sources.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {month.sources.map((source, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: source.color || "#888" }}
                                />
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
