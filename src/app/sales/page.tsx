"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search,
  Filter,
  Trash2,
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

export default function MySalesPage() {
  const { sales, deleteSale, currentUser, isLoaded } = useAppContext();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoaded && currentUser) {
      if (currentUser.role === "SuperAdmin") router.push("/master/dashboard");
      else if (currentUser.role === "Admin") router.push("/admin");
      else if (currentUser.role === "Processor") router.push("/processor/queue");
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [dateFilter, setDateFilter] = React.useState("All Time");
  const [customDate, setCustomDate] = React.useState("");

  if (!isLoaded) {
    return (
      <DashboardLayout title="My Sales">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentUser) {
    return (
      <DashboardLayout title="My Sales">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Not Found</h2>
          <p className="text-slate-500 max-w-md text-sm">Your account does not have a profile linked to it.</p>
        </div>
      </DashboardLayout>
    );
  }

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

  const dateFilteredSales = sales
    .filter(s => s.agent_id === currentUser?.id || s.agent === currentUser?.name)
    .filter(sale => {
      let matchesDate = true;
      const saleDateStr = getLogicalShiftDate(sale.timestamp);
      if (dateFilter === "Today") {
        matchesDate = saleDateStr === todayStr;
      } else if (dateFilter === "Yesterday") {
        matchesDate = saleDateStr === yesterdayStr;
      } else if (dateFilter === "This Week") {
        const daysDiff = (new Date(todayStr).getTime() - new Date(saleDateStr).getTime()) / (1000 * 3600 * 24);
        matchesDate = daysDiff >= 0 && daysDiff < 7;
      } else if (dateFilter === "This Month") {
        matchesDate = saleDateStr.substring(0, 7) === todayStr.substring(0, 7);
      } else if (dateFilter === "Specific Date" && customDate) {
        matchesDate = saleDateStr === customDate;
      }
      return matchesDate;
    });

  const filteredSales = dateFilteredSales
    .filter(sale => {
      const matchesSearch = sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) || sale.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === "All" || sale.status === statusFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <DashboardLayout title="My Sales">
      <div className="max-w-[98%] mx-auto w-full flex flex-col gap-4 md:gap-6 relative z-10 pb-6">
        
        <Card className="rounded-[1.5rem] border-none shadow-sm p-5 flex flex-col min-h-[calc(100vh-8rem)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">All My Sales</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search ID or Name" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-full h-9 text-sm w-48 shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
                />
              </div>
              
              {dateFilter === "Specific Date" && (
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-full h-9 text-sm w-[140px] shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]"
                />
              )}

              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full h-9 border border-slate-200 dark:border-slate-700 px-4 text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors">
                  {dateFilter === "All Time" ? "Date" : dateFilter} <Filter className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
            </div>
          </div>

          {/* Status Filter Mini-Cards */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-4 shrink-0">
            {["All", "Pending", "In Process", "Need Info", "Processed", "Connected", "Rejected"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  statusFilter === status 
                    ? "bg-[#ff5a36] text-white border-[#ff5a36] shadow-md shadow-[#ff5a36]/20" 
                    : "bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-[#ff5a36]/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {status === "All" ? "All Sales" : status}
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                  statusFilter === status 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  {status === "All" ? dateFilteredSales.length : dateFilteredSales.filter(s => s.status === status).length}
                </span>
              </button>
            ))}
          </div>
          {/* Status Filter Mini-Cards */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 font-medium border-b border-slate-100 dark:border-border">
                  <th className="pb-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="pb-3 px-3 font-medium">Sale ID</th>
                  <th className="pb-3 px-3 font-medium">Type</th>
                  <th className="pb-3 px-3 font-medium">Customer</th>
                  <th className="pb-3 px-3 font-medium">Status</th>
                  <th className="pb-3 px-3 font-medium hidden lg:table-cell">Assigned To</th>
                  <th className="pb-3 px-3 font-medium hidden sm:table-cell">Date</th>
                  <th className="pb-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((row, i) => {
                  const statusColors: Record<string, string> = {
                    "Pending": "bg-red-500",
                    "In Process": "bg-yellow-400",
                    "Processed": "bg-emerald-500",
                    "Connected": "bg-blue-500",
                    "Need Info": "bg-amber-500",
                    "Rejected": "bg-slate-500"
                  };
                  const isLast = i === filteredSales.length - 1;
                  return (
                    <React.Fragment key={row.id}>
                      <tr className={cn(
                        "group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                        (!isLast && !expandedRows.has(row.id)) && "border-b border-slate-50 dark:border-slate-800/50"
                      )}>
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <input type="checkbox" className="rounded border-slate-300 text-[#ff5a36] focus:ring-[#ff5a36]" />
                          {row.processorNotes && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(row.id);
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", expandedRows.has(row.id) && "rotate-180")} />
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 font-medium whitespace-nowrap">{row.id.split('-')[0].toUpperCase()}</td>
                        <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-white flex items-center gap-2 whitespace-nowrap">
                          {row.accountType.toLowerCase() === "personal" ? (
                            <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">P</div>
                          ) : (
                            <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">B</div>
                          )}
                          {row.accountType}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-white">
                          {row.customer}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300 text-xs">
                            <span className={`w-2 h-2 rounded-full ${statusColors[row.status] || "bg-red-500"}`}></span>
                            {row.status}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-xs hidden lg:table-cell whitespace-nowrap">
                          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 w-fit px-2.5 py-1 rounded-full font-medium">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {row.processor_id === currentUser.id ? "Myself" : (row.assignedTo || "Unassigned")}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-xs hidden sm:table-cell whitespace-nowrap">{formatDate(row.timestamp)}</td>
                        <td className="py-3.5 px-3 text-right flex items-center justify-end gap-2">
                          <Link href={`/sales/${row.id}`}>
                            <button 
                              className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                              title="View Sale Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {row.processor_id === currentUser.id && (row.status === "Pending" || row.status === "Need Info" || row.status === "In Process") && (
                            <Link href={`/sales/${row.id}/edit`}>
                              <button 
                                className="text-emerald-500 hover:text-emerald-600 transition-colors p-2 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer flex items-center gap-1.5 font-bold bg-emerald-50 dark:bg-emerald-500/10"
                                title="Process this sale yourself"
                              >
                                <Zap className="w-4 h-4" />
                                <span className="hidden xl:inline text-xs uppercase tracking-wider">Process Now</span>
                              </button>
                            </Link>
                          )}

                          {(row.status === "Pending" || row.status === "Need Info") && (
                            <Link href={`/sales/${row.id}/edit`}>
                              <button 
                                className="text-amber-400 hover:text-amber-600 transition-colors p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                                title="Edit Sale"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </Link>
                          )}

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSale(row.id);
                            }}
                            className="text-red-300 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                            title="Delete Sale"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(row.id) && row.processorNotes && (
                        <tr className={cn(
                          "bg-amber-50/50 dark:bg-amber-900/10",
                          !isLast && "border-b border-slate-50 dark:border-slate-800/50"
                        )}>
                          <td colSpan={8} className="py-4 px-5 text-sm">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="font-bold text-xs uppercase tracking-wider">
                                  Message from {row.processorName || row.assignedTo || "Processor"}
                                </span>
                              </div>
                              <span className="text-amber-900 dark:text-amber-400 italic ml-6">
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
            
            {filteredSales.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>No sales found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
