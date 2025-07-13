'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/context/UserContext'

interface QAMessage {
    id: string
    question: string
    answer: string
    companyId: string
    timestamp: Date
    isAnswered: boolean
}

const EmployeeDashboard = () => {
    const { activeCompany } = useUser()
    const [messages, setMessages] = useState<QAMessage[]>([
        {
            id: '1',
            question: 'How do I submit my timesheet?',
            answer: 'You can submit your timesheet through the HR portal under the "My Time" section.',
            companyId: activeCompany?._id || '',
            timestamp: new Date(Date.now() - 60000),
            isAnswered: true
        },
        {
            id: '2',
            question: 'What is our leave policy?',
            answer: '',
            companyId: activeCompany?._id || '',
            timestamp: new Date(Date.now() - 30000),
            isAnswered: false
        }
    ])
    const [inputValue, setInputValue] = useState('')

    const handleSendQuestion = () => {
        if (!inputValue.trim() || !activeCompany) return

        const newQuestion: QAMessage = {
            id: Date.now().toString(),
            question: inputValue,
            answer: '',
            companyId: activeCompany._id || '',
            timestamp: new Date(),
            isAnswered: false
        }

        setMessages(prev => [...prev, newQuestion])
        setInputValue('')

        // Simulate answer after delay
        setTimeout(() => {
            const possibleAnswers = [
                "Please check the employee handbook for this information.",
                "You can find this in the company portal under policies.",
                "The standard procedure is to submit a request through the HR system.",
                "This varies by department. Please check with your manager.",
                "That information is available in the onboarding documents you received."
            ]

            setMessages(prev => prev.map(msg =>
                msg.id === newQuestion.id
                    ? {
                        ...msg,
                        answer: possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)],
                        isAnswered: true
                    }
                    : msg
            ))
        }, 1500)
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b p-4">
                <h1 className="text-xl font-semibold">Company Q&A Portal</h1>
                {activeCompany && (
                    <p className="text-sm text-gray-600">
                        {activeCompany.name} • {activeCompany.address}
                    </p>
                )}
            </header>

            {/* Q&A Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.filter(msg => msg.companyId === activeCompany?._id).map((message) => (
                    <div key={message.id} className="space-y-2">
                        {/* Question */}
                        <div className="flex justify-end">
                            <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg bg-blue-500 text-white p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="bg-white text-blue-500">
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs opacity-80">
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>
                                <p className="font-medium">Q: {message.question}</p>
                            </div>
                        </div>

                        {/* Answer or Pending */}
                        {message.isAnswered ? (
                            <div className="flex justify-start">
                                <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg bg-white border p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="bg-green-500 text-white">
                                                <Bot className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-gray-500">
                                            {formatTime(message.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-gray-700">A: {message.answer}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-start">
                                <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg bg-gray-100 border p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                                        <span className="text-xs text-gray-500">
                                            Waiting for response...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="border-t bg-white p-4">
                <div className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask a question about company policies..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
                        className="flex-1"
                        disabled={!activeCompany}
                    />
                    <Button
                        onClick={handleSendQuestion}
                        disabled={!inputValue.trim() || !activeCompany}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Ask
                    </Button>
                </div>
                {!activeCompany && (
                    <p className="text-xs text-red-500 mt-2">
                        Please join a company to ask questions
                    </p>
                )}
            </div>
        </div>
    )
}

export default EmployeeDashboard