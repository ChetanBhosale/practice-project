'use client'
import React, { useState, useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import { getALlCompanies } from '@/apis/companyApi'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, ChevronDown } from 'lucide-react'

const Header = () => {
    const { user, activeCompany, logout, refreshUser } = useUser()
    const [companies, setCompanies] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // useEffect(() => {
    //     const fetchCompanies = async () => {
    //         if (user) {
    //             setLoading(true)
    //             try {
    //                 const response = await getALlCompanies()
    //                 setCompanies(response.data?.companies || [])
    //             } finally {
    //                 setLoading(false)
    //             }
    //         }
    //     }
    //     fetchCompanies()
    // }, [user])

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    const handleCompanyChange = async (companyId: string) => {
        const selectedCompany = companies.find(c => c.companyId === companyId)
        if (selectedCompany) {
            // Implement your company switching logic here
            console.log('Switching to company:', selectedCompany)
            await refreshUser() // Refresh user data after switch
        }
    }

    if (!user) return null

    return (
        <header className="border-b bg-white sticky top-0 z-10">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold">YourApp</h1>
                    </div>

                    {/* Company Selector */}
                    <div className="flex items-center space-x-4">
                        {activeCompany && (
                            <Select
                                value={activeCompany._id}
                                onValueChange={handleCompanyChange}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center p-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : (
                                        companies.map(company => (
                                            <SelectItem key={company.companyId} value={company.companyId}>
                                                {company.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}

                        {/* User Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8">
                                        {/* <AvatarImage src={user?. || ''} /> */}
                                        <AvatarFallback>
                                            {user?.name?.charAt(0) || user?.email?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:block">
                                        <div className="text-sm font-medium">{user?.name || user?.email}</div>
                                        <div className="text-xs text-gray-500 capitalize">
                                            {user?.role}
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header