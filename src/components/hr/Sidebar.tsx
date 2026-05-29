import { NavLink } from 'react-router-dom'
import { BarChart3, ShieldAlert, Users, TrendingDown, Settings, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import { ReactNode } from 'react'

const navigation = [
  { name: 'Visão Geral (ROI)', href: '/rh', icon: TrendingDown },
  { name: 'Compliance NR1', href: '/rh/compliance', icon: ShieldAlert },
  { name: 'Mapa de Equipes', href: '/rh/equipes', icon: Users },
  { name: 'Relatórios (Selo)', href: '/rh/relatorios', icon: BarChart3 },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarPrimitive className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-salvia font-semibold text-lg tracking-tight">
            <Leaf className="w-5 h-5" />
            Moviment
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Gestão de Saúde (B2B)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        end={item.href === '/rh'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent',
                          )
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent w-full text-left">
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarPrimitive>

      <SidebarInset className="bg-slate-50/50">
        <header className="h-16 border-b bg-background flex items-center px-6 shadow-sm z-10">
          <h1 className="font-medium text-lg">Painel de Diretoria & RH</h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
              RH
            </div>
          </div>
        </header>
        <main className="p-6 max-w-7xl mx-auto w-full">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
