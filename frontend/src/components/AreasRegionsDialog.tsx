import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface AreasRegionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  isLoading: boolean;
}

const AreasRegionsDialog = ({
  isOpen,
  onClose,
  title,
  items,
  isLoading,
}: AreasRegionsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                No {title.toLowerCase()} found
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-muted rounded-md text-base font-mono"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-base text-muted-foreground text-center">
          Total: {items.length}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AreasRegionsDialog;
