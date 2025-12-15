
import { useEmailAccountHealth, useDomainHealth } from '../../features/deliverability/api/deliverability';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { AlertTriangle, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';

export const DeliverabilityDashboard = () => {
    const { data: accounts, isLoading: isAccountsLoading } = useEmailAccountHealth();
    const { data: domains, isLoading: isDomainsLoading } = useDomainHealth();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SAFE': return 'bg-green-500';
            case 'WARNING': return 'bg-yellow-500';
            case 'RISKY': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'SAFE': return 'default'; // dark/success usually
            case 'WARNING': return 'secondary'; // or custom warning style
            case 'RISKY': return 'destructive';
            default: return 'outline';
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'SAFE': return <ShieldCheck className="h-4 w-4 text-green-600" />;
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'RISKY': return <ShieldAlert className="h-4 w-4 text-red-600" />;
            default: return <Activity className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Deliverability Health</h1>
                    <p className="text-muted-foreground">Monitor your inbox and domain reputation to ensure high placement.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Email Accounts Health */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Email Accounts
                        </CardTitle>
                        <CardDescription>Health status of connected sending accounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isAccountsLoading && <div className="text-center py-4">Loading accounts...</div>}
                        {!isAccountsLoading && (!accounts || accounts.length === 0) && (
                            <div className="text-center py-4 text-muted-foreground">No email accounts connected.</div>
                        )}
                        <div className="space-y-6">
                            {accounts?.map((acc) => (
                                <div key={acc.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <StatusIcon status={acc.status} />
                                            <span className="font-medium">{acc.email}</span>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(acc.status) as any}>{acc.status}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Progress
                                            value={acc.score}
                                            className="h-2"
                                            indicatorClassName={getStatusColor(acc.status)}
                                        />
                                        <span className="text-sm font-bold w-8 text-right">{acc.score}%</span>
                                    </div>
                                    {acc.reasons.length > 0 && (
                                        <div className="text-xs text-red-500 bg-red-50 p-2 rounded-md">
                                            Issues: {acc.reasons.join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Domains Health */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5" />
                            Sending Domains
                        </CardTitle>
                        <CardDescription>Reputation of your tracking and sending domains.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isDomainsLoading && <div className="text-center py-4">Loading domains...</div>}
                        {!isDomainsLoading && (!domains || domains.length === 0) && (
                            <div className="text-center py-4 text-muted-foreground">No domains configured.</div>
                        )}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Domain</TableHead>
                                    <TableHead>Health</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {domains?.map((dom) => (
                                    <TableRow key={dom.domain}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{dom.domain}</span>
                                                {dom.reasons.length > 0 && (
                                                    <span className="text-[10px] text-red-500 truncate max-w-[200px]">
                                                        {dom.reasons.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(dom.status) as any} className="gap-1">
                                                {dom.status === 'SAFE' && <ShieldCheck className="w-3 h-3" />}
                                                {dom.status === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                                                {dom.status === 'RISKY' && <ShieldAlert className="w-3 h-3" />}
                                                {dom.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold w-[60px]">
                                            <span className={dom.score < 50 ? "text-red-500" : dom.score < 80 ? "text-yellow-600" : "text-green-600"}>
                                                {dom.score}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
