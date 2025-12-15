
import { useNavigate, useParams } from 'react-router-dom';
import { Thread } from '../../../features/unibox/api/unibox';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/badge';
import { formatDistanceToNow } from 'date-fns'; // Assumption: date-fns installed or use native

// Fallback date formatter if date-fns not available, reusing standard JS
const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Show time if today
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // Show date otherwise
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
        return '';
    }
};

interface ThreadListProps {
    threads: Thread[];
    isLoading: boolean;
    selectedId?: string;
}

export const ThreadList = ({ threads, isLoading, selectedId }: ThreadListProps) => {
    const navigate = useNavigate();

    if (isLoading) {
        return <div className="p-4 text-center text-gray-500">Loading threads...</div>;
    }

    if (threads.length === 0) {
        return <div className="p-8 text-center text-gray-500">No messages found.</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => (
                <div
                    key={thread.id}
                    onClick={() => navigate(`/ inbox / ${thread.id} `)}
                    className={cn(
                        "flex flex-col gap-2 p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedId === thread.id ? "bg-muted" : "bg-white",
                        !thread.isRead ? "font-semibold bg-blue-50/50" : ""
                    )}
                >
                    <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center">
                            <div className="flex items-center gap-2">
                                <div className="font-semibold">{thread.leadEmail}</div>
                                {!thread.isRead && <span className="flex h-2 w-2 rounded-full bg-blue-600" />}
                            </div>
                            <div className={cn("ml-auto text-xs", selectedId === thread.id ? "text-foreground" : "text-muted-foreground")}>
                                {formatDate(thread.lastMessageAt)}
                            </div>
                        </div>
                        <div className="text-xs font-medium">{thread.subject}</div>
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                        {thread.snippet}
                    </div>
                    <div className="flex items-center gap-2">
                        {thread.status !== 'OPEN' && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1">{thread.status}</Badge>
                        )}
                        {thread.campaignName && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1 max-w-[100px] truncate">{thread.campaignName}</Badge>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
