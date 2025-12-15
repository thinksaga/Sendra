
import { useState } from 'react';
import { useCampaign, useStartCampaign, usePauseCampaign, useResumeCampaign } from '../../features/campaigns/api/campaigns';
import { useCampaignLeads } from '../../features/campaigns/api/campaign-leads';
import { useCampaignSteps } from '../../features/campaigns/api/steps';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Play, Pause, AlertTriangle, Zap, CheckCircle } from 'lucide-react';

interface CampaignExecutionProps {
    campaignId: string;
}

export const CampaignExecution = ({ campaignId }: CampaignExecutionProps) => {
    // 5s Polling for status updates
    const { data: campaign, isLoading } = useCampaign(campaignId);
    const { data: leadsData } = useCampaignLeads(campaignId, 1);
    const { data: steps } = useCampaignSteps(campaignId);

    const startMutation = useStartCampaign();
    const pauseMutation = usePauseCampaign();
    const resumeMutation = useResumeCampaign();

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    if (isLoading || !campaign) return <div>Loading status...</div>;

    const leadsCount = leadsData?.total || 0;
    const stepsCount = steps?.length || 0;
    const isRunning = campaign.status === 'RUNNING';
    const isDraft = campaign.status === 'DRAFT';
    const isPaused = campaign.status === 'PAUSED';
    const isCompleted = campaign.status === 'COMPLETED';

    const handleStartClick = () => {
        setIsConfirmOpen(true);
    };

    const confirmStart = async () => {
        if (isDraft) {
            await startMutation.mutateAsync(campaignId);
        } else {
            await resumeMutation.mutateAsync(campaignId);
        }
        setIsConfirmOpen(false);
    };

    const handlePause = async () => {
        await pauseMutation.mutateAsync(campaignId);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'RUNNING': return 'success';
            case 'PAUSED': return 'warning';
            case 'COMPLETED': return 'secondary';
            case 'ERROR': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500 fill-blue-100" />
                        Execution Control
                    </CardTitle>
                    <Badge variant={getStatusVariant(campaign.status) as any} className="text-sm px-3 py-1">
                        {campaign.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-gray-50 p-3 rounded-md">
                        <span className="block text-gray-500 mb-1">Total Leads</span>
                        <span className="font-semibold text-lg">{leadsCount}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <span className="block text-gray-500 mb-1">Steps</span>
                        <span className="font-semibold text-lg">{stepsCount}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <span className="block text-gray-500 mb-1">Daily Limit</span>
                        <span className="font-semibold text-lg">{campaign.dailyLimit}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <span className="block text-gray-500 mb-1">Sent Today</span>
                        {/* Mock or use additional metric endpoint */}
                        <span className="font-semibold text-lg">{campaign._count?.sent || 0}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    {!isRunning && !isCompleted && (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleStartClick}
                            disabled={startMutation.isPending || resumeMutation.isPending}
                        >
                            <Play className="mr-2 h-4 w-4" />
                            {isPaused ? 'Resume Campaign' : 'Start Campaign'}
                        </Button>
                    )}

                    {isRunning && (
                        <Button
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                            onClick={handlePause}
                            disabled={pauseMutation.isPending}
                        >
                            <Pause className="mr-2 h-4 w-4" />
                            Pause Campaign
                        </Button>
                    )}
                </div>
            </CardContent>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Start Campaign</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-md text-blue-800">
                            <CheckCircle className="h-5 w-5" />
                            <div>
                                <p className="font-semibold">Ready to Launch?</p>
                                <p className="text-sm">We will start enrolling {leadsCount} leads into {stepsCount} steps.</p>
                            </div>
                        </div>

                        <div className="text-sm space-y-2 text-gray-600">
                            <p>• Daily Limit: <strong>{campaign.dailyLimit} emails</strong></p>
                            <p>• Sending will start immediately.</p>
                            <p>• Suppression rules are active.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={confirmStart} className="bg-green-600 hover:bg-green-700">
                            Yes, Start Sending
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
