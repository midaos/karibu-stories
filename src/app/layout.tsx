import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/use-toast'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { GlobalHeader } from '@/components/layout/GloablHeader'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Karibu Stories | African Stories, Reimagined",
  description: "Discover original African stories. Connect with writers. Build your reading universe.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_path, display_name')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans pb-16 md:pb-0">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <GlobalHeader user={user ? { id: user.id, ...profile } : null} />
          <main className="flex-1">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}