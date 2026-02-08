import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Database } from '../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

export default function Clients() {
    const { user } = useAuth()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!user) return
        const fetchClients = async () => {
            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true })

                if (error) throw error
                if (data) setClients(data)
            } catch (error) {
                console.error('Error fetching clients:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchClients()
    }, [user])

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const deleteClient = async (id: string) => {
        if (!confirm('Are you sure you want to delete this client?')) return
        try {
            const { error } = await supabase.from('clients').delete().eq('id', id)
            if (error) throw error
            setClients(prev => prev.filter(c => c.id !== id))
        } catch (error) {
            console.error('Error deleting client:', error)
            alert('Could not delete client. They might have active quotes.')
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Clients</h1>
                    <p className="text-gray-400 mt-1">Manage your customer base</p>
                </div>
                <Link
                    to="/clients/new"
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    New Client
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none transition-colors"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white/5 rounded-lg border border-dashed border-white/10">
                        <p className="text-gray-400 mb-4">No clients found</p>
                        <Link to="/clients/new" className="text-primary hover:underline">Create your first client</Link>
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <div key={client.id} className="bg-card border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    {client.name.charAt(0)}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/clients/${client.id}`} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white">
                                        <Edit size={16} />
                                    </Link>
                                    <button onClick={() => deleteClient(client.id)} className="p-2 hover:bg-red-500/10 rounded-md text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{client.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{client.company}</p>

                            <div className="space-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="w-4">📧</span> {client.email}
                                </div>
                                {client.phone && (
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="w-4">📞</span> {client.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
