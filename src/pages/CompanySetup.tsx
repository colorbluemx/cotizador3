import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Building2 } from 'lucide-react'

export default function CompanySetup() {
    const { user, refreshCompany } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        primary_color: '#3b82f6', // Default blue
        tax_rate: 16
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            const { error } = await supabase.from('companies').insert({
                user_id: user.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                primary_color: formData.primary_color,
                tax_rate: formData.tax_rate
            })

            if (error) throw error

            await refreshCompany()
            navigate('/')
        } catch (error: any) {
            alert('Error saving company: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-2xl glass-card rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Setup Your Company</h1>
                        <p className="text-gray-400">Please provide your business details to start creating quotes.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Company Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Business Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-2 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-2 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full p-2 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-24"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Brand Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={formData.primary_color}
                                    onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="h-10 w-20 rounded cursor-pointer bg-transparent border-none"
                                />
                                <span className="text-sm font-mono text-gray-400">{formData.primary_color}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Default Tax Rate (%)</label>
                            <input
                                type="number"
                                value={formData.tax_rate}
                                onChange={e => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                                className="w-full p-2 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="col-span-2 border-t border-white/10 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Saving...' : 'Save & Continue'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
