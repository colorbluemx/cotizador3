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
            else setQuotes((data as unknown) as Quote[])
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
            case 'accepted': return 'bg-green-50 text-green-700 border-green-100'
            case 'sent': return 'bg-blue-50 text-blue-700 border-blue-100'
            case 'rejected': return 'bg-red-50 text-red-700 border-red-100'
            default: return 'bg-gray-50 text-gray-700 border-gray-100'
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Cotizaciones</h1>
                    <p className="text-gray-400 mt-1">Gestiona y haz seguimiento a tus propuestas</p>
                </div>
                <div className="flex items-center gap-4">
                    {!canCreateQuote && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Límite alcanzado ({quoteCount}/{FREE_LIMIT})
                        </span>
                    )}
                    <Link
                        to={canCreateQuote ? "/quotes/new" : "#"}
                        onClick={(e) => !canCreateQuote && e.preventDefault()}
                        className={`bg-primary text-white p-2 rounded-full font-semibold flex items-center justify-center transition-all ${!canCreateQuote ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-110 shadow-lg shadow-primary/30'
                            }`}
                        title={!canCreateQuote ? "Mejora a Pro para crear más cotizaciones" : "Crear Nueva Cotización"}
                    >
                        <Plus size={24} color="white" />
                    </Link>
                </div>
            </div>

            {!canCreateQuote && (
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white shadow-xl shadow-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                            <Plus size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">¡Desbloquea Cotizaciones Ilimitadas!</h2>
                            <p className="text-white/80 font-medium mt-1">Has alcanzado el límite del plan gratuito. Pásate a Pro para seguir creciendo.</p>
                        </div>
                    </div>
                    <Link
                        to="/settings"
                        className="px-8 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-all hover:scale-105 shadow-lg relative z-10 active:scale-95 whitespace-nowrap"
                    >
                        MEJORAR A PRO AHORA
                    </Link>
                </div>
            )}

            <div className="glass-card rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/10 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cotizaciones..."
                            className="w-full pl-10 pr-4 py-2 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5 text-left text-sm font-medium text-gray-400">
                                <th className="p-4">Número</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                            ) : quotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText size={48} className="opacity-20" />
                                            <p>No has creado cotizaciones todavía.</p>
                                            <Link to="/quotes/new" className="text-primary hover:underline">Crea tu primera cotización</Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                quotes.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-mono text-sm">
                                            <Link to={`/quotes/${quote.id}`} className="text-primary hover:underline font-bold">
                                                {quote.quote_number || 'BORRADOR'}
                                            </Link>
                                        </td>
                                        <td className="p-4 font-medium">{quote.clients?.name || 'Cliente Desconocido'}</td>
                                        <td className="p-4 text-gray-400">{new Date(quote.issue_date || '').toLocaleDateString('es-ES')}</td>
                                        <td className="p-4 font-bold">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quote.total || 0)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black border tracking-wider ${getStatusColor(quote.status)}`}>
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
                                                    <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                        Acciones
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/quotes/${quote.id}`)}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                    >
                                                        <Edit size={14} /> Editar
                                                    </button>

                                                    <div className="my-1 border-t border-white/5"></div>
                                                    <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                        Cambiar Estado
                                                    </div>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'draft')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                    >
                                                        <FileText size={14} /> Borrador
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'sent')}
                                                        className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 flex items-center gap-2"
                                                    >
                                                        <Send size={14} /> Enviada
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'accepted')}
                                                        className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-500/10 flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={14} /> Aceptada
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(quote.id, 'rejected')}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                    >
                                                        <XCircle size={14} /> Rechazada
                                                    </button>

                                                    <div className="my-1 border-t border-white/5"></div>
                                                    <button
                                                        onClick={() => deleteQuote(quote.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-900/20 hover:text-red-400 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Eliminar
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
