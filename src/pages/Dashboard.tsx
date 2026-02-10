import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, Settings, LogOut, Package, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const navLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Quotes', path: '/quotes' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Dashboard() {
    const handleLogout = () => supabase.auth.signOut()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-sm fixed top-0 w-full z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-white">Q</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">CotizaPro</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-muted-foreground hover:text-white">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-40
                w-64 border-r border-border p-4 flex flex-col bg-card md:bg-card/30 backdrop-blur-sm
                transform transition-transform duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="hidden md:flex items-center gap-2 mb-8 px-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-white">Q</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">CotizaPro</span>
                </div>

                <div className="md:hidden mb-8 px-2 mt-16">
                    {/* Spacer for mobile header */}
                </div>

                <nav className="flex-1 space-y-1">
                    {navLinks.map((link) => {
                        const isActive = link.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(link.path)

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${isActive
                                    ? 'bg-primary !text-white shadow-md shadow-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                <link.icon size={20} color={isActive ? "white" : "currentColor"} />
                                <span className={isActive ? "!text-white" : ""}>{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="pt-4 border-t border-border mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative w-full pt-16 md:pt-0">
                <Outlet />
            </main>
        </div>
    )
}
