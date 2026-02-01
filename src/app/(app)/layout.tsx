import { Header, MobileNav } from "@/components/nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="container px-4 py-6 pb-20 sm:pb-6">{children}</main>
      <MobileNav />
    </div>
  );
}
