import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/store/AppContext";
import { Toaster } from "sonner";
import { NavigationLoader } from "@/components/NavigationLoader";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "VoiceLink",
  description: "Live sales processing CRM",
};

import { createClient } from "@/utils/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const serverUserId = session?.user?.id || null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="6afGxWEhli5ghGunqq9_ZT573-1g7a2PXQOP7wuBm0Y" />
      </head>
      <body className={`${figtree.variable} font-sans antialiased min-h-screen bg-[#fafafa] dark:bg-black`}>
        <AppProvider serverUserId={serverUserId}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <NavigationLoader />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
