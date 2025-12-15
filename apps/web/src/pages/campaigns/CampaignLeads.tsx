
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignLeads, useAddLeadsToCampaign, useRemoveLeadFromCampaign, CampaignLead } from '../../features/campaigns/api/campaign-leads';
import { useCampaign } from '../../features/campaigns/api/campaigns';
import { useLeads } from '../../features/leads/api/leads'; // For selection
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { ArrowLeft, UserPlus, Trash2, Users } from 'lucide-react';

export const CampaignLeads = () => {
    const { id: campaignId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Campaign Leads Data
    const [page, setPage] = useState(1);
    const { data: campaignLeadsData, isLoading: isTableLoading } = useCampaignLeads(campaignId!, page);
    const { data: campaign } = useCampaign(campaignId!);

    // Actions
    const addLeadsMutation = useAddLeadsToCampaign(campaignId!);
    const removeLeadMutation = useRemoveLeadFromCampaign(campaignId!);

    // Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    // Workspace Leads (for selection)
    const { data: allLeadsData, isLoading: isAllLeadsLoading } = useLeads(1, 100); // Fetch top 100 for V1 selection

    const handleToggleSelect = (leadId: string) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(leadId)) {
            newSelected.delete(leadId);
        } else {
            newSelected.add(leadId);
        }
        setSelectedLeads(newSelected);
    };

    const handleAddSubmit = async () => {
        if (selectedLeads.size === 0) return;
        try {
            await addLeadsMutation.mutateAsync(Array.from(selectedLeads));
            setIsAddOpen(false);
            setSelectedLeads(new Set());
            // Optionally show success toast
        } catch (error) {
            console.error(error);
            alert('Failed to add leads (or some were suppressed/duplicates)');
        }
    };

    const handleRemove = async (leadId: string) => {
        if (window.confirm('Remove this lead from the campaign?')) {
            await removeLeadMutation.mutateAsync(leadId);
        }
    };

    const leads = campaignLeadsData?.data || [];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" className="pl-0" onClick={() => navigate('/campaigns')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-xl font-bold">{campaign?.name} Leads</h1>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Leads
                </Button>
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Step</TableHead>
                            <TableHead>Last Sent</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isTableLoading && <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>}
                        {!isTableLoading && leads.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-gray-500">No leads in this campaign yet.</TableCell></TableRow>
                        )}
                        {leads.map((lead) => (
                            <TableRow key={lead.leadId || lead.id}>
                                <TableCell className="font-medium">{lead.email}</TableCell>
                                <TableCell><Badge variant="outline">{lead.status}</Badge></TableCell>
                                <TableCell>{lead.currentStep}</TableCell>
                                <TableCell>{lead.lastSentAt ? new Date(lead.lastSentAt).toLocaleDateString() : '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemove(lead.leadId || lead.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Add Leads Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Leads to Campaign</DialogTitle>
                    </DialogHeader>

                    <div className="h-96 overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Company</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isAllLeadsLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading leads...</TableCell></TableRow>}
                                {allLeadsData?.data?.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedLeads.has(lead.id)}
                                                onChange={() => handleToggleSelect(lead.id)}
                                            />
                                        </TableCell>
                                        <TableCell>{lead.email}</TableCell>
                                        <TableCell>{lead.firstName} {lead.lastName}</TableCell>
                                        <TableCell>{lead.company}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-gray-500">{selectedLeads.size} leads selected</span>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddSubmit} disabled={selectedLeads.size === 0 || addLeadsMutation.isPending}>
                                {addLeadsMutation.isPending ? 'Adding...' : 'Add Selected'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
