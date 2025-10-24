"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, LayoutDashboard, List, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: List },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={isActive(href) ? "default" : "ghost"}
                size="sm"
                className="transition-all duration-300 ease-out flex items-center gap-2"
                title={label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            </Link>
          ))}
        </div>

        <Link href="/add-transaction">
          <Button
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 ease-out"
            title="Add Transaction"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </nav>
  )
}
