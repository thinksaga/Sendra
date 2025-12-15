import { useNotifications, useMarkAllNotificationsRead } from '../../features/notifications/api/notifications';
import { NotificationsList } from '../../features/notifications/components/NotificationsList';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { CheckCheck, History } from 'lucide-react';

export const ActivityFeed = () => {
    // Fetch more for the full page
    const { data, isLoading } = useNotifications(1, 50);
    const markAllReadMutation = useMarkAllNotificationsRead();

    const notifications = data?.data || [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
                    <p className="text-muted-foreground">Recent alerts, updates, and system events.</p>
                </div>
                <Button variant="outline" onClick={() => markAllReadMutation.mutate()}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-500" />
                        Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <NotificationsList
                        notifications={notifications}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
};
