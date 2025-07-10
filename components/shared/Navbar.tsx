"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { Logo } from "@/components/shared/Logo"
import { Menu, X, Phone, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Logo className="h-6 transition-transform group-hover:scale-105" />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <ul className="flex items-center space-x-10">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm font-medium transition-all duration-200 hover:no-underline relative group",
                        isScrolled 
                          ? "text-gray-700 hover:text-primary" 
                          : "text-gray-900 hover:text-primary"
                      )}
                    >
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <Link href="/dashboard">
                  <Button className="h-10 px-6 bg-primary hover:bg-primary-600 text-white transition-all hover:scale-[1.02] hover:shadow-md">
                    Dashboard
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="h-10 px-6 text-gray-700 hover:text-primary hover:bg-gray-50"
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="h-10 px-6 bg-primary hover:bg-primary-600 text-white transition-all hover:scale-[1.02] hover:shadow-md group"
                    onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
                  >
                    <Sparkles className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                    Get Started Free
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className={cn(
                "flex md:hidden p-2 rounded-lg transition-colors",
                isScrolled ? "hover:bg-gray-100" : "hover:bg-white/10"
              )}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className={cn("h-6 w-6", isScrolled ? "text-gray-700" : "text-gray-900")} />
              ) : (
                <Menu className={cn("h-6 w-6", isScrolled ? "text-gray-700" : "text-gray-900")} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300 transform",
          isMobileMenuOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <Logo />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="font-medium">{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* CTA Section */}
            <div className="p-6 border-t bg-gray-50">
              {session ? (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-12 bg-primary hover:bg-primary-600 text-white">
                    Go to Dashboard
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full h-12"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signIn('google', { callbackUrl: '/dashboard' })
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="w-full h-12 bg-primary hover:bg-primary-600 text-white"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signIn('google', { callbackUrl: '/onboarding' })
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Started Free
                  </Button>
                </div>
              )}
              
              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t">
                <a
                  href="tel:1-800-REPLYTICS"
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>1-800-REPLYTICS</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}