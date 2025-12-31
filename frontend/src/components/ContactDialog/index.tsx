import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, MessageCircle } from "lucide-react";

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactDialog = ({ isOpen, onClose }: ContactDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Have questions or need assistance with the HolyLand Award system?
            We're here to help!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-medium text-sm">Email</h4>
                <a
                  href="mailto:holyland@iarc.org"
                  className="text-sm text-primary hover:underline"
                >
                  phazeman@gmail.com
                </a>
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

export default ContactDialog;
