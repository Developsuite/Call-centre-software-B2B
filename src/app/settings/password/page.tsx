"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Key, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { actual_password: newPassword }
      });

      if (error) {
        toast.error("Failed to update password: " + error.message);
      } else {
        toast.success("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        // Redirect back to dashboard after brief delay
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Security Settings">
      <div className="max-w-2xl mx-auto w-full pt-8 px-4 relative z-10">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[#ff5a36]/5 dark:bg-[#ff5a36]/10 blur-[100px] rounded-full pointer-events-none" />

        <Card className="rounded-[1.5rem] border border-[#ff5a36]/10 shadow-[0_4px_20px_rgba(255,90,54,0.03)] bg-white dark:bg-card p-8 flex flex-col relative z-10 overflow-hidden">
          
          <div className="flex items-start gap-5 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">Update Password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ensure your account is using a long, random password to stay secure. It must be at least 6 characters long.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <fieldset disabled={isSubmitting} className="space-y-6">
              
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <PasswordInput 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 h-12 text-sm bg-slate-50/50 dark:bg-background border border-[#ff5a36]/30 hover:border-[#ff5a36]/60 rounded-xl text-slate-800 dark:text-white focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:border-[#ff5a36] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <PasswordInput 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10 h-12 text-sm bg-slate-50/50 dark:bg-background border border-[#ff5a36]/30 hover:border-[#ff5a36]/60 rounded-xl text-slate-800 dark:text-white focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:border-[#ff5a36] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || !confirmPassword}
                  className="w-full h-12 rounded-xl bg-[#ff5a36] text-white font-semibold text-sm hover:bg-[#e04829] hover:shadow-[0_0_20px_rgba(255,90,54,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Security...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Save New Password
                    </>
                  )}
                </button>
              </div>

            </fieldset>
          </form>

        </Card>
      </div>
    </DashboardLayout>
  );
}
