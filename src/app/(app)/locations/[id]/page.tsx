import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLocationWithPath } from "@/lib/db/locations";
import { LocationDetailView } from "./location-detail-view";

interface LocationPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const location = await getLocationWithPath(id, session.user.id);

  if (!location) {
    notFound();
  }

  return <LocationDetailView location={location} />;
}
