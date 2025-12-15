
import { LayoutDashboard, Users, Mail, Settings, Zap, Activity, BarChart3, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils'; // Make sure utils exists

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' }, // Added
    { name: 'Activity', icon: History, href: '/activity' }, // Added
    { name: 'Inbox', icon: Mail, href: '/inbox' }, // Added
    { name: 'Campaigns', icon: Zap, href: '/campaigns' }, // Changed Icon to Zap to differentiate or keep Mail for Inbox
    { name: 'Leads', icon: Users, href: '/leads' },
    { name: 'Deliverability', icon: Activity, href: '/deliverability' }, // Added
    { name: 'Settings', icon: Settings, href: '/settings' },
];

export const Sidebar = () => {
    const location = useLocation();

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Sendra
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                            "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                            location.pathname === item.href
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
};
