import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ClientForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        tax_id: ''
    })

    useEffect(() => {
        if (id && id !== 'new') {
            const fetchClient = async () => {
                const { data } = await supabase.from('clients').select('*').eq('id', id).single()
                if (data) {
                    setFormData({
                        name: data.name,
                        company: data.company || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        tax_id: data.tax_id || ''
                    })
                }
            }
            fetchClient()
        }
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            const payload = {
                ...formData,
                user_id: user.id
            }

            if (id && id !== 'new') {
                const { error } = await supabase.from('clients').update(payload).eq('id', id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('clients').insert(payload)
                if (error) throw error
            }
            navigate('/clients')
        } catch (error: any) {
            alert('Error saving client: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/clients')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold">{id === 'new' ? 'Add Client' : 'Edit Client'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border border-white/5">

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Contact Name *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Company Name</label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="Acme Inc."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Address</label>
                    <textarea
                        rows={3}
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                        placeholder="123 Business St, City, Country"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Tax ID / VAT Number</label>
                    <input
                        type="text"
                        value={formData.tax_id}
                        onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                        placeholder="VAT-123456"
                    />
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Client'}
                    </button>
                </div>

            </form>
        </div>
    )
}
