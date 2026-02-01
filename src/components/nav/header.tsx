import Link from "next/link";
import { auth } from "@/lib/auth";
import { MainNav } from "./main-nav";
import { UserMenu } from "./user-menu";
import { ScanButton } from "./scan-button";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">SiFi</span>
          </Link>
          <div className="hidden sm:block">
            <MainNav />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScanButton />
          {session?.user && <UserMenu user={session.user} />}
        </div>
      </div>
    </header>
  );
}
