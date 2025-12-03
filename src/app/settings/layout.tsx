import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, TrendingUp, Tags } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <nav className="w-full md:w-48 space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/settings/sources">
                <TrendingUp className="h-4 w-4 mr-2" />
                Earning Sources
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/settings/accounts">
                <Wallet className="h-4 w-4 mr-2" />
                Accounts
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/settings/categories">
                <Tags className="h-4 w-4 mr-2" />
                Spending Categories
              </Link>
            </Button>
          </nav>

          {/* Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
