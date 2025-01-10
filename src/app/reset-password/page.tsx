"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const AUTH_TOKEN_KEY = `sb-${process.env.NEXT_PUBLIC_SUPABASE_NAME}-auth-token`

export default function ResetPasswordPage() {
	const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams?.get('type')

    if (type === 'recovery') {
      // Set the session using the recovery token
      supabase.auth.getSession().then(({ data: { session } }) => {
				const auth_token = JSON.parse(localStorage.getItem(AUTH_TOKEN_KEY) || '{}')?.access_token
				setToken(auth_token)
        if (!session) {
          // If no session exists, verify the recovery token
          supabase.auth.verifyOtp({
            token_hash: auth_token,
            type: 'recovery'
          }).catch((error) => {
            console.error('Error verifying recovery token:', error)
            setError('Invalid or expired recovery link. Please request a new password reset.')
          })
        }
      })
    } else {
      // No valid recovery token found
      setError('Invalid recovery link. Please request a new password reset.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // Sign out after successful password update
      await supabase.auth.signOut()
      
      router.push('/login?message=Password updated successfully')
    } catch (error: any) {
      console.error('Error updating password:', error)
      setError(error.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password">New Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={isLoading || !token} className="w-full">
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 