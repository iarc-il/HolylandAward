import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useDraggableDialog } from "@/hooks/useDraggableDialog";
import { useUnworkedAreas } from "@/api/useUnworkedAreas";

interface RareSquaresDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Rare squares = squares that no registered user has worked yet: exactly the
// squares shown in red on the map.
const RareSquaresDialog = ({ isOpen, onClose }: RareSquaresDialogProps) => {
  const { data, isLoading, isError } = useUnworkedAreas();

  // Draggable by its title, so the map behind it can be seen.
  const headerProps = useDraggableDialog(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent
        className="border-4 border-blue-500 sm:max-w-lg"
        showOverlay={false}
        // No dark background and no click-outside close: the map stays usable.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader {...headerProps}>
          <DialogTitle>
            Rare squares
            {data && (
              <span className="ml-3 font-bold">
                <span className="text-red-600">{data.total_unworked}</span> of{" "}
                {data.total_squares}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Squares that no registered user has worked yet.
        </p>

        <div className="max-h-96 space-y-5 overflow-y-auto">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : isError || !data ? (
            <p className="py-8 text-center text-destructive">
              Could not load the rare squares.
            </p>
          ) : data.areas.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No rare squares - every square was worked.
            </p>
          ) : (
            <div>
              <h4 className="mb-2 text-sm font-semibold">
                Nobody has worked these yet ({data.areas.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.areas.map((square) => (
                  <span
                    key={square}
                    className="rounded-md border border-red-300 bg-red-100 px-2 py-1 font-mono text-sm text-red-800"
                  >
                    {square}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RareSquaresDialog;
