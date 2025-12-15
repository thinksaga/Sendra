import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { NotificationsDropdown } from '../components/NotificationsDropdown';
import { useAuth } from '../context/AuthContext';

export const AppLayout = () => {
    const { logout } = useAuth();

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
                    <h2 className="text-lg font-medium text-gray-900">Workspace</h2>
                    <div className="flex items-center gap-4"> {/* Wrapped in div */}
                        <NotificationsDropdown /> {/* Added */}
                        <button
                            onClick={() => logout()}
                            className="text-sm text-gray-500 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
