"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLocations } from "@/actions/locations";
import { createItem } from "@/actions/items";
import type { Location, ItemType } from "@/types/domain";

interface ScanResultProps {
  uuid: string;
}

export function ScanResult({ uuid }: ScanResultProps) {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState<ItemType>("object");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadLocations = async () => {
    setLoadingLocations(true);
    const result = await getLocations(null);
    if (result.success) {
      setLocations(result.data);
    }
    setLoadingLocations(false);
  };

  const handleStartCreate = () => {
    setShowForm(true);
    loadLocations();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocationId) {
      setError("Please select a location");
      return;
    }

    if (!itemName.trim()) {
      setError("Please enter a name");
      return;
    }

    setCreating(true);
    setError(null);

    const formData = new FormData();
    formData.set("id", uuid);
    formData.set("name", itemName.trim());
    formData.set("type", itemType);
    formData.set("parentLocationId", selectedLocationId);

    const result = await createItem(formData);

    setCreating(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Redirect to the new item
    router.push(`/items/${result.data.id}`);
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/scan">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Unknown QR Code</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            New Item Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This QR code doesn&apos;t match any existing item. Would you like to
            create a new item with this code?
          </p>

          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Scanned UUID</p>
            <p className="font-mono text-sm break-all">{uuid}</p>
          </div>

          {!showForm ? (
            <div className="flex gap-2">
              <Button onClick={handleStartCreate} className="flex-1">
                Create New Item
              </Button>
              <Link href="/scan">
                <Button variant="outline">Scan Again</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Toolbox, Camera"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={itemType}
                  onValueChange={(v) => setItemType(v as ItemType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="container">Container</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={setSelectedLocationId}
                  disabled={loadingLocations}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingLocations
                          ? "Loading locations..."
                          : "Select a location"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-mono text-xs">{loc.code}</span>
                          <span>{loc.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the root location. You can move the item later.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? "Creating..." : "Create Item"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
