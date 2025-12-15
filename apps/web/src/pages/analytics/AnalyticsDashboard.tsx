
import { useState } from 'react';
import { useWorkspaceAnalytics, useCampaignsAnalytics } from '../../features/analytics/api/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Download, Calendar, Reply, Send, AlertTriangle, MousePointerClick } from 'lucide-react';

export const AnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

    const { data: summary, isLoading: isSummaryLoading } = useWorkspaceAnalytics(timeRange);
    const { data: campaigns, isLoading: isCampaignsLoading } = useCampaignsAnalytics(timeRange);

    const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${color}-500`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">Performance metrics for your outreach campaigns.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-md">
                    <Button
                        variant={timeRange === '7d' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTimeRange('7d')}
                        className="h-8"
                    >
                        Last 7 Days
                    </Button>
                    <Button
                        variant={timeRange === '30d' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTimeRange('30d')}
                        className="h-8"
                    >
                        Last 30 Days
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Sent"
                    value={summary?.totalSent || 0}
                    subtext="Emails sent successfully"
                    icon={Send}
                    color="blue"
                />
                <StatCard
                    title="Reply Rate"
                    value={`${summary?.replyRate || 0}%`}
                    subtext={`${summary?.totalReplies || 0} total replies`}
                    icon={Reply}
                    color="green"
                />
                <StatCard
                    title="Bounce Rate"
                    value={`${summary?.bounceRate || 0}%`}
                    subtext={`${summary?.totalBounces || 0} bounced`}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="Errors"
                    value={summary?.totalErrors || 0}
                    subtext="System or API errors"
                    icon={AlertTriangle}
                    color="yellow"
                />
            </div>

            {/* Campaign Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>Breakdown by campaign for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isCampaignsLoading && <div className="text-center py-8">Loading analytics...</div>}
                    {!isCampaignsLoading && campaigns?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No campaign data available for this period.</div>
                    )}
                    {campaigns && campaigns.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead className="text-right">Sent</TableHead>
                                    <TableHead className="text-right">Replies</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="w-[200px]">Visually</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((camp) => (
                                    <TableRow key={camp.campaignId}>
                                        <TableCell className="font-medium">
                                            {camp.campaignName}
                                            <div className="text-xs text-gray-400 uppercase">{camp.status}</div>
                                        </TableCell>
                                        <TableCell className="text-right">{camp.totalSent}</TableCell>
                                        <TableCell className="text-right">{camp.totalReplies}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            {camp.replyRate}%
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Progress value={camp.replyRate * 5} className="h-2 bg-green-100" indicatorClassName="bg-green-500" /> {/* *5 to scale vis visually if rates are low */}
                                                <p className="text-[10px] text-gray-400 text-right">Target 20%</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
