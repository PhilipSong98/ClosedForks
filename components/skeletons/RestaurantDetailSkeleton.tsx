import { Skeleton } from "@/components/ui/skeleton";

export function RestaurantDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-[300px] w-full md:h-[400px]" />

      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-3/4" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
