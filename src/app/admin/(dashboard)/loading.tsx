import { Skeleton, SkeletonTable } from "@/components/admin/Ui";

/**
 * Shown while a dashboard page's data is being read.
 *
 * The shape mirrors a list page — a heading, then rows — so the layout does
 * not jump when the real content arrives.
 */
export default function DashboardLoading() {
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mt-7">
        <SkeletonTable />
      </div>
    </>
  );
}
