
import { useCampaigns, usePauseCampaign, useResumeCampaign, useDeleteCampaign, Campaign } from '../../features/campaigns/api/campaigns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Play, Pause, Trash2, Plus, Mail, Settings, Users } from 'lucide-react'; // Added Users
import { useNavigate } from 'react-router-dom';

export const CampaignList = () => {
    const navigate = useNavigate();
    const { data: campaigns, isLoading, error } = useCampaigns();

    const pauseMutation = usePauseCampaign();
    const resumeMutation = useResumeCampaign();
    const deleteMutation = useDeleteCampaign();

    const handleToggle = (campaign: Campaign) => {
        if (campaign.status === 'RUNNING') {
            pauseMutation.mutate(campaign.id);
        } else {
            resumeMutation.mutate(campaign.id);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RUNNING': return 'success';
            case 'PAUSED': return 'warning';
            case 'COMPLETED': return 'secondary';
            case 'ERROR': return 'destructive';
            default: return 'outline';
        }
    };

    if (isLoading) return <div className="p-8">Loading campaigns...</div>;
    if (error) return <div className="p-8 text-red-500">Error loading campaigns</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Campaigns</h1>
                <Button onClick={() => navigate('/campaigns/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                </Button>
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Daily Limit</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    No campaigns found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {campaigns?.map((campaign) => (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(campaign.status) as any}>
                                        {campaign.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{campaign.dailyLimit}</TableCell>
                                <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggle(campaign)}
                                        title={campaign.status === 'RUNNING' ? 'Pause' : 'Resume'}
                                    >
                                        {campaign.status === 'RUNNING' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => navigate(`/campaigns/${campaign.id}/sequence`)}
                                        title="Edit Sequence"
                                    >
                                        <Mail className="w-4 h-4" /> {/* Need to import Mail */}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => navigate(`/campaigns/${campaign.id}/leads`)}
                                        title="Manage Leads"
                                    >
                                        <Users className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => navigate(`/campaigns/${campaign.id}/settings`)} // Added Settings link too
                                        title="Settings"
                                    >
                                        <Settings className="w-4 h-4" /> {/* Need to import Settings */}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(campaign.id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
