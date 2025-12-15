
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center space-y-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Sendra encountered an unexpected error. We've logged this issue and are working to fix it.
                            </p>
                        </div>
                        {this.state.error && (
                            <div className="bg-gray-100 p-3 rounded text-left overflow-auto max-h-32">
                                <code className="text-xs text-red-800 font-mono block">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}
                        <div className="flex gap-4 justify-center">
                            <Button onClick={this.handleReload} className="w-full">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reload Application
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400">
                            If this persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
