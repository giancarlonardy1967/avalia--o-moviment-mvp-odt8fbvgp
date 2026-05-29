import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)

  const loadNotifications = async () => {
    if (!user) return
    try {
      const records = await pb.collection('notifications').getList(1, 20, {
        filter: `user_id = '${user.id}'`,
        sort: '-created',
      })
      setNotifications(records.items)
      setUnread(records.items.filter((n) => !n.read).length)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  useRealtime(
    'notifications',
    () => {
      loadNotifications()
    },
    !!user,
  )

  const markAsRead = async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { read: true })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnread((prev) => Math.max(0, prev - 1))
    } catch (e) {
      console.error(e)
    }
  }

  if (!user) return null

  return (
    <Popover>
      <PopoverTrigger className="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <Bell className="w-5 h-5 text-slate-700" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Notificações</h3>
          {unread > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {unread} novas
            </span>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <Bell className="w-8 h-8 text-slate-300" />
              Nenhuma notificação no momento
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    !n.read ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <p
                    className={`text-sm ${
                      !n.read ? 'font-medium text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {n.message}
                  </p>
                  <span className="text-xs text-slate-400 mt-2 block font-medium">
                    {new Date(n.created).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
