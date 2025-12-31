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
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold">HolyLand Award</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowContactDialog(true)}>
                  <Mail />
                  <span>Contact Us</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-sm text-muted-foreground">
          Amateur Radio Contest Management
        </div>
        <div className="px-4 py-2">
          <SignOutButton>
            <SidebarMenuButton>
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
