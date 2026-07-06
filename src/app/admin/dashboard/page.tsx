import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Building2, 
  Users, 
  Target, 
  Award,
  Search,
  Filter,
  Download,
  TrendingUp
} from "lucide-react"

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="flex flex-col gap-6">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Action Card */}
          <Card className="rounded-[1.5rem] border-none shadow-sm bg-gradient-to-br from-[#404040] to-[#111111] dark:from-[#2e3440] dark:to-[#0f172a] p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="font-medium text-slate-300">Total Company Sales (MTD)</p>
                <h2 className="text-5xl font-bold mt-2 tracking-tight">$1.4M</h2>
                <div className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium mt-3 border border-emerald-500/20">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18% vs Last Month
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <Building2 className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 relative z-10">
              <button className="flex-1 bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(255,90,54,0.3)] border border-[#e04a29] hover:brightness-110 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <Download className="w-4 h-4" />
                Export Full Report
              </button>
            </div>
          </Card>

          {/* 2x2 Bento Grid */}
          <div className="xl:col-span-2 grid grid-cols-2 gap-4">
            
            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">Active Agents</span>
                <Users className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">124</h3>
                <p className="text-xs text-slate-400 mt-1">Out of 150 total staff</p>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">Total Processed</span>
                <Target className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">4,892</h3>
                <p className="text-xs text-emerald-500 font-medium mt-1">98% of target reached</p>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">Top Team</span>
                <Award className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">Alpha Squad</h3>
                <p className="text-xs text-slate-400 mt-1">$450k revenue this month</p>
              </div>
            </Card>

            <Card className="rounded-[1.25rem] border-none shadow-sm bg-card p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500">Approval Rate</span>
                <Target className="w-5 h-5 text-indigo-500" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">94.2%</h3>
                <p className="text-xs text-emerald-500 font-medium mt-1">↑ 2.1% improvement</p>
              </div>
            </Card>

          </div>
        </div>

        {/* Team Performance Table */}
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-card overflow-hidden">
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Team Performance
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search teams..." 
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
                    <th className="pb-3 px-4 font-medium">Rank</th>
                    <th className="pb-3 px-4 font-medium">Team Name</th>
                    <th className="pb-3 px-4 font-medium">Supervisor</th>
                    <th className="pb-3 px-4 font-medium">Sales Volume</th>
                    <th className="pb-3 px-4 font-medium">Conversion</th>
                    <th className="pb-3 px-4 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-300">
                  {[
                    { rank: '#1', name: 'Alpha Squad', leader: 'John Doe', vol: '$450,200', conv: '48%', stat: 'Excellent' },
                    { rank: '#2', name: 'Beta Force', leader: 'Jane Smith', vol: '$380,500', conv: '45%', stat: 'Good' },
                    { rank: '#3', name: 'Gamma Rays', leader: 'Mike Johnson', vol: '$310,000', conv: '41%', stat: 'Good' },
                    { rank: '#4', name: 'Delta Ops', leader: 'Sarah Williams', vol: '$245,800', conv: '35%', stat: 'Needs Review' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer border-b border-slate-50 dark:border-border/50 last:border-none">
                      <td className="py-3 px-4 font-bold text-[#ff5a36]">{row.rank}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{row.name}</td>
                      <td className="py-3 px-4">{row.leader}</td>
                      <td className="py-3 px-4 font-medium">{row.vol}</td>
                      <td className="py-3 px-4">{row.conv}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          row.stat === 'Excellent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          row.stat === 'Good' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                          'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {row.stat.toUpperCase()}
                        </span>
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
