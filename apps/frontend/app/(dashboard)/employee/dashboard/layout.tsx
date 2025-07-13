import React, { ReactNode } from 'react'
import Header from '@/components/custom/Header'
const EmployeeLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div>
            <Header />
            {children}</div>
    )
}

export default EmployeeLayout