import { db, accounts } from "@/lib/db";
import { asc } from "drizzle-orm";
import { AccountsList } from "./accounts-list";

export default async function AccountsPage() {
  const accts = await db
    .select()
    .from(accounts)
    .orderBy(asc(accounts.displayOrder), asc(accounts.name));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Manage your bank accounts, investments, crypto wallets, and cash
          </p>
        </div>
      </div>

      <AccountsList accounts={accts} />
    </div>
  );
}
