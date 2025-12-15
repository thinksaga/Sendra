
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { CampaignList } from './pages/campaigns/CampaignList';
import { CampaignCreate } from './pages/campaigns/CampaignCreate'; // Added
import { CampaignSettings } from './pages/campaigns/CampaignSettings'; // Added
import { SequenceBuilder } from './pages/campaigns/SequenceBuilder'; // Added
import { LeadsList } from './pages/leads/LeadsList'; // Added
import { LeadImport } from './pages/leads/LeadImport'; // Added
import { CampaignLeads } from './pages/campaigns/CampaignLeads'; // Added
import { Unibox } from './pages/unibox/Unibox'; // Added
import { DeliverabilityDashboard } from './pages/deliverability/DeliverabilityDashboard'; // Added
import { AnalyticsDashboard } from './pages/analytics/AnalyticsDashboard'; // Added
import { ActivityFeed } from './pages/activity/ActivityFeed'; // Added
import { NotFound } from './pages/NotFound'; // Added
import { ErrorBoundary } from './components/ErrorBoundary'; // Added
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <WorkspaceProvider>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/login" element={<div>Log in (redirecting...)</div>} />

                                {/* Protected Routes */}
                                <Route element={<ProtectedRoute />}>
                                    <Route element={<AppLayout />}>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/inbox" element={<Unibox />} /> {/* Added */}
                                        <Route path="/inbox/:threadId" element={<Unibox />} /> {/* Added */}
                                        <Route path="/deliverability" element={<DeliverabilityDashboard />} /> {/* Added */}
                                        <Route path="/analytics" element={<AnalyticsDashboard />} /> {/* Added */}
                                        <Route path="/activity" element={<ActivityFeed />} /> {/* Added */}
                                        <Route path="/campaigns" element={<CampaignList />} />
                                        <Route path="/campaigns/new" element={<CampaignCreate />} />
                                        <Route path="/campaigns/:id/settings" element={<CampaignSettings />} />
                                        <Route path="/campaigns/:id/sequence" element={<SequenceBuilder />} /> {/* Added */}
                                        <Route path="/campaigns/:id/leads" element={<CampaignLeads />} /> {/* Added */}
                                        <Route path="/leads" element={<LeadsList />} /> {/* Added */}
                                        <Route path="/leads/import" element={<LeadImport />} /> {/* Added */}
                                    </Route>
                                </Route>

                                {/* Catch-all 404 */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </WorkspaceProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
