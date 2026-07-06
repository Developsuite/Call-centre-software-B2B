import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FolderOpen, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Timer,
  PlayCircle
} from "lucide-react"

export default function ProcessorDashboard() {
  return (
    <DashboardLayout title="Processor Dashboard">
      <div className="flex flex-col gap-6">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Action Card */}
          <Card className="rounded-[1.5rem] border-none shadow-sm bg-gradient-to-br from-[#ff7a5c] to-[#ff5a36] p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="font-medium text-white/90">Pending Queue</p>
                <h2 className="text-5xl font-bold mt-2 tracking-tight">42</h2>
                <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs font-medium mt-3 backdrop-blur-md border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live updates active
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                <FolderOpen className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 relative z-10">
              <button className="flex-1 bg-white text-[#ff5a36] shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:bg-slate-50 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <PlayCircle className="w-4 h-4" />
                Start Processing
              </button>
            </div>
          </Card>

          {/* 2x2 Bento Grid */}
          <div className="xl:col-span-2 grid grid-cols-2 gap-4">
            
            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">In Process</span>
                <Clock className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">18</h3>
                <p className="text-xs text-blue-500 font-medium mt-1">Across 4 agents</p>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">Processed Today</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">156</h3>
                <p className="text-xs text-emerald-500 font-medium mt-1">↑ 12% vs yesterday</p>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">Rejected Today</span>
                <XCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">7</h3>
                <p className="text-xs text-slate-400 mt-1">Within normal threshold</p>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">Avg Processing Time</span>
                <Timer className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">4m 12s</h3>
                <p className="text-xs text-emerald-500 font-medium mt-1">↓ 30s faster</p>
              </div>
            </Card>

          </div>
        </div>

        {/* Live Queue Table */}
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-card overflow-hidden">
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Live Queue
                <span className="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">42 PENDING</span>
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search by ID or Agent" 
                    className="pl-9 h-9 w-[240px] bg-slate-50 dark:bg-background border-none rounded-full text-xs focus-visible:ring-[#ff5a36]"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-xs font-medium border-slate-200 dark:border-border">
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px] text-left">
                <thead>
                  <tr className="text-slate-400 font-medium border-b border-slate-100 dark:border-border">
                    <th className="pb-3 px-4 font-medium">Time in Queue</th>
                    <th className="pb-3 px-4 font-medium">Sale ID</th>
                    <th className="pb-3 px-4 font-medium">Agent</th>
                    <th className="pb-3 px-4 font-medium">Account Type</th>
                    <th className="pb-3 px-4 font-medium">Status</th>
                    <th className="pb-3 px-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-300">
                  {[
                    { time: '12m 45s', id: 'INV_000078', agent: 'Sarah Jenkins', type: 'Enterprise', stat: 'Pending', color: 'bg-red-500' },
                    { time: '08m 12s', id: 'INV_000077', agent: 'Mike Ross', type: 'Personal', stat: 'Need Info', color: 'bg-amber-500' },
                    { time: '05m 30s', id: 'INV_000076', agent: 'Harvey Specter', type: 'Business', stat: 'In Process', color: 'bg-blue-500' },
                    { time: '01m 15s', id: 'INV_000075', agent: 'Donna Paulsen', type: 'Premium', stat: 'Pending', color: 'bg-red-500' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer border-b border-slate-50 dark:border-border/50 last:border-none">
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{row.time}</td>
                      <td className="py-3 px-4 text-slate-500">{row.id}</td>
                      <td className="py-3 px-4">{row.agent}</td>
                      <td className="py-3 px-4 font-medium">{row.type}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${row.color}`}></span>
                          {row.stat}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-[11px] font-medium text-[#ff5a36] hover:text-white border border-[#ff5a36] hover:bg-[#ff5a36] px-3 py-1 rounded-full transition-colors">
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}
