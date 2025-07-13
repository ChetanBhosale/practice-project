'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from '@/context/UserContext'
import { register, verifyOtp, login } from '@/apis/authApis'

const AuthPage = () => {
  const router = useRouter()
  const {
    user,
    isLoading: contextLoading,
    error: contextError,
    login: contextLogin,
    activeCompany,
    logout,
  } = useUser()

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [otpStep, setOtpStep] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE'
  })

  const [otpForm, setOtpForm] = useState({
    email: '',
    otp: ''
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !contextLoading) {
      // const redirectPath = user.role === 'ADMIN'
      //   ? '/admin/dashboard'
      //   : '/employee/dashboard'
      // router.push(redirectPath)
    }
  }, [user, contextLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      await contextLogin(loginForm.email, loginForm.password)
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setFormLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      if (registerForm.password !== registerForm.confirmPassword) {
        throw new Error("Passwords don't match")
      }

      const response = await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role,
        confirmPassword: registerForm.confirmPassword
      })

      // On successful registration
      setOtpForm({
        email: registerForm.email,
        otp: ''
      })
      setOtpStep(true)
      setRegistrationSuccess(true)
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setFormLoading(false)
    }
  }

  console.log(activeCompany)
  function handleVerification() {
    if (user) {
      if (activeCompany) {
        const redirectPath = user.role === 'ADMIN'
          ? '/admin/dashboard'
          : '/employee/dashboard'
        router.push(redirectPath)
      } else {
        const redirectPath = user.role === "ADMIN" ? 'admin/create' : 'employee/join'
        router.push(redirectPath)
      }

    }

  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      // Verify OTP with the API
      const response = await verifyOtp({
        email: otpForm.email,
        otp: otpForm.otp
      })

      // On successful verification
      setRegistrationSuccess(false)
      setOtpStep(false)
      setActiveTab('login')

      // Show success message
      setFormError(null)
      alert('Email verified successfully! Please login.')
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'OTP verification failed')
    } finally {
      setFormLoading(false)
    }
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (user && !contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">You're already logged in</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Welcome, {user.name}</p>
            <Button
              onClick={handleVerification}
              className="w-full mb-2"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {otpStep ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {registrationSuccess ? 'Verify Your Email' : 'Enter OTP Code'}
              </CardTitle>
              {registrationSuccess && (
                <p className="text-sm text-center text-muted-foreground">
                  We've sent a verification code to {otpForm.email}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {(formError || contextError) && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError || contextError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={otpForm.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit code"
                    value={otpForm.otp}
                    onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Email
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-sm text-center text-muted-foreground">
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setOtpStep(false)
                  setRegistrationSuccess(false)
                }}
              >
                Back to registration
              </button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Sign in to your account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {(formError || contextError) && (
                      <Alert variant="destructive">
                        <AlertDescription>{formError || contextError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={formLoading}>
                      {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Registration Form */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Create new account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    {(formError || contextError) && (
                      <Alert variant="destructive">
                        <AlertDescription>{formError || contextError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={registerForm.role}
                        onValueChange={(value) => setRegisterForm({ ...registerForm, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={formLoading}>
                      {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="text-sm text-center text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setActiveTab('login')}
                  >
                    Sign in
                  </button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default AuthPage