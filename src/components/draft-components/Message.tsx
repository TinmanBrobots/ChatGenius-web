import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface MessageProps {
  content: string
  sender: string
  avatar: string
  replies?: MessageProps[]
}

export const Message: React.FC<MessageProps> = ({ content, sender, avatar, replies = [] }) => {
  return (
    <div className="mb-4">
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar>
              <AvatarImage src={avatar} alt={sender} />
              <AvatarFallback>{sender[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{sender}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {replies.length > 0 && (
        <div className="ml-8 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          {replies.map((reply, index) => (
            <Message key={index} {...reply} />
          ))}
        </div>
      )}
    </div>
  )
}

