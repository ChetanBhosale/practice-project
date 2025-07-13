'use client'
import { createContext, FC, ReactNode, useContext, useState, useEffect, useCallback } from 'react'
import { TUser, TCompany } from '@repo/common/types'
import { BACKEND_URL } from '../constants'
import { getMe, login as apiLogin, logout as apiLogout } from '../apis/authApis'
import axios from 'axios'

interface UserContextType {
    user: TUser | null
    activeCompany: TCompany | null
    token: string | null
    isLoading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    setUserData: (user: TUser | null, company: TCompany | null, token: string | null) => void
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
    user: null,
    activeCompany: null,
    token: null,
    isLoading: false,
    error: null,
    login: async () => { },
    setUserData: () => { },
    logout: async () => { },
    refreshUser: async () => { },
})

const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<TUser | null>(null)
    const [activeCompany, setActiveCompany] = useState<TCompany | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Initialize axios interceptors
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config
            },
            (error) => Promise.reject(error)
        )

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Auto-logout if 401 response
                    handleLogout()
                }
                return Promise.reject(error)
            }
        )

        return () => {
            axios.interceptors.request.eject(requestInterceptor)
            axios.interceptors.response.eject(responseInterceptor)
        }
    }, [token])

    // Initialize auth state
    const initializeAuth = useCallback(async () => {
        try {
            setIsLoading(true)
            const storedToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null
            console.log(storedToken)
            if (storedToken) {
                const response = await getMe(storedToken)
                setUser(response.data.user)
                setActiveCompany(response.data.activeCompany)
                setToken(storedToken)
            }
        } catch (err) {
            console.error('Auth initialization error:', err)
            handleLogout()
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    const handleLogin = async (email: string, password: string) => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await apiLogin({ email, password })
            console.log({ response })
            setUser(response.data.user)
            setActiveCompany(response.data.activeCompany == null ? response.data.activeCompany : null)
            setToken(response.data.token)
            localStorage.setItem('jwt_token', response.data.token)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            if (token) {
                await apiLogout(token)
            }
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            setUser(null)
            setActiveCompany(null)
            setToken(null)
            localStorage.removeItem('jwt_token')
        }
    }

    const handleRefreshUser = async () => {
        if (!token) return
        try {
            setIsLoading(true)
            const response = await getMe(token)
            setUser(response.data.user)
            setActiveCompany(response.data.activeCompany)
        } catch (err) {
            console.error('User refresh error:', err)
            handleLogout()
        } finally {
            setIsLoading(false)
        }
    }

    const setUserData = (user: TUser | null, company: TCompany | null, token: string | null) => {
        setUser(user)
        setActiveCompany(company)
        setToken(token)
        if (token) {
            localStorage.setItem('jwt_token', token)
        } else {
            localStorage.removeItem('jwt_token')
        }
    }

    return (
        <UserContext.Provider
            value={{
                user,
                activeCompany,
                token,
                isLoading,
                error,
                login: handleLogin,
                setUserData,
                logout: handleLogout,
                refreshUser: handleRefreshUser,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}

export default UserProvider