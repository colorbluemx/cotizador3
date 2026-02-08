export default function DashboardHome() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Quotes" value="12" change="+2 this month" />
                <StatCard title="Total Revenue" value="$4,200" change="+15% vs last month" />
                <StatCard title="Pending" value="3" change="Waiting for approval" />
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
