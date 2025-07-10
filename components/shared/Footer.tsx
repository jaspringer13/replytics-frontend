import Link from 'next/link'
import { 
  Twitter, Facebook, Linkedin, Instagram, Youtube,
  Phone, Calendar, MessageSquare, Zap, BarChart3, Shield
} from 'lucide-react'

const features = [
  { name: '24/7 Call Answering', icon: Phone, href: '#' },
  { name: 'Smart Scheduling', icon: Calendar, href: '#' },
  { name: 'Natural Conversations', icon: MessageSquare, href: '#' },
  { name: 'Instant Response', icon: Zap, href: '#' },
  { name: 'Call Analytics', icon: BarChart3, href: '#' },
  { name: 'Intelligent Memory', icon: Shield, href: '#' }
]

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/replytics' },
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/replytics' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/replytics' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/replytics' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@replytics' }
]

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Replytics</h3>
            <p className="text-gray-400 text-sm mb-4">
              The AI receptionist that remembers every client and never misses a call.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 hover:text-brand-400 transition-all duration-200 group"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5 text-gray-400 group-hover:text-brand-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature.name}>
                  <Link 
                    href={feature.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                  >
                    <feature.icon className="w-4 h-4" />
                    {feature.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Business</h4>
            <ul className="space-y-2">
              <li><Link href="/businesses/barbers" className="text-gray-400 hover:text-white text-sm transition-colors">Barbers</Link></li>
              <li><Link href="/businesses/beauty-salons" className="text-gray-400 hover:text-white text-sm transition-colors">Beauty Salons</Link></li>
              <li><Link href="/businesses/nail-salons" className="text-gray-400 hover:text-white text-sm transition-colors">Nail Salons</Link></li>
              <li><Link href="/businesses/tattoo" className="text-gray-400 hover:text-white text-sm transition-colors">Tattoo Studios</Link></li>
              <li><Link href="/businesses/massage-wellness" className="text-gray-400 hover:text-white text-sm transition-colors">Massage & Wellness</Link></li>
              <li><Link href="/enterprise" className="text-gray-400 hover:text-white text-sm transition-colors">Enterprise</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
              <li><Link href="/sms-opt-in" className="text-gray-400 hover:text-white text-sm transition-colors">SMS Opt-In</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 Replytics. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/transparency" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                Transparency in Coverage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}