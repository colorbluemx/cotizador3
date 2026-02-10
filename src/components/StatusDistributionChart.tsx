import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Props {
    data: { name: string; value: number; amount: number; color: string }[]
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-gray-800 border border-gray-700 p-3 rounded shadow-lg">
                <p className="text-gray-200 font-medium">{data.name}</p>
                <p className="text-sm text-gray-400">Count: {data.value}</p>
                <p className="text-sm text-primary font-bold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}
                </p>
            </div>
        )
    }
    return null
}

export default function StatusDistributionChart({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
            </div>
        )
    }

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, amount, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%) \n $${amount.toLocaleString()}`}
                        labelLine={true}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
