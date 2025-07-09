import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers/SessionProvider"
import "@/styles/globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "Replytics - Your AI Receptionist Never Takes a Day Off",
  description: "Let Replytics answer calls, book appointments, and grow your business 24/7. AI-powered phone receptionist for service businesses.",
  metadataBase: new URL("https://www.replytics.ai"),
  openGraph: {
    title: "Replytics - Your AI Receptionist Never Takes a Day Off",
    description: "Let Replytics answer calls, book appointments, and grow your business 24/7.",
    url: "https://www.replytics.ai",
    siteName: "Replytics",
    locale: "en_US",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}