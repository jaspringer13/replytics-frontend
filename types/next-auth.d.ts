import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      onboardingStep: number
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    onboardingStep: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    onboardingStep: number
  }
}