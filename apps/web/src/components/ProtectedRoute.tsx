
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
    const { authenticated, initialized, login } = useAuth();

    if (!initialized) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!authenticated) {
        login();
        return null;
    }

    return <Outlet />;
};
