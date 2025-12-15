
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useThreads, useThread } from '../../features/unibox/api/unibox';
import { ThreadList } from './components/ThreadList';
import { ThreadDetail } from './components/ThreadDetail';
import { Input } from '../../components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'; // Assuming Select generic from shadcn exists or I use native

// Using native select for simplicity if shadcn select is not fully set up in codebase contexts previously seen
// But let's try to use standard HTML select styled to avoid complex component deps if file missing

export const Unibox = () => {
    const { threadId } = useParams<{ threadId: string }>();
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState<string>('OPEN'); // Default to Open
    const { data: threadsData, isLoading: isThreadsLoading } = useThreads(statusFilter);
    const { data: selectedThread, isLoading: isThreadLoading } = useThread(threadId);

    const threads = threadsData?.data || [];

    // Simple status Tabs
    const statuses = [
        { label: 'Open', value: 'OPEN' },
        { label: 'Interested', value: 'INTERESTED' },
        { label: 'Follow-up', value: 'LATER' },
        { label: 'Uninterested', value: 'NOT_INTERESTED' },
        { label: 'Archived', value: 'ARCHIVED' },
        { label: 'All', value: '' }
    ];

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white border rounded-md shadow-sm m-4">
            {/* Left Panel: List */}
            <div className="w-[350px] flex flex-col border-r bg-gray-50/40">
                <div className="p-4 border-b space-y-3 bg-white">
                    <h1 className="text-xl font-bold px-1">Inbox</h1>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                        {statuses.map(s => (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(s.value)}
                                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap border ${statusFilter === s.value
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <ThreadList
                    threads={threads}
                    isLoading={isThreadsLoading}
                    selectedId={threadId}
                />
            </div>

            {/* Right Panel: Detail */}
            <div className="flex-1 flex flex-col bg-white">
                {threadId ? (
                    <ThreadDetail
                        thread={selectedThread}
                        isLoading={isThreadLoading}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground bg-gray-50">
                        <div className="text-center">
                            <h3 className="text-lg font-medium">Select a conversation</h3>
                            <p className="text-sm">Choose a thread from the list to view details.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
