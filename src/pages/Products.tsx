import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Database } from '../types/database.types'

type Product = Database['public']['Tables']['products']['Row']

export default function Products() {
    const { user } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!user) return
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true })

                if (error) throw error
                if (data) setProducts(data)
            } catch (error) {
                console.error('Error fetching products:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [user])

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const deleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return
        try {
            const { error } = await supabase.from('products').delete().eq('id', id)
            if (error) throw error
            setProducts(prev => prev.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting product:', error)
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Products</h1>
                    <p className="text-gray-400 mt-1">Manage your goods and services</p>
                </div>
                <Link
                    to="/products/new"
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    New Product
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none transition-colors"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white/5 rounded-lg border border-dashed border-white/10">
                        <p className="text-gray-400 mb-4">No products found</p>
                        <Link to="/products/new" className="text-primary hover:underline">Create your first product</Link>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-card border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                    $
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/products/${product.id}`} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white">
                                        <Edit size={16} />
                                    </Link>
                                    <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-500/10 rounded-md text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">{product.description || 'No description'}</p>

                            <div className="text-xl font-bold text-primary">
                                ${product.price} <span className="text-xs text-gray-500 font-normal">/ {product.unit || 'unit'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
