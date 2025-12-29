import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RulesAndGuidlinesProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesAndGuidlines: React.FC<RulesAndGuidlinesProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>HolyLand Award Rules and Guidelines</DialogTitle>
          <DialogDescription>
            Please read the following rules and guidelines carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold mb-4">Holy Land Award</h3>

            <h4 className="font-semibold mt-4 mb-2">
              Conditions for receiving the certificate:
            </h4>

            <p className="mb-3">
              The Holy Land Award is granted for establishing contacts with
              stations located in different areas within the State of Israel
              without any restrictions on the type of transmission or frequency
              bands.
            </p>

            <p className="mb-3">
              Contacts via relays are not considered for the purpose of
              receiving the certificate.
            </p>

            <p className="mb-4">There is no need to send QSL cards.</p>

            <h4 className="font-semibold mt-4 mb-3">
              There are three categories for receiving the certificate:
            </h4>

            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold">
                  Category A – Local stations located and operating in the Holy
                  Land.
                </h5>
                <p className="text-sm mt-1">
                  These stations must establish contact with at least{" "}
                  <strong>150 areas</strong> in at least{" "}
                  <strong>18 different districts</strong>.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold">
                  Category B – Stations located in IARU REGION 1.
                </h5>
                <p className="text-sm mt-1">
                  These stations must establish contact with at least{" "}
                  <strong>100 areas</strong> in at least{" "}
                  <strong>13 different districts</strong>.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold">
                  Category C – Stations located in IARU REGION 2 or REGION 3.
                </h5>
                <p className="text-sm mt-1">
                  These stations must establish contact with{" "}
                  <strong>50 different areas</strong> in at least{" "}
                  <strong>13 different districts</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RulesAndGuidlines;
