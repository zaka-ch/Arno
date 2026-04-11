import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <div className="flex gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="min-h-[40vh] flex-1 rounded-xl" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
