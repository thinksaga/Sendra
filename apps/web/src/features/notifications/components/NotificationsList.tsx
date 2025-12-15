
import { Notification, useMarkNotificationRead } from '../api/notifications';
import { cn } from '../../../lib/utils';
import { Bell, AlertTriangle, CheckCircle, Info, SearchX } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface NotificationsListProps {
    notifications: Notification[];
    isLoading: boolean;
    onItemClick?: () => void;
}

export const NotificationsList = ({ notifications, isLoading, onItemClick }: NotificationsListProps) => {
    const markReadMutation = useMarkNotificationRead();

    const handleItemClick = (n: Notification) => {
        if (!n.isRead) {
            markReadMutation.mutate(n.id);
        }
        if (onItemClick) onItemClick();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'ERROR': return <AlertTriangle className="h-4 w-4 text-red-500" />; // Or XCircle
            case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-green-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-gray-500">Loading activity...</div>;
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                <Bell className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No new notifications</p>
            </div>
        );
    }

    return (
        <div className="divide-y max-h-[400px] overflow-y-auto">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn(
                        "p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 relative",
                        !n.isRead ? "bg-blue-50/30" : "bg-white"
                    )}
                >
                    <div className="mt-1 flex-shrink-0">
                        {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className={cn("text-sm font-medium leading-none", !n.isRead && "text-blue-900")}>
                            {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400">
                            {new Date(n.createdAt).toLocaleString()}
                        </p>
                    </div>
                    {!n.isRead && (
                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                </div>
            ))}
        </div>
    );
};
