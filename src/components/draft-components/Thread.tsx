import React from 'react'
import { Message } from './Message'

interface ThreadProps {
  messages: {
    content: string
    sender: string
    avatar: string
    replies?: {
      content: string
      sender: string
      avatar: string
      replies?: any[]
    }[]
  }[]
}

export const Thread: React.FC<ThreadProps> = ({ messages }) => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      {messages.map((message, index) => (
        <Message key={index} {...message} />
      ))}
    </div>
  )
}

