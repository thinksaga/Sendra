
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportLeadsCsv } from '../../features/leads/api/leads';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export const LeadImport = () => {
    const navigate = useNavigate();
    const importMutation = useImportLeadsCsv();

    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Result
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);

    // Mapping: System Field -> CSV Header Index
    const [mapping, setMapping] = useState<{
        email: string;
        firstName: string;
        lastName: string;
        company: string;
    }>({ email: '', firstName: '', lastName: '', company: '' });

    const [result, setResult] = useState<{ created: number; skipped: number; failed: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleParse = () => {
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setHeaders(results.meta.fields || []);
                setParsedData(results.data);

                // Auto-match
                const fields = results.meta.fields || [];
                setMapping({
                    email: fields.find(f => /email|mail/i.test(f)) || '',
                    firstName: fields.find(f => /first|name/i.test(f)) || '',
                    lastName: fields.find(f => /last|surname/i.test(f)) || '',
                    company: fields.find(f => /company|org/i.test(f)) || '',
                });

                setStep(2);
            },
            error: (err) => {
                alert('Error parsing CSV: ' + err.message);
            }
        });
    };

    const handleImport = async () => {
        if (!mapping.email) {
            alert('Email mapping is required');
            return;
        }

        // Transform data based on mapping
        const leads = parsedData.map(row => ({
            email: row[mapping.email],
            firstName: row[mapping.firstName],
            lastName: row[mapping.lastName],
            company: row[mapping.company],
        })).filter(l => l.email); // Filter out rows without email

        try {
            const res = await importMutation.mutateAsync({ leads });
            setResult({ created: res.created, skipped: res.skipped, failed: res.failed });
            setStep(3);
        } catch (err) {
            console.error(err);
            alert('Failed to import leads');
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate('/leads')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Leads
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Import Leads from CSV</CardTitle>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                                <FileText className="h-10 w-10 text-gray-400 mb-4" />
                                <Label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload CSV File
                                </Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="max-w-xs"
                                />
                                <p className="text-xs text-gray-500 mt-2">Only .csv files supported</p>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleParse} disabled={!file}>
                                    Next: Map Fields
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-500">Map the columns from your CSV to Sendra's fields.</p>

                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <Label className="font-bold">Sendra Field</Label>
                                    <Label className="font-bold">CSV Column</Label>
                                </div>

                                <div className="grid grid-cols-2 items-center gap-4 bg-gray-50 p-3 rounded-md border">
                                    <Label>Email <span className="text-red-500">*</span></Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
                                        value={mapping.email}
                                        onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                                    >
                                        <option value="">Select Column</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 items-center gap-4 p-3 border-b">
                                    <Label>First Name</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
                                        value={mapping.firstName}
                                        onChange={(e) => setMapping({ ...mapping, firstName: e.target.value })}
                                    >
                                        <option value="">(Skip)</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 items-center gap-4 p-3 border-b">
                                    <Label>Last Name</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
                                        value={mapping.lastName}
                                        onChange={(e) => setMapping({ ...mapping, lastName: e.target.value })}
                                    >
                                        <option value="">(Skip)</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 items-center gap-4 p-3 border-b">
                                    <Label>Company</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
                                        value={mapping.company}
                                        onChange={(e) => setMapping({ ...mapping, company: e.target.value })}
                                    >
                                        <option value="">(Skip)</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={handleImport} disabled={importMutation.isPending}>
                                    {importMutation.isPending ? 'Importing...' : 'Start Import'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && result && (
                        <div className="text-center py-10 space-y-4">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold">Import Complete</h2>

                            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-6">
                                <div className="bg-green-50 p-4 rounded-md border border-green-100">
                                    <div className="text-2xl font-bold text-green-600">{result.created}</div>
                                    <div className="text-sm text-green-700">Created</div>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                                    <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                                    <div className="text-sm text-yellow-700">Skipped (Dupes)</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-md border border-red-100">
                                    <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                                    <div className="text-sm text-red-700">Failed</div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button onClick={() => navigate('/leads')}>View Leads</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
