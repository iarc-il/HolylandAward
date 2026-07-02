import { useUserQsos } from "@/api/useUserQsos";
import { useDeleteQsos } from "@/api/useDeleteQsos";
import QsoTable from "@/components/QsoTable";
import QsoStatsCard from "@/components/QsoStatsCard";
import PaginationControls from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
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
  const deleteQsos = useDeleteQsos();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    setSelectedIds(new Set());
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
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    deleteQsos.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
      },
    });
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

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteQsos.isPending}
                >
                  <Trash2 className="size-4" />
                  {deleteQsos.isPending
                    ? "Deleting..."
                    : `Delete ${selectedIds.size} selected`}
                </Button>
              </div>
            )}

            <QsoTable
              title="My QSOs"
              qsos={data?.qsos ?? []}
              emptyMessage="No QSOs found. Upload an ADIF file to get started."
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
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

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete QSOs</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedIds.size} selected QSO
                {selectedIds.size === 1 ? "" : "s"}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteQsos.isPending}
              >
                {deleteQsos.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyQsosPage;
