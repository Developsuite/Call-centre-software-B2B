"use client";

import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { 
  LayoutDashboard, 
  Briefcase, 
  ShieldCheck,
  Settings, 
  Moon, 
  Sun,
  Menu,
  X,
  HelpCircle
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f3f4f6] dark:bg-background p-4 gap-6 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto mt-6 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
