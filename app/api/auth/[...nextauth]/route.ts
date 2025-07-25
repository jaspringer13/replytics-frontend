import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-config"

// Debug session creation
if (process.env.NODE_ENV === 'development') {
  console.debug('[NextAuth] Route handler initialized')
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }