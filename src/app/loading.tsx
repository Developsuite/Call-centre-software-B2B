import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff5a36]" />
      </div>
    </div>
  );
}
