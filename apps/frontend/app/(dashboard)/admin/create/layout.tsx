import React, { ReactNode } from 'react'

const CreateLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div>
            {children}
        </div>
    )
}

export default CreateLayout