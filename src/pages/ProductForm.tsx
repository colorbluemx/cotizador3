import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ProductForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, company } = useAuth()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        unit: 'unit',
        sku: '',
        tax: company?.tax_rate || 0
    })

    useEffect(() => {
        if (id && id !== 'new') {
            const fetchProduct = async () => {
                const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
                if (data) {
                    setFormData({
                        name: data.name,
                        description: data.description || '',
                        price: data.price || 0,
                        unit: data.unit || 'unit',
                        sku: data.sku || '',
                        tax: data.tax || 0
                    })
                }
            }
            fetchProduct()
        }
    }, [id, company])

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
                const { error } = await supabase.from('products').update(payload).eq('id', id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('products').insert(payload)
                if (error) throw error
            }
            navigate('/products')
        } catch (error: any) {
            alert('Error saving product: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/products')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold">{id === 'new' ? 'Add Product' : 'Edit Product'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border border-white/5">

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Product Name *</label>
                    <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                        placeholder="Web Development Service"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Description</label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                        placeholder="Detailed description of the product or service..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Unit Price *</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Unit (e.g. hour, project)</label>
                        <input
                            type="text"
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="unit"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">SKU / Code</label>
                        <input
                            type="text"
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="SVC-001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Tax Rate (%)</label>
                        <input
                            type="number"
                            value={formData.tax}
                            onChange={e => setFormData({ ...formData, tax: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>

            </form>
        </div>
    )
}
