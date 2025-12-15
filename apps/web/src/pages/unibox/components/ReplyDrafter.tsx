
import { useState } from 'react';
import { useGenerateReplyDraftAI } from '../../../features/ai/api/copilot';
import { Button } from '../../../components/ui/button';
import { Sparkles, Copy, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface ReplyDrafterProps {
    threadId: string;
}

export const ReplyDrafter = ({ threadId }: ReplyDrafterProps) => {
    const draftMutation = useGenerateReplyDraftAI();
    const [tone, setTone] = useState('Professional');
    const [draft, setDraft] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleGenerate = async () => {
        const data = await draftMutation.mutateAsync({ threadId, tone });
        setDraft(data.draft);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        // Could enable a toast Notification here
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="h-4 w-4" />
                Draft with AI Copilot
            </Button>
        );
    }

    return (
        <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-purple-900">
                    <Sparkles className="h-4 w-4" />
                    Copilot Assistant
                </h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400" onClick={() => setIsOpen(false)}>×</Button>
            </div>

            <div className="flex gap-2">
                <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-8 bg-white text-xs w-[130px]">
                        <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Friendly">Friendly</SelectItem>
                        <SelectItem value="Direct">Direct</SelectItem>
                        <SelectItem value="Empathetic">Empathetic</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={draftMutation.isPending}
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-xs"
                >
                    {draftMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    {draft ? 'Regenerate' : 'Generate Draft'}
                </Button>
            </div>

            {draftMutation.isError && (
                <div className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Failed to generate draft. Try again.
                </div>
            )}

            {draft && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="text-sm bg-white min-h-[120px] focus-visible:ring-purple-500 border-gray-200"
                        placeholder="AI Generated Draft..."
                    />
                    <div className="flex justify-end gap-2 text-xs text-gray-500">
                        <span className="flex items-center">
                            AI-Generated content. Review before sending.
                        </span>
                        <Button variant="secondary" size="sm" onClick={handleCopy} className="h-7 text-xs">
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
