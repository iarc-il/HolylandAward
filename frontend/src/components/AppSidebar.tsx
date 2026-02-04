import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import {
  Home,
  Upload,
  Map,
  FileText,
  Settings,
  Trophy,
  LogOut,
  Mail,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import ContactDialog from "./ContactDialog";

// Menu items for the sidebar
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Upload ADIF",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const AppSidebar = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-3">
          <h2 className="text-xl font-bold text-primary">HolyLand Award</h2>
          <p className="text-xs text-muted-foreground mt-1">Amateur Radio Contest</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="transition-all duration-200">
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowContactDialog(true)} className="transition-all duration-200">
                  <Mail />
                  <span>Contact Us</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-sm text-muted-foreground border-t border-sidebar-border pt-3">
          Amateur Radio Contest Management
        </div>
        <div className="px-4 py-2">
          <SignOutButton>
            <SidebarMenuButton className="w-full transition-all duration-200">
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SignOutButton>
        </div>
      </SidebarFooter>

      <ContactDialog
        isOpen={showContactDialog}
        onClose={() => setShowContactDialog(false)}
      />
    </Sidebar>
  );
};

export default AppSidebar;
