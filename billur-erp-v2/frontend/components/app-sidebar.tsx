"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Factory, Users, Wallet, Package,
  CheckCircle, QrCode, BarChart3, Scissors, Building2, LogOut,
  ScrollText, Truck, Printer, Gift,
} from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";

interface NavItem {
  title: string;
  icon: any;
  href: string;
  perm?: string;
}

const NAV: NavItem[] = [
  { title: "Dashboard",       icon: LayoutDashboard, href: "/" },
  { title: "Klientlar",       icon: Building2,       href: "/clients",    perm: "clients.read" },
  { title: "Zakazlar",        icon: ShoppingCart,    href: "/orders",     perm: "orders.read" },
  { title: "Production",      icon: Factory,         href: "/production", perm: "production.read" },
  { title: "Quality",         icon: CheckCircle,     href: "/quality",    perm: "quality.read" },
  { title: "Ombor",           icon: Package,         href: "/inventory",  perm: "inventory.read" },
  { title: "Izlishka",        icon: Gift,            href: "/surplus",    perm: "surplus.read" },
  { title: "Ishchilar",       icon: Users,           href: "/workers",    perm: "workers.read" },
  { title: "QR Scan",         icon: QrCode,          href: "/scanning",   perm: "qr.scan" },
  { title: "BoxApp",          icon: Package,         href: "/boxes",      perm: "box.read" },
  { title: "Shipmentlar",     icon: Truck,           href: "/shipments",  perm: "box.read" },
  { title: "Print",           icon: Printer,         href: "/print",      perm: "print.read" },
  { title: "Hisobotlar",      icon: BarChart3,       href: "/reports",    perm: "reports.read" },
  { title: "Foydalanuvchilar", icon: Users,          href: "/users",      perm: "users.read" },
  { title: "Audit",           icon: ScrollText,      href: "/audit",      perm: "audit.read" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();

  const visible = NAV.filter(i => !i.perm || hasPermission(i.perm));

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm">BILLUR ERP</span>
            <span className="text-xs text-muted-foreground">Production System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Asosiy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-xs">
                <span className="font-semibold">{user?.full_name || "—"}</span>
                <span className="text-muted-foreground uppercase">{user?.role_id || ""}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled>
              <span className="text-xs text-muted-foreground">{user?.username}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await logout(); router.push("/login"); }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Chiqish</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
