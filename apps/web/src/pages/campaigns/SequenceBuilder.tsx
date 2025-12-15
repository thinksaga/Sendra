
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignSteps, useAddStep, useDeleteStep, useUpdateStep, useReorderSteps, CampaignStep } from '../../features/campaigns/api/steps';
import { useCampaign } from '../../features/campaigns/api/campaigns';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save, X } from 'lucide-react';

export const SequenceBuilder = () => {
    const { id: campaignId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: campaign } = useCampaign(campaignId!);
    const { data: steps, isLoading } = useCampaignSteps(campaignId!);

    const addMutation = useAddStep(campaignId!);
    const deleteMutation = useDeleteStep(campaignId!);
    const updateMutation = useUpdateStep(campaignId!);
    const reorderMutation = useReorderSteps(campaignId!);

    const [isAdding, setIsAdding] = useState(false);
    const [editingStepId, setEditingStepId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({ subject: '', content: '', waitDays: 1 });

    const handleAddClick = () => {
        setFormData({ subject: '', content: '', waitDays: 1 });
        setIsAdding(true);
        setEditingStepId(null);
    };

    const handleEditClick = (step: CampaignStep) => {
        setFormData({ subject: step.subject, content: step.content, waitDays: step.waitDays });
        setEditingStepId(step.id);
        setIsAdding(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingStepId(null);
    };

    const handleSave = async () => {
        if (!formData.subject || !formData.content) return; // Basic validation

        if (isAdding) {
            await addMutation.mutateAsync({ ...formData });
        } else if (editingStepId) {
            await updateMutation.mutateAsync({ stepId: editingStepId, data: formData });
        }
        handleCancel();
    };

    const handleDelete = async (stepId: string) => {
        if (window.confirm('Delete this step?')) {
            await deleteMutation.mutateAsync(stepId);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (!steps) return;
        const newSteps = [...steps];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        if (swapIndex < 0 || swapIndex >= newSteps.length) return;

        // Swap locally for optimistic or just re-calc orders
        [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];

        // Prepare API payload: Update ALL orders based on new index
        const reorderPayload = newSteps.map((s, idx) => ({ id: s.id, order: idx }));
        await reorderMutation.mutateAsync(reorderPayload);
    };


    if (isLoading) return <div>Loading steps...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" className="pl-0" onClick={() => navigate(`/campaigns/${campaignId}/settings`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Settings
                </Button>
                <h1 className="text-xl font-bold">{campaign?.name} Sequence</h1>
            </div>

            <div className="space-y-4">
                {steps?.map((step, index) => (
                    <Card key={step.id} className={`border ${editingStepId === step.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}>
                        <CardHeader className="py-4 bg-gray-50/50 flex flex-row items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Badge variant="secondary" className="h-6 w-6 flex items-center justify-center rounded-full p-0">
                                    {index + 1}
                                </Badge>
                                <span className="text-sm font-medium text-gray-500">
                                    Wait {step.waitDays} day{step.waitDays !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => handleMove(index, 'up')}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" disabled={index === (steps.length - 1)} onClick={() => handleMove(index, 'down')}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(step.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4">
                            {editingStepId === step.id ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Subject</Label>
                                        <Input
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Body</Label>
                                        <Textarea
                                            className="min-h-[200px]"
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <Label>Wait Days</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.waitDays}
                                            onChange={(e) => setFormData({ ...formData, waitDays: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button variant="outline" onClick={handleCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                                        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleEditClick(step)}>
                                    <h3 className="font-semibold text-lg mb-2">{step.subject}</h3>
                                    <p className="text-gray-600 whitespace-pre-wrap line-clamp-3">{step.content}</p>
                                    <p className="text-xs text-blue-600 mt-2">Click to edit</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* ADD NEW STEP BLOCK */}
                {isAdding ? (
                    <Card className="border-2 border-dashed border-gray-300">
                        <CardHeader><CardTitle>New Step</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Subject</Label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label>Body</Label>
                                <Textarea
                                    className="min-h-[200px]"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="w-32">
                                <Label>Wait Days</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.waitDays}
                                    onChange={(e) => setFormData({ ...formData, waitDays: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={handleSave}>Add Step</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full border-dashed h-16 text-gray-500 hover:text-gray-900 hover:border-gray-400"
                        onClick={handleAddClick}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Step
                    </Button>
                )}
            </div>
        </div>
    );
};
