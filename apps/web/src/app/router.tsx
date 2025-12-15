
import { useAuth } from 'react-oidc-context';
import { Routes, Route, Navigate } from 'react-router-dom';

export const AppRouter = () => {
    const auth = useAuth();

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    if (!auth.isAuthenticated) {
        return (
            <div style={{ padding: 20 }}>
                <h1>Welcome to Sendra</h1>
                <button onClick={() => auth.signinRedirect()}>Log in</button>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={
                <div>
                    <h1>Dashboard</h1>
                    <p>Hello, {auth.user?.profile.email}</p>
                    <p>Token: {auth.user?.access_token.slice(0, 10)}...</p>
                    <button onClick={() => auth.signoutRedirect()}>Log out</button>
                </div>
            } />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};
