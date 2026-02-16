import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StatusDistributionChart from '../components/StatusDistributionChart'
import { FileText, ArrowRight, Clock } from 'lucide-react'

type Quote = {
    id: string
    quote_number: string | null
    total: number | null
    status: string | null
    created_at: string
    clients: { name: string } | null
}

export default function DashboardHome() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        revenue: 0,
        distribution: [] as { name: string; value: number; amount: number; color: string }[]
    })
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchDashboardData = async () => {
            const { data: quotesData } = await supabase
                .from('quotes')
                .select('*, clients(name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (quotesData) {
                const total = quotesData.length
                const pending = quotesData.filter(q => q.status === 'sent' || q.status === 'draft').length
                const revenue = quotesData
                    .filter(q => q.status === 'accepted')
                    .reduce((sum, q) => sum + (q.total || 0), 0)

                // Calculate distribution
                const statusStats: Record<string, { count: number; amount: number }> = {}
                quotesData.forEach(q => {
                    const status = q.status || 'draft'
                    if (!statusStats[status]) {
                        statusStats[status] = { count: 0, amount: 0 }
                    }
                    statusStats[status].count += 1
                    statusStats[status].amount += (q.total || 0)
                })

                const colors: Record<string, string> = {
                    draft: '#9CA3AF',    // gray-400
                    sent: '#60A5FA',     // blue-400
                    accepted: '#34D399', // emerald-400
                    rejected: '#F87171'  // red-400
                }

                const distribution = Object.entries(statusStats).map(([status, stat]) => ({
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                    value: stat.count,
                    amount: stat.amount,
                    color: colors[status] || '#CBD5E1'
                }))

                setQuotes((quotesData as unknown) as Quote[])
                setStats({ total, pending, revenue, distribution })

                // Default to first available status if none selected
                if (!selectedStatus && distribution.length > 0) {
                    setSelectedStatus(distribution[0].name.toLowerCase())
                }
            }
            setLoading(false)
        }

        fetchDashboardData()
    }, [user])

    const filteredQuotes = selectedStatus
        ? quotes.filter(q => (q.status || 'draft') === selectedStatus)
        : quotes

    const translateStatus = (status: string) => {
        const translations: Record<string, string> = {
            draft: 'Borradores',
            sent: 'Enviadas',
            accepted: 'Aceptadas',
            rejected: 'Rechazadas'
        }
        return translations[status] || status
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Panel de Control</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Cotizaciones"
                    value={stats.total.toString()}
                    change="Histórico"
                />
                <StatCard
                    title="Ingresos (Aceptadas)"
                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.revenue)}
                    change="De cotizaciones aceptadas"
                />
                <StatCard
                    title="Pendientes / Borradores"
                    value={stats.pending.toString()}
                    change="Requieren atención"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart Section */}
                <div className="p-6 rounded-xl glass-card border border-white/5 bg-card/30">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Distribución de Estados</h3>
                    <p className="text-sm text-gray-500 mb-6">Haz clic en una sección para filtrar</p>
                    <StatusDistributionChart
                        data={stats.distribution}
                        onStatusSelect={(status) => setSelectedStatus(status)}
                    />
                </div>

                {/* Filtered Activity */}
                <div className="p-6 rounded-xl glass-card border border-white/5 bg-card/30 flex flex-col h-full uppercase">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock size={20} className="text-primary" />
                            {selectedStatus ? `Cotizaciones ${translateStatus(selectedStatus)}` : 'Actividad Reciente'}
                        </h3>
                        {selectedStatus && (
                            <button
                                onClick={() => setSelectedStatus(null)}
                                className="text-xs text-primary hover:underline font-bold"
                            >
                                VER TODAS
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredQuotes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50 py-12">
                                <FileText size={48} />
                                <p>No hay cotizaciones para este estado</p>
                            </div>
                        ) : (
                            filteredQuotes.map((quote) => (
                                <Link
                                    key={quote.id}
                                    to={`/quotes/${quote.id}`}
                                    className="flex items-center justify-between p-4 rounded-lg bg-white/50 border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-mono text-sm text-primary font-bold">
                                            {quote.quote_number || 'BORRADOR'}
                                        </span>
                                        <span className="text-sm font-medium text-gray-700">
                                            {quote.clients?.name || 'Cliente desconocido'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-900">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quote.total || 0)}
                                        </span>
                                        <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
    return (
        <div className="p-6 rounded-xl glass-card border border-white/5 bg-card/30">
            <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">{title}</h3>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm text-primary font-semibold">{change}</div>
        </div>
    )
}
