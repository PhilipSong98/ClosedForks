import { Suspense } from "react";
import RestaurantsClient from "./restaurants-client";
import { RestaurantFeedSkeleton } from "@/components/ui/skeleton-loader";

export const dynamic = "force-dynamic";

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<RestaurantFeedSkeleton count={6} />}>
      <RestaurantsClient />
    </Suspense>
  );
}
