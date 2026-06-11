import { useUserQsos } from "@/api/useUserQsos";
import QsoTable from "@/components/QsoTable";
import QsoStatsCard from "@/components/QsoStatsCard";
import PaginationControls from "@/components/PaginationControls";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500];

const getPageFromSearchParams = (searchParams: URLSearchParams) => {
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const getPageSizeFromSearchParams = (searchParams: URLSearchParams) => {
  const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "50", 10);
  return PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : 50;
};

const MyQsosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = getPageFromSearchParams(searchParams);
  const pageSize = getPageSizeFromSearchParams(searchParams);
  const { data, isLoading, isError, error } = useUserQsos(page, pageSize);
  const errorMessage =
    error instanceof Error ? error.message : "Could not load your QSOs.";
  const totalPages = data?.total_pages ?? 0;

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

  const handlePageSizeChange = (newPageSize: number) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("page");
    if (newPageSize !== 50) {
      nextSearchParams.set("pageSize", String(newPageSize));
    } else {
      nextSearchParams.delete("pageSize");
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
            <QsoStatsCard
              totalQsos={data?.total_qsos ?? 0}
              callsigns={data?.callsigns ?? []}
            />

            <QsoTable
              title="My QSOs"
              qsos={data?.qsos ?? []}
              emptyMessage="No QSOs found. Upload an ADIF file to get started."
            />

            {data && data.total_qsos > 0 && (
              <PaginationControls
                page={data.page}
                totalPages={totalPages}
                totalItems={data.total_qsos}
                pageSize={data.page_size}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQsosPage;
