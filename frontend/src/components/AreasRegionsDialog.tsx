import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useDraggableDialog } from "@/hooks/useDraggableDialog";

interface AreasRegionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  isLoading: boolean;
}

// List of the user's own squares / regions. Same look as the Rare squares
// window: blue frame, draggable by the title, chips, map stays visible.
const AreasRegionsDialog = ({
  isOpen,
  onClose,
  title,
  items,
  isLoading,
}: AreasRegionsDialogProps) => {
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
            {title}
            {!isLoading && (
              <span className="ml-3 font-bold text-green-600">
                {items.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No {title.toLowerCase()} found
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-md border border-green-300 bg-green-100 px-2 py-1 font-mono text-sm text-green-800"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AreasRegionsDialog;
