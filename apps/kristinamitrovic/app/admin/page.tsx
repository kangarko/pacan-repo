'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Database, Menu, X, TrendingUp, Package, FileText, Palette, LifeBuoy, PlayCircle, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { createSupabaseClient, safeLocalStorageGet, safeLocalStorageSet } from '@repo/ui/lib/clientUtils';
import { UsersTab } from '@repo/ui/admin/UsersAdminSection';
import { SalesDataTab } from '@repo/ui/admin/SalesDataAdminSection';
import { IntegrationsTab } from '@repo/ui/admin/IntegrationsAdminSection';
import { GenerateTab } from '@repo/ui/admin/GenerateAdminSection';
import { FormsTab } from '@repo/ui/admin/FormsAdminSection';
import { WebinarAdminSection } from '@repo/ui/admin/WebinarAdminSection';
import { OffersAdminSection } from '@repo/ui/admin/OffersAdminSection';
import { HeadlinesTab } from '@repo/ui/admin/HeadlinesAdminSection';
import { VisitorsAdminSection } from '@repo/ui/admin/VisitorsAdminSection';

const ADMIN_SIDEBAR_COLLAPSED_LS_KEY = 'admin_sidebarCollapsed';

enum ActiveTab {
    SALES_DATA = 'sales-data',
    USERS = 'users',
    FORMS = 'forms',
    INTEGRATIONS = 'integrations',
    IMAGE_GENERATION = 'image-generation',
    //SUPPORT = 'support',
    //EXPERIMENTS = 'experiments',
    WEBINAR = 'webinar',
    OFFERS = 'offers',
    HEADLINES = 'headlines',
    VISITORS = 'visitors'
}

export default function AdminDashboard() {
    const router = useRouter();
    const supabase = createSupabaseClient();

    const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.SALES_DATA);
    const [userRole, setUserRole] = useState<'admin' | 'marketer' | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return safeLocalStorageGet(ADMIN_SIDEBAR_COLLAPSED_LS_KEY, 'true') === 'true';
    });

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setIsMenuOpen(false);
        // Update URL without navigation
        const newUrl = `/admin/${tab === ActiveTab.SALES_DATA ? '' : tab}`;
        window.history.pushState({}, '', newUrl);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user || (user.user_metadata.role !== 'admin' && user.user_metadata.role !== 'marketer')) {
                setIsAuthenticated(false);
                router.push('/login');
                return;
            }

            setUserRole(user.user_metadata.role);
            setUserName(user.user_metadata.name);
            setIsAuthenticated(true);
        };

        checkAuth();

        // Set initial tab based on URL
        const path = window.location.pathname.split('/').pop();
        if (path && path !== 'admin') {
            const tabFromPath = path as ActiveTab;
            if (Object.values(ActiveTab).includes(tabFromPath)) {
                setActiveTab(tabFromPath);
            }
        }
    }, [router, supabase.auth]);

    useEffect(() => {
        safeLocalStorageSet(ADMIN_SIDEBAR_COLLAPSED_LS_KEY, String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center relative overflow-hidden">
                {/* Background gradient animation */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-3xl animate-pulse animation-delay-1000" />
                </div>
                
                {/* Main loader */}
                <div className="relative">
                    {/* Outer ring */}
                    <div className="w-24 h-24 rounded-full border-4 border-purple-900/20 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-500 animate-spin" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-b-indigo-500 border-l-indigo-500 animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const isMarketer = userRole === 'marketer';

    const navigationItems = [
        { tab: ActiveTab.SALES_DATA, label: 'Sales Data', icon: <TrendingUp className="w-5 h-5" />, href: '/admin', marketerAccess: true },
        { tab: ActiveTab.USERS, label: 'Users', icon: <Users className="w-5 h-5" />, href: '/admin/users', marketerAccess: true },
        { tab: ActiveTab.OFFERS, label: 'Offers', icon: <Package className="w-5 h-5" />, href: '/admin/offers', marketerAccess: false },
        { tab: ActiveTab.HEADLINES, label: 'Headlines', icon: <FileText className="w-5 h-5" />, href: '/admin/headlines', marketerAccess: true },
        { tab: ActiveTab.VISITORS, label: 'Visitors', icon: <Users className="w-5 h-5" />, href: '/admin/visitors', marketerAccess: true },
        { tab: ActiveTab.FORMS, label: 'Forms', icon: <FileText className="w-5 h-5" />, href: '/admin/forms', marketerAccess: true },
        { tab: ActiveTab.INTEGRATIONS, label: 'Integrations', icon: <Database className="w-5 h-5" />, href: '/admin/integrations', marketerAccess: true },
        { tab: ActiveTab.IMAGE_GENERATION, label: 'Generate', icon: <Palette className="w-5 h-5" />, href: '/admin/image-generation', marketerAccess: true },
        /*{ tab: ActiveTab.SUPPORT, label: 'Support', icon: <LifeBuoy className="w-5 h-5" />, href: '/admin/support', marketerAccess: false },*/
        /*{ tab: ActiveTab.EXPERIMENTS, label: 'Experiments', icon: <FlaskConical className="w-5 h-5" />, href: '/admin/experiments', marketerAccess: true },*/
        { tab: ActiveTab.WEBINAR, label: 'Webinars', icon: <PlayCircle className="w-5 h-5" />, href: '/admin/webinar', marketerAccess: false },
    ];

    const accessibleItems = navigationItems.filter(item => !isMarketer || item.marketerAccess);

    return (
        <div className="min-h-screen bg-neutral-900 flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <div className={`hidden lg:flex flex-col bg-black/40 backdrop-blur-md border-r border-neutral-800 sticky top-0 h-screen transition-all duration-300 ${
                isSidebarCollapsed ? 'min-w-16' : 'w-64 xl:w-72'
            }`}>
                <div className={`flex-1 ${isSidebarCollapsed ? 'p-2' : 'p-6 overflow-y-auto'} space-y-6`}>
                    <div className={isSidebarCollapsed ? 'hidden' : ''}>
                        <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
                        <p className="text-sm text-gray-400">
                            Logged in as <span className="text-purple-400 font-medium">{userName}</span>
                        </p>
                    </div>
                    
                    <nav className="space-y-2">
                        {accessibleItems.map(item => (
                            <TabButton
                                key={item.tab}
                                icon={item.icon}
                                label={item.label}
                                isActive={activeTab === item.tab}
                                onClick={() => handleTabChange(item.tab)}
                                href={item.href}
                                isCollapsed={isSidebarCollapsed}
                            />
                        ))}
                    </nav>

                    <div className="pt-6 border-t border-neutral-800">
                        {isSidebarCollapsed ? (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center p-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors group relative"
                                title="Logout"
                            >
                                <Power className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                {/* Tooltip */}
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                                    Logout
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors group"
                            >
                                <Power className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Logout</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                <div className="border-t border-neutral-800 p-2">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="w-full flex items-center justify-center p-2 text-gray-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors"
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isSidebarCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <ChevronLeft className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-800">
                <div className="flex items-center justify-between p-4">
                    <div>
                        <h1 className="text-xl font-bold text-white">Admin</h1>
                        <p className="text-xs text-gray-400">{userName}</p>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-neutral-800 shadow-xl">
                        <nav className="p-4 space-y-2 max-h-[calc(100vh-64px)] overflow-y-auto">
                            {accessibleItems.map(item => (
                                <MobileMenuLink
                                    key={item.tab}
                                    href={item.href}
                                    label={item.label}
                                    icon={item.icon}
                                    currentTab={activeTab}
                                    targetTab={item.tab}
                                    onClick={() => handleTabChange(item.tab)}
                                />
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors mt-4 border-t border-neutral-800 pt-4"
                            >
                                <Power className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </nav>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-screen lg:min-h-0 overflow-scroll">
                <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto">
                    {/* Tab Content */}
                    <div className="animate-fadeIn">
                        {activeTab === ActiveTab.SALES_DATA && <SalesDataTab />}
                        {activeTab === ActiveTab.USERS && <UsersTab userRole={userRole} />}
                        {activeTab === ActiveTab.VISITORS && <VisitorsAdminSection />}
                        {activeTab === ActiveTab.FORMS && <FormsTab />}
                        {activeTab === ActiveTab.INTEGRATIONS && <IntegrationsTab />}
                        {activeTab === ActiveTab.IMAGE_GENERATION && <GenerateTab userRole={userRole} />}
                        {/*activeTab === ActiveTab.SUPPORT && <SupportTab />*/}
                        {/*{activeTab === ActiveTab.EXPERIMENTS && <ExperimentsTab userRole={userRole} />}*/}
                        {activeTab === ActiveTab.WEBINAR && <WebinarAdminSection />}
                        {activeTab === ActiveTab.OFFERS && <OffersAdminSection />}
                        {activeTab === ActiveTab.HEADLINES && <HeadlinesTab userRole={userRole} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({ icon, label, isActive, onClick, href, isCollapsed = false }: {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    href: string;
    isCollapsed?: boolean;
}) {
    const buttonContent = (
        <>
            <span className={`${isActive ? 'text-purple-400' : 'group-hover:text-purple-400'} transition-colors ${
                isCollapsed ? 'mx-auto' : ''
            }`}>
                {icon}
            </span>
            {!isCollapsed && <span className="font-medium">{label}</span>}
        </>
    );

    const className = `
        flex items-center gap-3 rounded-lg transition-all group relative
        ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}
        ${isActive 
            ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-white border border-purple-500/30' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
    `;

    return (
        <Link 
            href={href}
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={className}
            title={isCollapsed ? label : undefined}
        >
            {buttonContent}
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                    {label}
                </div>
            )}
        </Link>
    );
}

function MobileMenuLink({ href, label, icon, currentTab, targetTab, onClick }: {
    href: string;
    label: string;
    icon: React.ReactNode;
    currentTab: ActiveTab;
    targetTab: ActiveTab;
    onClick: () => void;
}) {
    const isActive = currentTab === targetTab;
    
    return (
        <Link
            href={href}
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                    ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-white border border-purple-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
            `}
        >
            <span className={`${isActive ? 'text-purple-400' : ''}`}>
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}