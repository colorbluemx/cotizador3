import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StatusDistributionChart from '../components/StatusDistributionChart'

export default function DashboardHome() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        revenue: 0,
        distribution: [] as { name: string; value: number; amount: number; color: string }[]
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchStats = async () => {
            const { data: quotes } = await supabase
                .from('quotes')
                .select('status, total')
                .eq('user_id', user.id)

            if (quotes) {
                const total = quotes.length
                const pending = quotes.filter(q => q.status === 'sent' || q.status === 'draft').length
                const revenue = quotes
                    .filter(q => q.status === 'accepted')
                    .reduce((sum, q) => sum + (q.total || 0), 0)

                // Calculate distribution
                const statusStats: Record<string, { count: number; amount: number }> = {}
                quotes.forEach(q => {
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

                setStats({ total, pending, revenue, distribution })
            }
            setLoading(false)
        }

        fetchStats()
    }, [user])

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Quotes"
                    value={stats.total.toString()}
                    change="Lifetime"
                />
                <StatCard
                    title="Revenue (Accepted)"
                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.revenue)}
                    change="From accepted quotes"
                />
                <StatCard
                    title="Pending / Draft"
                    value={stats.pending.toString()}
                    change="Needs attention"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart Section */}
                <div className="p-6 rounded-xl glass-card border border-white/5 bg-card/30">
                    <h3 className="text-lg font-semibold mb-4 text-gray-200">Quote Status Distribution</h3>
                    <StatusDistributionChart data={stats.distribution} />
                </div>

                {/* Recent Activity Placeholder or other widgets */}
                <div className="p-6 rounded-xl glass-card border border-white/5 bg-card/30 flex items-center justify-center text-gray-500">
                    <p>Recent Activity (Coming Soon)</p>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
    return (
        <div className="p-6 rounded-xl glass-card border border-white/5 bg-card/30">
            <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm text-primary">{change}</div>
        </div>
    )
}
