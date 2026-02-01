import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getItemById } from "@/lib/db/items";
import { ScanResult } from "./scan-result";

interface ScanResultPageProps {
  params: Promise<{ uuid: string }>;
}

export default async function ScanResultPage({ params }: ScanResultPageProps) {
  const { uuid } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if item exists
  const item = getItemById(uuid, session.user.id);

  if (item) {
    // Known item - redirect to detail view
    redirect(`/items/${item.id}`);
  }

  // Unknown UUID - show create option
  return <ScanResult uuid={uuid} />;
}
