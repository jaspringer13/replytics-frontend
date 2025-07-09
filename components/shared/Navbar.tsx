"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { Logo } from "@/components/shared/Logo"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-white shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/pricing"
              className={cn(
                "font-medium transition-colors hover:no-underline",
                isScrolled ? "text-gray-700 hover:text-primary" : "text-white hover:text-white/80"
              )}
            >
              Pricing
            </Link>
          </nav>

          <div className="hidden md:flex items-center">
            {session ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <Link href="/api/auth/signin">
                <Button size="lg">Get Started Free</Button>
              </Link>
            )}
          </div>

          <button
            className="flex md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={isScrolled ? "text-gray-700" : "text-white"} size={24} />
            ) : (
              <Menu className={isScrolled ? "text-gray-700" : "text-white"} size={24} />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-primary font-medium hover:no-underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              {session ? (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/api/auth/signin">
                  <Button className="w-full" size="lg">Get Started Free</Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}