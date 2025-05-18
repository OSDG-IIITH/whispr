import Image from 'next/image';
import { User } from 'lucide-react';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SiteHeader } from '@/components/ui/site-header';
import { ModeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex flex-col h-full">
          <SiteHeader 
            showThemeToggle={false}
            showSidebarTrigger={true}
            className="border-b border-border/40">
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <span className="hidden md:inline-flex">Help</span>
              </Button>
              <ModeToggle />
              <Button size="sm" variant="ghost" className="w-8 h-8 rounded-full p-0 relative overflow-hidden">
                <span className="sr-only">User account</span>
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <Image
                  src="https://avatars.githubusercontent.com/u/124599?v=4"
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              </Button>
            </div>
          </SiteHeader>
          
          <main className="flex-1 p-6 overflow-auto bg-background/40">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}