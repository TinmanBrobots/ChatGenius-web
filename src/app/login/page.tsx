"use client"

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setWarning('')
    setIsLoading(true)
    try {
      await login.mutateAsync({ email, password })
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response?.data?.error?.includes('Email not confirmed')) {
        setWarning('Please verify your email before logging in. Check your inbox for the verification link.')
      } else {
        setError('Invalid email or password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {warning && (
            <Alert className="mb-4 border-orange-600" variant="default">
              <AlertDescription className="text-orange-600">{warning}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="mt-2 text-center text-sm">
              <Link href="/forgot-password" className="text-primary">
                Forgot your password?
              </Link>
            </p>
          </form>
          <p className="mt-4 text-center">
            Don't have an account? <Link href="/register" className="text-primary">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

