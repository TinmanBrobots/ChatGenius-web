"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="container relative mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute right-4 top-4"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <div className="flex items-center justify-center h-[400px] border rounded-lg bg-muted/50">
            <p className="text-lg text-muted-foreground">To be implemented in a future version</p>
          </div>
        </TabsContent>
        <TabsContent value="account" className="mt-6">
          <div className="flex items-center justify-center h-[400px] border rounded-lg bg-muted/50">
            <p className="text-lg text-muted-foreground">To be implemented in a future version</p>
          </div>
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
          <div className="flex items-center justify-center h-[400px] border rounded-lg bg-muted/50">
            <p className="text-lg text-muted-foreground">To be implemented in a future version</p>
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <div className="flex items-center justify-center h-[400px] border rounded-lg bg-muted/50">
            <p className="text-lg text-muted-foreground">To be implemented in a future version</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 