"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityCard, ActivityFormDialog } from "@/components/activities";
import { getActivities } from "@/actions/activities";
import type { Activity } from "@/types/domain";

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const loadActivities = useCallback(async () => {
    setLoading(true);
    const result = await getActivities();
    if (result.success) {
      setActivities(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleAdd = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    setDialogOpen(false);
    loadActivities();
  }, [loadActivities]);

  const handleActivityClick = useCallback(
    (activity: Activity) => {
      router.push(`/activities/${activity.id}`);
    },
    [router]
  );

  const filteredActivities = activities.filter((a) =>
    activeTab === "active" ? a.status === "active" : a.status === "archived"
  );

  const activeCount = activities.filter((a) => a.status === "active").length;
  const archivedCount = activities.filter((a) => a.status === "archived").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>
          <p className="text-muted-foreground">
            Track hobbies and crafts, group related items together
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ActivityIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No activities yet</p>
            <p className="text-muted-foreground">
              Create activities like Pottery, Sewing, or Woodworking to track related items
            </p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "active" | "archived")}
        >
          <TabsList>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archivedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    {activeTab === "active"
                      ? "No active activities. Create one to get started."
                      : "No archived activities."}
                  </p>
                  {activeTab === "active" && (
                    <Button className="mt-4" variant="outline" onClick={handleAdd}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Activity
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onClick={() => handleActivityClick(activity)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <ActivityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
