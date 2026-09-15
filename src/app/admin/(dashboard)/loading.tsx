import { Skeleton, SkeletonTable } from "@/components/admin/Ui";

/**
 * Shown while a dashboard page's data is being read.
 *
 * The shape mirrors a list page — a heading, then rows — so the layout does
 * not jump when the real content arrives.
 *
 * Being here, at the route group, this is a Suspense boundary around every
 * page in the dashboard, and that has one consequence worth knowing before
 * anyone goes looking for it: the shell is flushed as soon as this renders,
 * so the HTTP status is already committed by the time a page calls
 * `notFound()`. A deleted record answers 200 with the not-found page rather
 * than 404. The two cannot both be had for one route — a skeleton means the
 * response has started — and for a private, `noindex` tool with one user the
 * skeleton on every navigation is worth more than a status code nothing
 * reads. Where the status is the answer, it is set explicitly and is correct:
 * see `api/media/[id]`, the upload route, and `admin/[...rest]`.
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
