import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getItemWithLocation } from "@/lib/db/items";
import { ItemDetailView } from "./item-detail-view";

interface ItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const item = await getItemWithLocation(id, session.user.id);

  if (!item) {
    notFound();
  }

  return <ItemDetailView item={item} />;
}
