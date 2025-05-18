"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface SiteHeaderProps {
  siteName?: string;
  children?: React.ReactNode;
  showThemeToggle?: boolean;
  showSidebarTrigger?: boolean;
  className?: string;
}

export function SiteHeader({
  siteName,
  children,
  showThemeToggle = true,
  showSidebarTrigger = true,
  className,
}: SiteHeaderProps) {
  const pathname = usePathname();

  if (siteName === undefined) {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0];
      siteName = firstSegment.charAt(0).toUpperCase() + 
                 firstSegment.slice(1).replace(/[-_]/g, ' ');
    } else {
      siteName = 'Home';
    }
  }

  return (
    <header className={cn(
      "group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-14 w-full shrink-0 items-center bg-background transition-[width,height] ease-linear",
      className
    )}>
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 flex-1">
          {showSidebarTrigger && (
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-1 data-[orientation=vertical]:h-5"
              />
            </>
          )}
          <h1 className="text-lg font-semibold truncate">{siteName}</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-center">
          {/* You can add a search bar or other central elements here */}
        </div>
        
        <div className="flex flex-1 items-center justify-end gap-3">
          {children}
          {showThemeToggle && <ModeToggle />}
        </div>
      </div>
    </header>
  )
}