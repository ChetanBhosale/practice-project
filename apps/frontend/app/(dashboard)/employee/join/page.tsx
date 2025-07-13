'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { searchCompanies, joinCompany } from '@/apis/companyApi'
import { useUser } from '@/context/UserContext'
import { getMe } from '@/apis/authApis'

const CompanySearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState<any[]>([])
    const router = useRouter()
    const { activeCompany } = useUser()

    useEffect(() => {
        if (activeCompany) {
            router.push('/employee/dashboard')
        }
    }, [activeCompany, router])

    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout
        return (...args: any[]) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => func(...args), delay)
        }
    }

    const handleSearch = useCallback(debounce(async (term: string) => {
        if (!term.trim()) {
            setCompanies([])
            return
        }
        setLoading(true)
        try {
            const response = await searchCompanies(term)
            console.log(response)
            setCompanies(response?.data?.results || [])
        } catch (error) {
            setCompanies([])
        } finally {
            setLoading(false)
        }
    }, 300), [])

    useEffect(() => {
        handleSearch(searchTerm)
    }, [searchTerm, handleSearch])


    const { user, isLoading } = useUser()
    useEffect(() => {
        console.log(user)
        if (!isLoading && !user) {
            router.push('/')
        } else if (user && user.role !== "EMPLOYEE") {
            router.push('/')
        }
    }, [user, isLoading])

    const handleJoinCompany = async (companyId: string) => {
        setLoading(true)
        try {
            const response = await joinCompany(companyId)
            let token = localStorage.getItem('jwt_token')
            alert('congratulations you joined your first company')
            if (token) {
                await getMe(token)
            }
            if (response) {
                router.push('/employee/dashboard')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Button onClick={() => router.back()}>Back</Button>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Search Companies</h1>
                <div className="mb-8">
                    <Input
                        placeholder="Search by company name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                    />
                </div>

                {searchTerm && (
                    <div className="space-y-4">
                        {companies.length > 0 ? (
                            companies.map((company) => (
                                <div
                                    key={company._id}
                                    className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <h3 className="font-medium">{company.name}</h3>
                                        <p className="text-sm text-gray-600">{company.address}</p>
                                        {company.createdAt && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(company.createdAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => handleJoinCompany(company._id)}
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap"
                                        disabled={loading}
                                    >
                                        {loading ? 'Joining...' : 'Join Company'}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                {loading ? 'Searching...' : `No companies found matching "${searchTerm}"`}
                            </div>
                        )}
                    </div>
                )}
                <div className="my-8 border-t" />
            </div>
        </div>
    )
}

export default CompanySearchPage