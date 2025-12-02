import { db, earningSources, accounts } from "./index";

// Initial earning sources from Excel
const initialSources = [
  { name: "Job", slug: "job", color: "#3b82f6", icon: "briefcase", displayOrder: 0 },
  { name: "TubeChef", slug: "tc", color: "#f97316", icon: "youtube", displayOrder: 1 },
  { name: "Elevate", slug: "elevate", color: "#8b5cf6", icon: "trending-up", displayOrder: 2 },
  { name: "Elevate Affiliates YT", slug: "elevate-affiliates-yt", color: "#ec4899", icon: "users", displayOrder: 3 },
];

// Initial accounts from Excel
const initialAccounts = [
  { name: "OpenBank", slug: "openbank", type: "bank", currency: "EUR", color: "#10b981", icon: "landmark", displayOrder: 0 },
  { name: "Cajamar", slug: "cajamar", type: "bank", currency: "EUR", color: "#06b6d4", icon: "landmark", displayOrder: 1 },
  { name: "Mercury", slug: "mercury", type: "bank", currency: "USD", color: "#6366f1", icon: "landmark", displayOrder: 2 },
  { name: "Cash", slug: "cash", type: "cash", currency: "EUR", color: "#84cc16", icon: "wallet", displayOrder: 3 },
];

async function seed() {
  console.log("Seeding database...");

  // Insert earning sources
  for (const source of initialSources) {
    try {
      await db.insert(earningSources).values(source).onConflictDoNothing();
      console.log(`  Added earning source: ${source.name}`);
    } catch (error) {
      console.log(`  Skipping ${source.name} (already exists)`);
    }
  }

  // Insert accounts
  for (const account of initialAccounts) {
    try {
      await db.insert(accounts).values(account).onConflictDoNothing();
      console.log(`  Added account: ${account.name}`);
    } catch (error) {
      console.log(`  Skipping ${account.name} (already exists)`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
