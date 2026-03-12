import { useState } from "react";
import { Link } from "react-router";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Upload,
  FileText,
  Settings,
  LogOut,
  Mail,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import ContactDialog from "./ContactDialog";
import logo from "@/assets/logo.svg";

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
    title: "Award Info",
    url: "/rules",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const AppSidebar = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleContactClick = () => {
    setShowContactDialog(true);
    closeMobileSidebar();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-3 flex flex-col items-center gap-2">
          <img src={logo} alt="Holyland Award Logo" className="h-20 w-auto" />
          <h2 className="text-xl font-bold text-primary">HolyLand Award</h2>
        
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
                    <Link to={item.url} className="transition-all duration-200" onClick={closeMobileSidebar}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleContactClick} className="transition-all duration-200">
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
          Amateur Radio Award Management
          {import.meta.env.VITE_COMMIT_SHA && (
            <div className="text-xs mt-1 opacity-60">
              ver: {import.meta.env.VITE_COMMIT_SHA.slice(0, 7)}
            </div>
          )}
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
