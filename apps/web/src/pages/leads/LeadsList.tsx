
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, useDeleteLead, useCreateLead, Lead } from '../../features/leads/api/leads';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Plus, Upload, Trash2, Pencil, Search } from 'lucide-react';

export const LeadsList = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const { data: leadsData, isLoading } = useLeads(page);
    const deleteMutation = useDeleteLead();
    const createMutation = useCreateLead();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newLead, setNewLead] = useState({ email: '', firstName: '', lastName: '', company: '' });

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this lead?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleCreate = async () => {
        if (!newLead.email) return;
        await createMutation.mutateAsync(newLead);
        setIsAddOpen(false);
        setNewLead({ email: '', firstName: '', lastName: '', company: '' });
    };

    const leads = leadsData?.data || [];
    const total = leadsData?.total || 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Leads</h1>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => navigate('/leads/import')}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </Button>
                    <Button onClick={() => setIsAddOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Lead
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>First Name</TableHead>
                            <TableHead>Last Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={6} className="text-center h-24">Loading leads...</TableCell></TableRow>}
                        {!isLoading && leads.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-gray-500">No leads found. Import some!</TableCell></TableRow>
                        )}
                        {leads.map((lead: Lead) => (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.email}</TableCell>
                                <TableCell>{lead.firstName || '-'}</TableCell>
                                <TableCell>{lead.lastName || '-'}</TableCell>
                                <TableCell>{lead.company || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{lead.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {/* Edit not implemented in this simplified list view to save complexity, focus on import */}
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(lead.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-end p-4 border-t">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-500">Page {page}</span>
                        {/* Basic Next logic assumed; ideally check total */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={leads.length < 50}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Lead</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" className="col-span-3" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} autoFocus />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="firstName" className="text-right">First Name</Label>
                            <Input id="firstName" className="col-span-3" value={newLead.firstName} onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastName" className="text-right">Last Name</Label>
                            <Input id="lastName" className="col-span-3" value={newLead.lastName} onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="company" className="text-right">Company</Label>
                            <Input id="company" className="col-span-3" value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Adding...' : 'Add Lead'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
