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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Upload,
  Radio,
  FileText,
  Settings,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import ContactDialog from "./ContactDialog";
import logo from "@/assets/logo.svg";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePendingCallsignRequests } from "@/api/useCallsignRequests";

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
    title: "My QSOs",
    url: "/my-qsos",
    icon: Radio,
  },
  {
    title: "Rules & Info",
    url: "/rules",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const adminItem = {
  title: "Admin",
  url: "/admin",
  icon: ShieldCheck,
};

const AppSidebar = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();
  const { isAdmin } = useIsAdmin();
  const visibleItems = isAdmin ? [...items, adminItem] : items;
  // Admins get a count of waiting callsign-change requests on the Admin menu
  // item (the site sends no email). Only fetched for admins - the endpoint is
  // admin-only - and re-checked every minute.
  const { data: pendingRequests } = usePendingCallsignRequests({
    enabled: isAdmin,
    refetchInterval: 60_000,
  });
  const pendingCount = isAdmin ? (pendingRequests?.length ?? 0) : 0;

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
        <div className="pl-7 pr-2 py-3 flex flex-col items-center gap-2 w-fit">
          <img src={logo} alt="Holyland Award Logo" className="h-20 w-auto" />
          <h2 className="text-xl font-bold text-primary">HolyLand Award</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pl-7">
          <SidebarGroupLabel className="text-sm font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className="transition-all duration-200"
                      onClick={closeMobileSidebar}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.url === "/admin" && pendingCount > 0 && (
                    <SidebarMenuBadge
                      className="bg-red-600 text-white"
                      aria-label={`${pendingCount} pending callsign requests`}
                    >
                      {pendingCount}
                    </SidebarMenuBadge>
                  )}
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
          HolyLand Award Management
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
