"use client"

import * as React from "react"
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const adminNavigation = [
  {
    title: "Overview",
    items: [
      { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
      { title: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="mr-2 h-4 w-4" /> }
    ]
  },
  {
    title: "Management",
    items: [
      { title: 'Users', href: '/admin/users', icon: <Users className="mr-2 h-4 w-4" /> },
      { title: 'Courses', href: '/admin/courses', icon: <BookOpen className="mr-2 h-4 w-4" /> },
      { title: 'Reviews', href: '/admin/reviews', icon: <MessageSquare className="mr-2 h-4 w-4" /> }
    ]
  },
  {
    title: "System",
    items: [
      { title: 'Settings', href: '/admin/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
      { title: 'Logout', href: '/logout', icon: <LogOut className="mr-2 h-4 w-4" /> }
    ]
  }
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="mb-2 px-3 py-2">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4">
          <Image
            src="/logo.png"
            alt="Whispr"
            width={40}
            height={40}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">Whispr</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="gap-0">
        {adminNavigation.map((section, index) => (
          <Collapsible key={section.title} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel 
                asChild 
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CollapsibleTrigger>
                  {section.title}
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={pathname === item.href}
                        >
                          <Link href={item.href}>
                            {item.icon}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
            {index < adminNavigation.length - 1 && <SidebarSeparator className="my-2" />}
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
