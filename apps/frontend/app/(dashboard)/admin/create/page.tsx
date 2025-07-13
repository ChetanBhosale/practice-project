'use client'
import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createCompany } from '@/apis/companyApi'
import { useUser } from '@/context/UserContext'
import { getMe } from '@/apis/authApis'

const CreateCompanyPage = () => {
    const { user, isLoading } = useUser()

    const [formData, setFormData] = useState({
        name: '',
        address: ''
    })
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createCompany(formData)
            let token = localStorage.getItem('jwt_token')
            alert('company created successfully!')
            if (token) {
                await getMe(token)
            }
            router.push('/admin/dashboard')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log(user)
        if (!isLoading && !user) {
            router.push('/')
        }
        else if (user && user.role != "ADMIN") {
            router.push('/')
        }
    }, [user, isLoading])


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-6">Create Company</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Company Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Company'}
                    </Button>
                </form>
            </div>
        </div>
    )
}

export default CreateCompanyPage