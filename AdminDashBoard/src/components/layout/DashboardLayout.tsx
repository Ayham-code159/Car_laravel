import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  Tags,
  Ticket,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/AuthProvider";
import { BrandMark } from "./Brand";
const main = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/cars", label: "Cars", icon: CarFront },
  { to: "/bookings", label: "Bookings", icon: Ticket },
  { to: "/availability", label: "Availability", icon: CalendarDays },
];
const management = [
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/locations", label: "Locations", icon: MapPin },
];
export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("aurel.sidebar") === "collapsed",
  );
  const [mobile, setMobile] = useState(false);
  const auth = useAuth();
  const location = useLocation();
  const current = [...main, ...management].find((item) =>
    location.pathname.startsWith(item.to),
  );
  const navigation = (small = false) => (
    <>
      <div className="sidebar-brand">
        <BrandMark compact={small} />
      </div>
      <nav aria-label="Main navigation">
        {[
          { label: "MAIN MENU", items: main },
          { label: "MANAGEMENT", items: management },
        ].map((group) => (
          <div className="nav-group" key={group.label}>
            {!small && <p>{group.label}</p>}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={small ? item.label : undefined}
                onClick={() => setMobile(false)}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <item.icon size={19} />
                {!small && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {!small && (
          <div className="sidebar-note">
            <div className="flex items-center gap-2">
              <span className="gold-dot" /> YOUR OPERATIONS, REFINED
            </div>
            <p>
              Every detail.
              <br />
              Under control.
            </p>
          </div>
        )}
        <div className="admin-block">
          <span className="avatar">
            {auth.admin?.username.slice(0, 2).toUpperCase()}
          </span>
          {!small && (
            <div className="min-w-0">
              <strong className="truncate block">{auth.admin?.username}</strong>
              <small>Administrator</small>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className="logout-button"
          disabled={auth.loggingOut}
          title="Sign out"
          onClick={() => void auth.logout()}
        >
          <LogOut size={17} />
          {!small && (auth.loggingOut ? "Signing out…" : "Sign out")}
        </Button>
      </div>
    </>
  );
  return (
    <div className={`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="desktop-sidebar">
        {navigation(collapsed)}
        <button
          className="collapse-handle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => {
            localStorage.setItem(
              "aurel.sidebar",
              collapsed ? "expanded" : "collapsed",
            );
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="mobile-sidebar">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {navigation()}
        </SheetContent>
      </Sheet>
      <div className="workspace">
        <header className="topbar">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="desktop-toggle"
              aria-label="Toggle sidebar"
              onClick={() => {
                localStorage.setItem(
                  "aurel.sidebar",
                  collapsed ? "expanded" : "collapsed",
                );
                setCollapsed(!collapsed);
              }}
            >
              <PanelLeftClose size={18} />
            </Button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={13} />{" "}
              <strong>{current?.label || "Page"}</strong>
              {location.pathname.endsWith("/new") && (
                <>
                  {" "}
                  <ChevronRight size={13} /> New
                </>
              )}
              {location.pathname.endsWith("/edit") && (
                <>
                  {" "}
                  <ChevronRight size={13} /> Edit
                </>
              )}
            </span>
          </div>
          <div className="topbar-right">
            <span className="admin-role">ADMIN CONSOLE</span>
            <span className="avatar small">
              {auth.admin?.username.slice(0, 2).toUpperCase()}
            </span>
            <span className="topbar-username">{auth.admin?.username}</span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
          <footer className="workspace-footer">
            <span>
              AUREL <span> / </span> FLEET MANAGEMENT
            </span>
            <span>Built for the road ahead.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
