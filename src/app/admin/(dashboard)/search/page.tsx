import type { Metadata } from "next";
import Link from "next/link";

import { excerpt, formatDateShort } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { IconSearch } from "@/components/admin/Icons";
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  TableWrap,
} from "@/components/admin/Ui";
import { listAppointments } from "@/lib/db/repos/appointments";
import { listMessages } from "@/lib/db/repos/messages";
import { listPatients } from "@/lib/db/repos/patients";
import { listServices } from "@/lib/db/repos/services";
import { listTreatments } from "@/lib/db/repos/treatments";
import { databaseReady } from "@/lib/db/status";
import { text } from "@/lib/db/types";

export const metadata: Metadata = { title: "Kërko" };

/**
 * What the search box in the top bar goes to.
 *
 * One query per section rather than a single union: the sections have
 * genuinely different columns and the totals are small, so five small indexed
 * queries are both faster to write and easier to read than a UNION with
 * padded columns.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  const term = (params.q ?? "").trim();

  if (!(await databaseReady()) || term === "") {
    return (
      <>
        <PageHeader title={dict.common.search} />
        <Card className="mt-6">
          <EmptyState
            title={dict.common.searchPlaceholder}
            icon={<IconSearch />}
          />
        </Card>
      </>
    );
  }

  const [appointments, patients, services, treatments, messages] = await Promise.all([
    listAppointments({ search: term, order: "date_desc" }),
    listPatients({ search: term, includeArchived: true }),
    listServices({ search: term }),
    listTreatments({ search: term }),
    listMessages({ search: term }),
  ]);

  const total =
    appointments.total + patients.total + services.total + treatments.total + messages.total;

  return (
    <>
      <PageHeader
        title={dict.common.search}
        description={`“${term}” · ${total} ${dict.common.results}`}
      />

      {total === 0 ? (
        <Card className="mt-6">
          <EmptyState title={dict.common.noResults} icon={<IconSearch />} />
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {appointments.total > 0 && (
            <Card>
              <CardHeader
                title={dict.appointments.title}
                hint={`${appointments.total} ${dict.common.results}`}
              />
              <TableWrap>
                <tbody>
                  {appointments.rows.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td className="tnum w-28 whitespace-nowrap">
                        {formatDateShort(row.scheduled_date, locale)}
                      </td>
                      <td>
                        <Link
                          href={`/appointments/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.patient_name}
                        </Link>
                      </td>
                      <td className="text-right text-[0.8125rem] text-ink-500 dark:text-bone-300">
                        {row.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          )}

          {patients.total > 0 && (
            <Card>
              <CardHeader
                title={dict.patients.title}
                hint={`${patients.total} ${dict.common.results}`}
              />
              <TableWrap>
                <tbody>
                  {patients.rows.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          href={`/patients/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.full_name}
                        </Link>
                      </td>
                      <td className="text-right text-[0.8125rem] text-ink-500 dark:text-bone-300">
                        {row.phone ?? row.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          )}

          {services.total > 0 && (
            <Card>
              <CardHeader
                title={dict.services.title}
                hint={`${services.total} ${dict.common.results}`}
              />
              <TableWrap>
                <tbody>
                  {services.rows.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          href={`/services/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {text(row.title, locale) || row.slug}
                        </Link>
                      </td>
                      <td className="text-right text-[0.8125rem] text-ink-500 dark:text-bone-300">
                        {row.slug}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          )}

          {treatments.total > 0 && (
            <Card>
              <CardHeader
                title={dict.treatments.title}
                hint={`${treatments.total} ${dict.common.results}`}
              />
              <TableWrap>
                <tbody>
                  {treatments.rows.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          href={`/treatments/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {text(row.title, locale) || row.slug}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          )}

          {messages.total > 0 && (
            <Card>
              <CardHeader
                title={dict.messages.title}
                hint={`${messages.total} ${dict.common.results}`}
              />
              <TableWrap>
                <tbody>
                  {messages.rows.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          href={`/messages/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="text-[0.8125rem] text-ink-500 dark:text-bone-300">
                        {excerpt(row.body, 60)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
