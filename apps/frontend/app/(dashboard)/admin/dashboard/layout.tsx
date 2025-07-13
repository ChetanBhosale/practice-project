import Header from '@/components/custom/Header'
import React, { ReactNode } from 'react'

const AdminDashboardLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div>
            <Header />
            {children}
        </div>
    )
}

export default AdminDashboardLayout