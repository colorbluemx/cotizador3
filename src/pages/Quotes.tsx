import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, MoreVertical, Trash2, Edit, CheckCircle, XCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePlanLimits } from '../hooks/usePlanLimits'
import type { Database } from '../types/database.types'

type Quote = Database['public']['Tables']['quotes']['Row'] & {
    clients: Database['public']['Tables']['clients']['Row'] | null
}

export default function Quotes() {
    const { user } = useAuth()
    const { canCreateQuote, quoteCount, FREE_LIMIT } = usePlanLimits()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [loading, setLoading] = useState(true)
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActionMenuOpen(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!user) return
        const fetchQuotes = async () => {
            const { data, error } = await supabase
                .from('quotes')
                .select('*, clients(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) console.error(error)
            else setQuotes(data as any) // Type assertion due to join
            setLoading(false)
        }
        fetchQuotes()
    }, [user])

    const deleteQuote = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quote?')) return

        const { error } = await supabase.from('quotes').delete().eq('id', id)
        if (error) {
            console.error('Error deleting quote:', error)
            alert('Error deleting quote')
        } else {
            setQuotes(quotes.filter(q => q.id !== id))
        }
        setActionMenuOpen(null)
    }

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
        if (error) {
            console.error('Error updating status:', error)
            alert('Error updating status')
        } else {
            setQuotes(quotes.map(q => q.id === id ? { ...q, status } : q))
        }
        setActionMenuOpen(null)
    }

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'accepted': return 'bg-green-500/10 text-green-400 border-green-500/20'
            case 'sent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Quotes</h1>
                    <p className="text-gray-400 mt-1">Manage and track your proposals</p>
                </div>
                <div className="flex items-center gap-4">
                    {!canCreateQuote && (
                        <span className="text-xs text-red-400 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
                            Limit reached ({quoteCount}/{FREE_LIMIT})
                        </span>
                    )}
                    <Link
                        to={canCreateQuote ? "/quotes/new" : "#"}
                        onClick={(e) => !canCreateQuote && e.preventDefault()}
                        className={`bg-primary text-white p-2 rounded-full font-semibold flex items-center justify-center transition-all ${!canCreateQuote ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-110 shadow-lg shadow-primary/30'
                            }`}
                        title={!canCreateQuote ? "Upgrade to Pro to create more quotes" : "Create New Quote"}
                    >
                        <Plus size={24} color="white" />
                    </Link>
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/10 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search quotes..."
                            className="w-full pl-10 pr-4 py-2 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5 text-left text-sm font-medium text-gray-400">
                                <th className="p-4">Number</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : quotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText size={48} className="opacity-20" />
                                            <p>No quotes created yet.</p>
                                            <Link to="/quotes/new" className="text-primary hover:underline">Create your first quote</Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                quotes.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-mono text-sm">
                                            <Link to={`/quotes/${quote.id}`} className="text-primary hover:underline">
                                                {quote.quote_number || 'Draft'}
                                            </Link>
                                        </td>
                                        <td className="p-4 font-medium">{quote.clients?.name || 'Unknown Client'}</td>
                                        <td className="p-4 text-gray-400">{new Date(quote.issue_date || '').toLocaleDateString()}</td>
                                        <td className="p-4 font-bold">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quote.total || 0)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                                                {(quote.status || 'draft').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActionMenuOpen(actionMenuOpen === quote.id ? null : quote.id)
                                                }}
                                                className="text-gray-500 hover:text-white transition-colors p-1"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {actionMenuOpen === quote.id && (
                                                <div
                                                    ref={menuRef}
                                                    className="absolute right-8 top-0 z-50 w-48 bg-[#1A1F2C] border border-white/10 rounded-lg shadow-xl py-1 overflow-hidden"
                                                >
                                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/quotes/${quote.id}`)}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                    >
                                                        <Edit size={14} /> Edit Quote
                                                    </button>

                                                    <div className="my-1 border-t border-white/5"></div>
                                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                        Set Status
                                                    </div>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'draft')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                    >
                                                        <FileText size={14} /> Draft
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'sent')}
                                                        className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 flex items-center gap-2"
                                                    >
                                                        <Send size={14} /> Sent
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'accepted')}
                                                        className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-500/10 flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={14} /> Accepted
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'rejected')}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                    >
                                                        <XCircle size={14} /> Rejected
                                                    </button>

                                                    <div className="my-1 border-t border-white/5"></div>
                                                    <button
                                                        onClick={() => deleteQuote(quote.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-900/20 hover:text-red-400 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
