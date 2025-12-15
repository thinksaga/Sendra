
import { useState } from 'react';
import { useNotifications, useMarkAllNotificationsRead } from '../features/notifications/api/notifications';
import { NotificationsList } from '../features/notifications/components/NotificationsList';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Button } from '../components/ui/button';
import { Bell, Check } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';

export const NotificationsDropdown = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { data, isLoading } = useNotifications(1, 10);
    const markAllReadMutation = useMarkAllNotificationsRead();

    const notifications = data?.data || [];
    const unreadCount = data?.unreadCount || 0;

    const handleViewAll = () => {
        setOpen(false);
        navigate('/activity');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-500" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => markAllReadMutation.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <NotificationsList
                    notifications={notifications}
                    isLoading={isLoading}
                    onItemClick={() => { }}
                />

                <div className="p-2 border-t bg-gray-50">
                    <Button variant="ghost" className="w-full text-xs" onClick={handleViewAll}>
                        View Activity Feed
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
