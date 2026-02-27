import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ScanLine,
  ClipboardList,
  Users,
  History,
  ShieldCheck,
  UserCog,
  Database,
  Bell,
  CheckSquare,
  Video,
  Image as ImageIcon,
  Calendar,
} from "lucide-react";

export type AppRole = "USER" | "PRACTITIONER" | "ADMIN";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles that can see this item. Omit = all authenticated. */
  roles?: AppRole[];
  /** Show only when practitioner_type === "SPECIALIST" */
  specialistOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan-history", label: "Scans", icon: History, roles: ["USER", "PRACTITIONER"] },
  { href: "/consultations", label: "Consults", icon: ClipboardList, roles: ["USER", "PRACTITIONER"] },
  { href: "/patients", label: "Patients", icon: Users, roles: ["PRACTITIONER"] },
  { href: "/review-queue", label: "Review", icon: CheckSquare, roles: ["PRACTITIONER"], specialistOnly: true },
  { href: "/appointments", label: "Appointments", icon: Calendar, roles: ["PRACTITIONER"] },
  { href: "/schedules", label: "Schedules", icon: Calendar, roles: ["USER"] },
  { href: "/telemedicine", label: "Call", icon: Video, roles: ["USER", "PRACTITIONER"] },
  { href: "/notifications", label: "Alerts", icon: Bell, roles: ["USER", "PRACTITIONER"] },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Admin", icon: ShieldCheck, roles: ["ADMIN"] },
  { href: "/admin/images", label: "Images", icon: ImageIcon, roles: ["ADMIN"] },
  { href: "/admin/practitioners", label: "Doctors", icon: UserCog, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/retraining-logs", label: "Models", icon: Database, roles: ["ADMIN"] },
];

export interface DashboardConfig {
  description: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  primaryActionIcon?: LucideIcon;
}

export const DASHBOARD_CONFIG: Record<AppRole, DashboardConfig> = {
  USER: {
    description: "Your scans and consultations",
    primaryActionLabel: "New Scan",
    primaryActionHref: "/scan-history",
    primaryActionIcon: ScanLine,
  },
  PRACTITIONER: {
    description: "Your practice overview and urgent cases",
    primaryActionLabel: "New Consultation",
    primaryActionHref: "/consultations/new",
    primaryActionIcon: ClipboardList,
  },
  ADMIN: {
    description: "National system overview",
    primaryActionLabel: "View Dashboard",
    primaryActionHref: "/dashboard",
    primaryActionIcon: LayoutDashboard,
  },
};

/** Specialist (practitioner_type === "SPECIALIST") dashboard copy. */
export const SPECIALIST_DASHBOARD_CONFIG: DashboardConfig = {
  description: "Review queue, clinical reviews, and teleconsultation",
  primaryActionLabel: "Review Queue",
  primaryActionHref: "/review-queue",
  primaryActionIcon: CheckSquare,
};

/** Routes that require specific roles. PRACTITIONER + specialistOnly means only specialists. */
export const ROUTE_ALLOWED_ROLES: Record<
  string,
  { roles: AppRole[]; specialistOnly?: boolean }
> = {
  "/patients": { roles: ["PRACTITIONER", "ADMIN"] },
  "/review-queue": { roles: ["PRACTITIONER"], specialistOnly: true },
};

export function getVisibleNavItems(
  role: AppRole | undefined,
  isSpecialist: boolean
): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.specialistOnly && !isSpecialist) return false;
    return true;
  });
}

export function getVisibleAdminItems(role: AppRole | undefined): NavItem[] {
  if (!role || role !== "ADMIN") return [];
  return ADMIN_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

export function canAccessRoute(
  pathname: string,
  role: AppRole | undefined,
  isSpecialist: boolean
): boolean {
  if (!role) return false;
  const routeConfig = ROUTE_ALLOWED_ROLES[pathname];
  if (!routeConfig) return true;
  if (!routeConfig.roles.includes(role)) return false;
  if (routeConfig.specialistOnly && !isSpecialist) return false;
  return true;
}
