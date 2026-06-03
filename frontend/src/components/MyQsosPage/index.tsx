import { useUserQsos } from "@/api/useUserQsos";
import QsoTable from "@/components/QsoTable";

const MyQsosPage = () => {
  const { data, isLoading, isError, error } = useUserQsos();
  const errorMessage =
    error instanceof Error ? error.message : "Could not load your QSOs.";

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
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQsosPage;
