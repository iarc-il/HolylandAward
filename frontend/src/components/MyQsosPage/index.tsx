import { useUserQsos } from "@/api/useUserQsos";
import { Button } from "@/components/ui/button";
import QsoTable from "@/components/QsoTable";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

const QSO_PAGE_SIZE = 50;

const getPageFromSearchParams = (searchParams: URLSearchParams) => {
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const MyQsosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = getPageFromSearchParams(searchParams);
  const { data, isLoading, isError, error } = useUserQsos(
    page,
    QSO_PAGE_SIZE,
  );
  const errorMessage =
    error instanceof Error ? error.message : "Could not load your QSOs.";
  const totalPages = data?.total_pages ?? 0;
  const pageQsoStart =
    data && data.total_qsos > 0 && data.qsos.length > 0
      ? (data.page - 1) * data.page_size + 1
      : 0;
  const pageQsoEnd = data
    ? Math.min(data.page * data.page_size, data.total_qsos)
    : 0;

  useEffect(() => {
    if (!data) return;

    const nextPage =
      data.total_pages > 0 && page > data.total_pages
        ? data.total_pages
        : data.total_pages === 0 && page > 1
          ? 1
          : null;

    if (!nextPage) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    if (nextPage === 1) {
      nextSearchParams.delete("page");
    } else {
      nextSearchParams.set("page", String(nextPage));
    }
    setSearchParams(nextSearchParams);
  }, [data, page, searchParams, setSearchParams]);

  const handlePageChange = (nextPage: number) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (nextPage === 1) {
      nextSearchParams.delete("page");
    } else {
      nextSearchParams.set("page", String(nextPage));
    }
    setSearchParams(nextSearchParams);
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            My QSOs
          </h1>
          <p className="text-muted-foreground text-base">
            View the QSO entries counted toward your HolyLand Award progress.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-md">
            Loading QSOs...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total QSOs
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {data?.total_qsos ?? 0}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    Counting callsigns
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                    {(data?.callsigns ?? []).map((callsign) => (
                      <span
                        key={callsign}
                        className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-semibold text-foreground"
                      >
                        {callsign}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <QsoTable
              title="My QSOs"
              qsos={data?.qsos ?? []}
              emptyMessage="No QSOs found. Upload an ADIF file to get started."
            />

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {pageQsoStart}-{pageQsoEnd} of {data?.total_qsos ?? 0} QSOs
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-foreground">
                    Page {data?.page ?? page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQsosPage;
