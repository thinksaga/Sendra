import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaign, useUpdateCampaign } from '../../features/campaigns/api/campaigns';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch'; // Custom Switch
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CampaignExecution } from './CampaignExecution'; // Added
import { CampaignAIReview } from './components/CampaignAIReview'; // Added

export const CampaignSettings = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: campaign, isLoading } = useCampaign(id!);
    const updateMutation = useUpdateCampaign();

    const [formState, setFormState] = useState({
        name: '',
        dailyLimit: 100,
        stopOnReply: true // Example field, assume available in Model, or stored in metadata
    });

    useEffect(() => {
        if (campaign) {
            setFormState({
                name: campaign.name,
                dailyLimit: campaign.dailyLimit,
                stopOnReply: true // Default (or campaign.stopOnReply if exists in interface)
            });
        }
    }, [campaign]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({
            id: id!,
            data: {
                name: formState.name,
                dailyLimit: formState.dailyLimit
                // stopOnReply handled by backend logic or metadata
            }
        });
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!campaign) return <div>Campaign not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="pl-0" onClick={() => navigate('/campaigns')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaigns
                </Button>
            </div>

            {/* AI Review Panel */}
            <CampaignAIReview campaignId={id!} />

            {/* Execution Control Panel */}
            <CampaignExecution campaignId={id!} />

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name</Label>
                            <Input
                                id="name"
                                value={formState.name}
                                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dailyLimit">Daily Send Limit</Label>
                            <Input
                                id="dailyLimit"
                                type="number"
                                min="1"
                                value={formState.dailyLimit}
                                onChange={(e) => setFormState({ ...formState, dailyLimit: parseInt(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between border p-4 rounded-md">
                            <div className="space-y-0.5">
                                <Label className="text-base">Stop on Reply</Label>
                                <p className="text-sm text-gray-500">
                                    Automatically pause sequence when a prospect replies
                                </p>
                            </div>
                            <Switch
                                checked={formState.stopOnReply}
                                onChange={(e) => setFormState({ ...formState, stopOnReply: e.target.checked })}
                            />
                        </div>

                        <div className="flex justify-end pt-4 space-x-2">
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
