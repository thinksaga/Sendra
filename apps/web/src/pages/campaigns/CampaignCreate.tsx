
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign } from '../../features/campaigns/api/campaigns';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft } from 'lucide-react';

export const CampaignCreate = () => {
    const navigate = useNavigate();
    const createMutation = useCreateCampaign();

    const [name, setName] = useState('');
    const [dailyLimit, setDailyLimit] = useState(100);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({ name, dailyLimit }, {
            onSuccess: (data) => {
                navigate(`/campaigns/${data.id}/settings`); // Go to settings after create
                // or go to list: navigate('/campaigns');
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate('/campaigns')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Q4 Outreach"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dailyLimit">Daily Send Limit</Label>
                            <Input
                                id="dailyLimit"
                                type="number"
                                min="1"
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                                required
                            />
                            <p className="text-sm text-gray-500">Max emails to send per 24 hours.</p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
