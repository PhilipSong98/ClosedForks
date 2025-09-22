import { Skeleton } from "@/components/ui/skeleton";

export function RestaurantListSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
              <Skeleton className="h-40 w-full rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
