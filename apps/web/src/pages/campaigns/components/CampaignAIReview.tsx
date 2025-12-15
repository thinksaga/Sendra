
import { useState } from 'react';
import { useReviewCampaignAI, AIReviewResult } from '../../../features/ai/api/copilot';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Sparkles, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface CampaignAIReviewProps {
    campaignId: string;
}

export const CampaignAIReview = ({ campaignId }: CampaignAIReviewProps) => {
    const reviewMutation = useReviewCampaignAI();
    const [result, setResult] = useState<AIReviewResult | null>(null);

    const handleReview = async () => {
        const data = await reviewMutation.mutateAsync(campaignId);
        setResult(data);
    };

    if (!result && !reviewMutation.isPending) {
        return (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-blue-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Sendra Copilot
                    </CardTitle>
                    <CardDescription>
                        Analyze your campaign configuration for spam risks and opportunities before launching.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleReview}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Review with AI
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (reviewMutation.isPending) {
        return (
            <Card className="border-blue-100">
                <CardContent className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    <div>
                        <h3 className="font-semibold text-lg">AI is reviewing your campaign...</h3>
                        <p className="text-sm text-gray-500">Checking spam filters, subject lines, and content balance.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (reviewMutation.isError) {
        return (
            <Card className="border-red-100 bg-red-50">
                <CardContent className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <p className="text-red-700 font-medium">Unable to complete review</p>
                    <p className="text-xs text-red-500">Please try again later. AI services may be busy.</p>
                    <Button variant="outline" size="sm" onClick={() => reviewMutation.reset()} className="mt-2">Try Again</Button>
                </CardContent>
            </Card>
        );
    }

    // Result View
    if (result) {
        return (
            <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            AI Review Results
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">Generated just now</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Spam Risk</span>
                                <span className={cn("font-bold", result.spamRiskScore > 50 ? "text-red-600" : "text-green-600")}>
                                    {result.spamRiskScore > 50 ? "High" : "Low"} ({result.spamRiskScore}%)
                                </span>
                            </div>
                            <Progress value={result.spamRiskScore} className="h-2" indicatorClassName={result.spamRiskScore > 50 ? "bg-red-500" : "bg-green-500"} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Personalization</span>
                                <span className="font-bold text-blue-600">{result.personalizationScore}%</span>
                            </div>
                            <Progress value={result.personalizationScore} className="h-2" indicatorClassName="bg-blue-500" />
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-md">
                            <span className="font-semibold block mb-1">Subject Line</span>
                            <p className="text-gray-700">{result.subjectLineFeedback}</p>
                        </div>

                        {result.deliverabilityWarnings.length > 0 ? (
                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                                <span className="font-semibold block mb-1 flex items-center gap-2 text-yellow-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    Warnings
                                </span>
                                <ul className="list-disc pl-5 space-y-1 text-yellow-800">
                                    {result.deliverabilityWarnings.map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="bg-green-50 p-3 rounded-md border border-green-100 flex items-center gap-2 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                No critical deliverability issues found.
                            </div>
                        )}

                        <div>
                            <span className="font-semibold block mb-1">Overall</span>
                            <p className="text-gray-600 italic">"{result.overallFeedback}"</p>
                        </div>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="w-full text-xs text-gray-400">
                        Close Analysis
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return null;
};
