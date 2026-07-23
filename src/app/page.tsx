"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowRightLeft, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Database,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  PlusCircle,
  ChevronDown,
  Eye,
  Pencil,
  FileText,
  Zap,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { useAppContext } from "@/store/AppContext";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function SalesAgentDashboard() {
  const { sales, deleteSale, currentUser, isLoaded } = useAppContext();
  const router = useRouter();
  React.useEffect(() => {
    if (isLoaded && currentUser) {
      if (currentUser.role === "SuperAdmin") router.push("/master/dashboard");
      else if (currentUser.role === "Admin") router.push("/admin");
      else if (currentUser.role === "Processor") router.push("/processor/queue");
      else if (currentUser.role === "HR") router.push("/hr");
    }
  }, [isLoaded, currentUser, router]);

  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [dateFilter, setDateFilter] = React.useState("Today");
  const [customDate, setCustomDate] = React.useState("");

  if (!isLoaded) {
    return (
      <DashboardLayout title="Agent Dashboard">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentUser) {
    return (
      <DashboardLayout title="Agent Dashboard">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Not Found</h2>
          <p className="text-slate-500 max-w-md text-sm">Your account does not have a profile linked to it. Please contact your SuperAdmin to provision your profile.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (currentUser.role !== "Agent") {
    return (
      <DashboardLayout title="Redirecting...">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const tenantSales = sales.filter(s => s.tenantId === currentUser?.tenantId && (s.agent_id === currentUser?.id || s.agent === currentUser?.name));

  // Logical Shift Date (Night shift 7pm to 5am -> offset by 5 hours)
  const getLogicalShiftDate = (timestamp: number) => {
    const d = new Date(timestamp - 5 * 60 * 60 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLogicalShiftDate(Date.now());
  const yesterdayStr = getLogicalShiftDate(Date.now() - 24 * 60 * 60 * 1000);

  const dateFilteredSales = tenantSales.filter(sale => {
    const saleDateStr = getLogicalShiftDate(sale.timestamp);
    if (dateFilter === "Today") return saleDateStr === todayStr;
    if (dateFilter === "Yesterday") return saleDateStr === yesterdayStr;
    if (dateFilter === "This Week") {
      const daysDiff = (new Date(todayStr).getTime() - new Date(saleDateStr).getTime()) / (1000 * 3600 * 24);
      return daysDiff >= 0 && daysDiff < 7;
    }
    if (dateFilter === "This Month") return saleDateStr.substring(0, 7) === todayStr.substring(0, 7);
    if (dateFilter === "Specific Date" && customDate) return saleDateStr === customDate;
    return true; // All Time or unselected Specific Date
  });

  // Search and Filter Logic
  const filteredSales = dateFilteredSales.filter(sale => {
    const matchesSearch = sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) || sale.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === "All" || sale.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = dateFilteredSales.filter(s => s.status === "Pending" || s.status === "In Process").length;
  const needInfoCount = dateFilteredSales.filter(s => s.status === "Need Info").length;
  const processedCount = dateFilteredSales.filter(s => s.status === "Processed").length;
  const rejectedCount = dateFilteredSales.filter(s => s.status === "Rejected").length;
  const connectedCount = dateFilteredSales.filter(s => s.status === "Connected").length;
  
  // Dynamically calculate Pipeline Value
  const totalSubmissions = dateFilteredSales.length;

  const convRate = dateFilteredSales.length > 0 ? Math.round((connectedCount / dateFilteredSales.length) * 100) : 0;
  
  // Dynamic Performance Chart (Past months static, current month dynamic)
  const chartData = [40, 60, 50, 70, 80, 65, Math.min(connectedCount * 10, 100), 0];

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  return (
    <DashboardLayout title="Agent Dashboard">
      <div className="flex flex-col gap-4 md:gap-6 font-sans max-w-[1400px] mx-auto w-full">
        
        {/* Header Greeting */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Good morning, {currentUser.name}</h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">Stay on top of your sales targets, monitor progress, and track processing status.</p>
        </div>

        {/* Top Bento Grid Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          
          {/* Total Sales / Main Metric */}
          <Card className="rounded-[1.5rem] lg:col-span-4 border-none shadow-sm overflow-hidden flex flex-col justify-between p-5">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 text-xs font-medium">Total Submissions</p>
              <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
                📅 YTD <ChevronDown className="h-3 w-3"/>
              </div>
            </div>
            <div className="mt-6 mb-6">
              <h2 className="text-4xl font-bold text-slate-800 dark:text-white truncate" title={totalSubmissions.toString()}>{totalSubmissions}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {totalSubmissions > 0 ? '↑' : ''} {totalSubmissions > 0 ? '12%' : '0%'}
                </span>
                <span className="text-slate-400 text-[10px] font-medium">than last month</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/sales/new" className="flex-1 bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] border border-[#2a2a2a] dark:border-border hover:brightness-110 text-white text-xs font-medium py-2.5 px-3 rounded-full flex items-center justify-center gap-2 transition-all whitespace-nowrap">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                New Sale
              </Link>
              <button className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium py-2.5 px-3 rounded-full flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Request
              </button>
            </div>
          </Card>

          {/* 3x2 Mini Cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 lg:col-span-4">
            <Card className="rounded-[1.25rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_20px_rgba(255,90,54,0.2)] bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] border border-[#e04a29] text-white p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-medium text-white/90">Pending</span>
                <Wallet className="w-3.5 h-3.5 text-white/80" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mt-2">{pendingCount}</h3>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-medium text-slate-500">Need Info</span>
                <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-slate-800 dark:text-white">{needInfoCount}</h3>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-medium text-slate-500">Processed</span>
                <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-slate-800 dark:text-white">{processedCount}</h3>
              </div>
            </Card>
            
            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-medium text-slate-500">Rejected</span>
                <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-slate-800 dark:text-white">{rejectedCount}</h3>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-medium text-slate-500">Connected</span>
                <Database className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-slate-800 dark:text-white">{connectedCount}</h3>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-medium text-slate-500">Conv. Rate</span>
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-slate-800 dark:text-white">{convRate}%</h3>
              </div>
            </Card>
          </div>

          {/* Chart Card */}
          <Card className="rounded-[1.5rem] lg:col-span-4 border-none shadow-sm p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Performance</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">View your conversion in a certain period</p>
              </div>
            </div>
            {/* CSS-based bar chart illustration */}
            <div className="flex-1 flex items-end justify-between gap-1 mt-auto h-24">
               {chartData.map((h, i) => (
                 <div key={i} className="w-full flex flex-col items-center gap-1.5 group cursor-pointer">
                   <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-sm flex flex-col justify-end overflow-hidden h-full min-h-[80px]">
                     <div 
                       className={`w-full ${i === 6 ? 'bg-[#ff5a36]' : 'bg-[#1a1a1a] dark:bg-slate-600'} rounded-t-sm transition-all group-hover:bg-[#ff5a36]`}
                       style={{ height: `${h}%` }}
                     />
                   </div>
                   <span className="text-[9px] text-slate-400 font-medium">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][i]}</span>
                 </div>
               ))}
            </div>
          </Card>

        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-1">
          
          {/* Target Progress & Quick Actions */}
          <div className="flex flex-col gap-4 md:gap-6 lg:col-span-4">
            <Card className="rounded-[1.5rem] border-none shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-3">Monthly Target (Connected)</h3>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-1.5 overflow-hidden">
                <div className="bg-[#ff5a36] h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((connectedCount / 20) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-medium mt-2">
                <span className="text-slate-500">{connectedCount} / 20 connected</span>
                <span className="text-slate-400">{Math.round((connectedCount / 20) * 100)}%</span>
              </div>
            </Card>
            
            <Card className="rounded-[1.5rem] border-none shadow-sm p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Quick Access</h3>
                <button className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full flex items-center gap-1 font-medium hover:bg-slate-200 transition-colors">
                  <PlusCircle className="w-2.5 h-2.5" /> Add new
                </button>
              </div>
              <div className="flex gap-3">
                 {/* Dark Card */}
                 <div className="flex-1 bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_20px_rgba(0,0,0,0.3)] border border-[#2a2a2a] dark:border-slate-700 rounded-xl p-3 text-white flex flex-col justify-between relative overflow-hidden h-24 cursor-pointer hover:-translate-y-0.5 transition-transform">
                   <div className="flex justify-between items-center z-10 relative">
                     <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                       <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Active
                     </div>
                     <div className="w-4 h-4 bg-red-500 rounded-full mix-blend-screen opacity-80 -ml-1.5"></div>
                     <div className="w-4 h-4 bg-yellow-400 rounded-full mix-blend-screen opacity-80 absolute right-0"></div>
                   </div>
                   <div className="z-10 relative mt-auto">
                     <p className="text-[9px] text-white/50 mb-0.5">Queue Status</p>
                     <p className="text-xs font-bold tracking-wider">Normal Load</p>
                   </div>
                 </div>
                 
                 {/* Orange Card */}
                 <div className="flex-1 bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_20px_rgba(255,90,54,0.3)] border border-[#e04a29] rounded-xl p-3 text-white flex flex-col justify-between relative overflow-hidden h-24 cursor-pointer hover:-translate-y-0.5 transition-transform">
                   <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[9px] font-bold w-fit z-10 relative">
                     <span className="w-1 h-1 rounded-full bg-white"></span> VIP
                   </div>
                   <div className="z-10 relative mt-auto">
                     <p className="text-[9px] text-white/70 mb-0.5">Priority</p>
                     <p className="text-xs font-bold tracking-wider">Escalate</p>
                   </div>
                   {/* Sparkles decoration */}
                   <div className="absolute top-2 right-2 text-white/30 text-lg">✨</div>
                 </div>
              </div>
            </Card>
          </div>

          {/* Recent Activities Table */}
          <Card className="rounded-[1.5rem] border-none shadow-sm p-5 lg:col-span-8 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Activities</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder="Search ID or Name" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-full h-8 text-xs w-40 shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
                  />
                </div>
                
                {dateFilter === "Specific Date" && (
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-full h-8 text-xs w-[130px] shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]"
                  />
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-full h-8 border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium shadow-sm flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                    {dateFilter === "All Time" ? "Date" : dateFilter} <Filter className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={dateFilter} onValueChange={setDateFilter}>
                      <DropdownMenuRadioItem value="All Time">All Time</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Today">Today's Shift</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Yesterday">Yesterday's Shift</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="This Week">This Week</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="This Month">This Month</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Specific Date">Specific Date...</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-full h-8 border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium shadow-sm flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                    {statusFilter === "All" ? "Filter" : statusFilter} <Filter className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                      <DropdownMenuRadioItem value="All">All Statuses</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Pending">Pending</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="In Process">In Process</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Need Info">Need Info</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Processed">Processed</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Connected">Connected</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Rejected">Rejected</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] md:text-xs text-left">
                <thead>
                  <tr className="text-slate-400 font-medium border-b border-slate-100 dark:border-border">
                    <th className="pb-2 px-3 w-8"><input type="checkbox" className="rounded border-slate-300" /></th>
                    <th className="pb-2 px-2 font-medium">Sale ID</th>
                    <th className="pb-2 px-2 font-medium">Type</th>
                    <th className="pb-2 px-2 font-medium">Customer</th>
                    <th className="pb-2 px-2 font-medium">Status</th>
                    <th className="pb-2 px-2 font-medium hidden lg:table-cell">Assigned To</th>
                    <th className="pb-2 px-2 font-medium hidden sm:table-cell">Date</th>
                    <th className="pb-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.slice(0, 10).map((row, i) => {
                    const statusColors: Record<string, string> = {
                      "Pending": "bg-red-500",
                      "In Process": "bg-yellow-400",
                      "Processed": "bg-emerald-500",
                      "Connected": "bg-blue-500",
                      "Need Info": "bg-amber-500",
                      "Rejected": "bg-slate-500"
                    };
                    const isLast = i === Math.min(filteredSales.length, 10) - 1;
                    return (
                      <React.Fragment key={row.id}>
                        <tr className={cn(
                          "group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                          (!isLast && !expandedRows.has(row.id)) && "border-b border-slate-50 dark:border-slate-800/50"
                        )}>
                          <td className="py-2.5 px-3 flex items-center gap-2">
                            <input type="checkbox" className="rounded border-slate-300 text-[#ff5a36] focus:ring-[#ff5a36]" />
                            {row.processorNotes && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(row.id);
                                }}
                                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              >
                                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", expandedRows.has(row.id) && "rotate-180")} />
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 font-medium whitespace-nowrap">{row.id.split('-')[0].toUpperCase()}</td>
                          <td className="py-2.5 px-2 font-medium text-slate-700 dark:text-white flex items-center gap-2 whitespace-nowrap">
                            {row.accountType.toLowerCase() === "personal" ? (
                              <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[9px]">P</div>
                            ) : (
                              <div className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[9px]">B</div>
                            )}
                            {row.accountType}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-white">
                            {row.customer}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusColors[row.status] || "bg-red-500"}`}></span>
                              {row.status}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 text-[11px] hidden lg:table-cell whitespace-nowrap">
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-0.5 rounded-full font-medium">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              {row.processor_id === currentUser.id ? "Myself" : (row.assignedTo || "Unassigned")}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 text-[11px] hidden sm:table-cell whitespace-nowrap">{formatDate(row.timestamp)}</td>
                          <td className="py-2.5 px-2 text-right flex items-center justify-end gap-1.5">
                            <Link href={`/sales/${row.id}`}>
                              <button 
                                className="text-blue-400 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                                title="View Sale Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </Link>

                            {row.processor_id === currentUser.id && (row.status === "Pending" || row.status === "Need Info" || row.status === "In Process") && (
                              <Link href={`/sales/${row.id}/edit`}>
                                <button 
                                  className="text-emerald-500 hover:text-emerald-600 transition-colors p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-500/10"
                                  title="Process this sale yourself"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline text-[10px] uppercase tracking-wider">Process Now</span>
                                </button>
                              </Link>
                            )}

                            {(row.status === "Pending" || row.status === "Need Info") && (
                              <Link href={`/sales/${row.id}/edit`}>
                                <button 
                                  className="text-amber-400 hover:text-amber-600 transition-colors p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                                  title="Edit Sale"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            )}

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSale(row.id);
                              }}
                              className="text-red-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                              title="Delete Sale"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                        {expandedRows.has(row.id) && row.processorNotes && (
                          <tr className={cn(
                            "bg-amber-50/50 dark:bg-amber-900/10",
                            !isLast && "border-b border-slate-50 dark:border-slate-800/50"
                          )}>
                            <td colSpan={7} className="py-3 px-4 text-xs">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="font-bold text-[10px] uppercase tracking-wider">
                                    Message from {row.processorName || row.assignedTo || "Processor"}
                                  </span>
                                </div>
                                <span className="text-amber-900 dark:text-amber-400 italic ml-5">
                                  "{row.processorNotes}"
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
