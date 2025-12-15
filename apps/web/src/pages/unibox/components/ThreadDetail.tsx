import { Thread, useMarkThreadRead, useUpdateThreadStatus } from '../../../features/unibox/api/unibox';
import { Button } from '../../../components/ui/button';
import { Archive, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ReplyDrafter } from './ReplyDrafter';

interface ThreadDetailProps {
    thread: Thread | null | undefined;
    isLoading: boolean;
}

export const ThreadDetail = ({ thread, isLoading }: ThreadDetailProps) => {
    const markReadMutation = useMarkThreadRead();
    const statusMutation = useUpdateThreadStatus();

    if (isLoading) return <div className="flex h-full items-center justify-center">Loading conversation...</div>;
    if (!thread) return <div className="flex h-full items-center justify-center text-muted-foreground">Select a conversation to view</div>;

    const handleStatusChange = (status: string) => {
        statusMutation.mutate({ id: thread.id, status });
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold truncate max-w-md">{thread.subject}</h2>
                        <div className="text-sm text-gray-500">
                            {thread.leadEmail} • {thread.campaignName}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline" size="sm"
                        onClick={() => handleStatusChange('INTERESTED')}
                        className={thread.status === 'INTERESTED' ? 'bg-green-50 border-green-200' : ''}
                    >
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Interested
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        onClick={() => handleStatusChange('NOT_INTERESTED')}
                        className={thread.status === 'NOT_INTERESTED' ? 'bg-red-50 border-red-200' : ''}
                    >
                        <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                        Not Interested
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        onClick={() => handleStatusChange('LATER')}
                        className={thread.status === 'LATER' ? 'bg-yellow-50 border-yellow-200' : ''}
                    >
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                        Follow-up
                    </Button>
                    {thread.status !== 'ARCHIVED' && (
                        <Button variant="ghost" size="icon" onClick={() => handleStatusChange('ARCHIVED')}>
                            <Archive className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {(thread.messages || []).map((msg) => {
                    const isInbound = msg.direction === 'INBOUND';
                    return (
                        <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[75%] rounded-lg p-4 ${isInbound
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-blue-600 text-white'
                                }`}>
                                <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                    <span>{msg.from}</span>
                                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="whitespace-pre-wrap text-sm">{msg.body}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reply Area */}
            <div className="p-4 border-t bg-gray-50 space-y-4">
                <ReplyDrafter threadId={thread.id} />

                {/* Fallback mock manual reply box if not using AI */}
                {/* <div className="border rounded-md p-3 bg-white text-gray-400 text-sm cursor-not-allowed">
                    Manual reply sending coming soon...
                </div> */}
            </div>
        </div>
    );
};
