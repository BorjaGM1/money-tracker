"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { ChevronRight, ChevronDown, Pencil } from "lucide-react";
import { type Currency } from "@/lib/currency-types";

export type YearGroup = {
  year: number;
  latestTotal: number;
  yoyChange: number;
  months: Array<{
    year: number;
    month: number;
    total: number;
    difference: number | null;
  }>;
};

interface BalancesTableProps {
  yearGroups: YearGroup[];
  displayCurrency: Currency;
}

export function BalancesTable({ yearGroups, displayCurrency }: BalancesTableProps) {
  // Default: expand current year only
  const currentYear = new Date().getFullYear();
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
          {yearGroups.map((group) => {
            const isExpanded = expandedYears.has(group.year);

            return (
              <Fragment key={group.year}>
                {/* Year Row */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50 bg-muted/30"
                  onClick={() => toggleYear(group.year)}
                >
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {group.year}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(group.latestTotal, displayCurrency)}
                    </div>
                    <div className={`text-sm ${group.yoyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {group.yoyChange >= 0 ? "+" : ""}
                      {formatCurrency(group.yoyChange, displayCurrency)} YoY
                    </div>
                  </TableCell>
                  <TableCell>{/* No actions for year row */}</TableCell>
                </TableRow>

                {/* Month Rows (when expanded) */}
                {isExpanded &&
                  group.months.map((snapshot) => (
                    <TableRow key={`${snapshot.year}-${snapshot.month}`}>
                      <TableCell className="font-medium pl-10">
                        {getMonthName(snapshot.month)} {snapshot.year}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(snapshot.total, displayCurrency)}
                        </div>
                        {snapshot.difference !== null && (
                          <div
                            className={`text-sm ${
                              snapshot.difference >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {snapshot.difference >= 0 ? "+" : ""}
                            {formatCurrency(snapshot.difference, displayCurrency)}
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
                  ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
