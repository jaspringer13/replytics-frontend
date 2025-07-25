"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Loader2, Check, X, Eye, EyeOff } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { validatePassword, getPasswordStrength } from "@/lib/auth-utils"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<typeof validatePassword>>({ isValid: false, errors: [] })
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof getPasswordStrength>>({ score: 0, label: 'Very Weak', color: 'text-red-500' })

  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password))
      setPasswordStrength(getPasswordStrength(password))
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate passwords
    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (!passwordValidation.isValid) {
      setError("Please meet all password requirements")
      return
    }
    
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Show success
    setIsSuccess(true)
    setIsLoading(false)
    
    // Redirect after 2 seconds
    setTimeout(() => {
      router.push("/auth/signin")
    }, 2000)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 md:p-10 text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-green-400" />
                </motion.div>
              </div>

              {/* Success Message */}
              <h1 className="text-2xl font-bold text-white mb-2">
                Password Reset Successful
              </h1>
              <p className="text-gray-400 mb-4">
                Your password has been successfully reset.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to sign in...
              </p>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 md:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/25">
                <span className="text-4xl font-bold text-white">R</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Create New Password
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Enter your new password below
            </p>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4"
              >
                {error}
              </motion.div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password Strength</span>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        className={`h-full ${
                          passwordStrength.score <= 1 ? 'bg-red-500' :
                          passwordStrength.score <= 2 ? 'bg-orange-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' :
                          passwordStrength.score <= 4 ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center text-xs ${password.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                    {password.length >= 8 ? (
                      <Check className="w-3 h-3 mr-2" />
                    ) : (
                      <X className="w-3 h-3 mr-2" />
                    )}
                    At least 8 characters
                  </li>
                  <li className={`flex items-center text-xs ${/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-400'}`}>
                    {/[a-z]/.test(password) ? (
                      <Check className="w-3 h-3 mr-2" />
                    ) : (
                      <X className="w-3 h-3 mr-2" />
                    )}
                    One lowercase letter
                  </li>
                  <li className={`flex items-center text-xs ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}`}>
                    {/[A-Z]/.test(password) ? (
                      <Check className="w-3 h-3 mr-2" />
                    ) : (
                      <X className="w-3 h-3 mr-2" />
                    )}
                    One uppercase letter
                  </li>
                  <li className={`flex items-center text-xs ${/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-400'}`}>
                    {/[0-9]/.test(password) ? (
                      <Check className="w-3 h-3 mr-2" />
                    ) : (
                      <X className="w-3 h-3 mr-2" />
                    )}
                    One number
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-400 to-brand-600 text-white font-medium rounded-lg hover:from-brand-500 hover:to-brand-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>

            {/* Back to Sign In */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Remember your password?{" "}
              <Link
                href="/auth/signin"
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                Back to Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}