import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { Save, ArrowLeft, Trash2, Plus, Package, Download, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Database } from '../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']
type Product = Database['public']['Tables']['products']['Row']

interface QuoteItem {
    id: string
    name: string
    description: string
    quantity: number
    unit_price: number
    total: number
}

export default function QuoteEditor() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, company } = useAuth()
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const componentRef = useRef<HTMLDivElement>(null)

    // Updated useReactToPrint signature for v3+
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Quote_${id || 'New'}`,
    })

    const [quoteData, setQuoteData] = useState({
        clientId: '',
        issueDate: new Date().toISOString().split('T')[0],
        validUntil: '',
        quoteNumber: '',
        items: [] as QuoteItem[],
        taxRate: company?.tax_rate || 0,
        currency: 'USD'
    })

    useEffect(() => {
        if (!user) return

        // Fetch Clients & Products
        const fetchData = async () => {
            const { data: clientsData } = await supabase.from('clients').select('*').eq('user_id', user.id)
            if (clientsData) setClients(clientsData)

            const { data: productsData } = await supabase.from('products').select('*').eq('user_id', user.id)
            if (productsData) setProducts(productsData)
        }
        fetchData()

        if (id && id !== 'new') {
            const fetchQuote = async () => {
                const { data: quote } = await supabase
                    .from('quotes')
                    .select('*, quote_items(*)')
                    .eq('id', id)
                    .single()

                if (quote) {
                    setQuoteData({
                        clientId: quote.client_id || '',
                        issueDate: quote.issue_date || '',
                        validUntil: quote.valid_until || '',
                        quoteNumber: quote.quote_number || '',
                        items: (quote.quote_items as unknown as any[]).map(item => ({
                            id: item.id,
                            name: item.name,
                            description: item.description || '',
                            quantity: item.quantity || 1,
                            unit_price: item.unit_price || 0,
                            total: (item.quantity || 1) * (item.unit_price || 0)
                        })),
                        taxRate: Number(quote.tax) || 0,
                        currency: 'USD'
                    })
                }
            }
            fetchQuote()
        }
    }, [user, id])

    // Calculation Helpers
    const subtotal = quoteData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const taxAmount = (subtotal * quoteData.taxRate) / 100
    const total = subtotal + taxAmount

    // Handlers
    const addItem = () => {
        const newItem: QuoteItem = {
            id: crypto.randomUUID(),
            name: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            total: 0
        }
        setQuoteData(prev => ({ ...prev, items: [...prev.items, newItem] }))
    }

    const addProductItem = (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        const newItem: QuoteItem = {
            id: crypto.randomUUID(),
            name: product.name,
            description: product.description || '',
            quantity: 1,
            unit_price: product.price || 0,
            total: (product.price || 0) * 1
        }
        setQuoteData(prev => ({ ...prev, items: [...prev.items, newItem] }))
    }

    const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
        setQuoteData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value }
                    if (field === 'quantity' || field === 'unit_price') {
                        updated.total = updated.quantity * updated.unit_price
                    }
                    return updated
                }
                return item
            })
        }))
    }

    const removeItem = (id: string) => {
        setQuoteData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
    }

    const handleSave = async () => {
        if (!user) return
        setLoading(true)
        try {
            let quoteId = id

            const payload = {
                user_id: user.id,
                company_id: company?.id,
                client_id: quoteData.clientId,
                issue_date: quoteData.issueDate,
                valid_until: quoteData.validUntil || null,
                subtotal,
                tax: taxAmount,
                total,
                status: 'draft',
                // Generate quote number if new OR if missing in existing quote
                ...((id === 'new' || !quoteData.quoteNumber) ? {
                    quote_number: `Q-${Date.now().toString().slice(-4)}`
                } : {})
            }

            if (id === 'new' || !id) {
                const { data, error } = await supabase.from('quotes').insert(payload).select().single()
                if (error) throw error
                quoteId = data.id
            } else {
                const { error } = await supabase.from('quotes').update(payload).eq('id', id)
                if (error) throw error
            }

            if (id !== 'new') {
                await supabase.from('quote_items').delete().eq('quote_id', quoteId!)
            }

            if (quoteData.items.length > 0) {
                const itemsPayload = quoteData.items.map(item => ({
                    quote_id: quoteId!,
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
                const { error: itemsError } = await supabase.from('quote_items').insert(itemsPayload)
                if (itemsError) throw itemsError
            }

            navigate('/quotes')
        } catch (error: any) {
            alert('Error saving quote: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSendEmail = async () => {
        if (!user || !id || id === 'new') {
            alert('Please save the quote first.')
            return
        }

        const client = clients.find(c => c.id === quoteData.clientId)
        if (!client || !client.email) {
            alert('Client has no email address.')
            return
        }

        if (!confirm(`Send quote to ${client.email}?`)) return

        setSending(true)
        try {
            const { error } = await supabase.functions.invoke('send-quote', {
                body: { quote_id: id, email: client.email }
            })

            if (error) throw error

            alert('Email sent successfully!')
            // Update local status if needed or re-fetch
        } catch (error: any) {
            console.error('Error sending email:', error)
            alert('Failed to send email. Ensure RESEND_API_KEY is matched in supabase secrets.')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-card/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/quotes')} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg">{id !== 'new' ? 'Edit Quote' : 'New Quote'}</h1>
                        <span className="text-xs text-gray-400">
                            {id !== 'new' ? quoteData.quoteNumber : 'Draft'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSendEmail}
                        disabled={sending || id === 'new'}
                        className={`px-3 py-2 ${id === 'new' ? 'text-gray-600' : 'text-primary hover:text-primary/80'} font-medium transition-colors flex items-center gap-2`}
                        title={id === 'new' ? "Save quote first" : "Send via Email"}
                    >
                        {sending ? <span className="animate-spin">⏳</span> : <Mail size={18} />}
                        <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
                    </button>

                    <button
                        onClick={() => handlePrint()}
                        type="button"
                        className="px-3 py-2 text-gray-400 hover:text-white font-medium transition-colors flex items-center gap-2"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Download PDF</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </header>

            {/* Main Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Editor Form */}
                <div className="flex-1 overflow-y-auto p-8 border-r border-white/10">
                    <div className="max-w-2xl mx-auto space-y-8">

                        {/* Client Section */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">Client Details</h2>
                            {clients.length > 0 ? (
                                <select
                                    value={quoteData.clientId}
                                    onChange={(e) => setQuoteData({ ...quoteData, clientId: e.target.value })}
                                    className="w-full p-3 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none"
                                >
                                    <option value="">Select a client...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name} - {client.company}</option>
                                    ))}
                                </select>
                            ) : (
                                <div
                                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 transition-colors cursor-pointer text-center py-8 text-gray-400 dashed-border"
                                    onClick={() => navigate('/clients')}
                                >
                                    No clients found. Click to add a client.
                                </div>
                            )}
                            <div className="text-right">
                                <button onClick={() => navigate('/clients')} className="text-xs text-primary hover:underline">+ Add New Client</button>
                            </div>
                        </section>

                        {/* Specifics */}
                        <section className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">Issue Date</label>
                                <input
                                    type="date"
                                    value={quoteData.issueDate}
                                    onChange={e => setQuoteData({ ...quoteData, issueDate: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/20 focus:border-primary outline-none py-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">Valid Until</label>
                                <input
                                    type="date"
                                    value={quoteData.validUntil}
                                    onChange={e => setQuoteData({ ...quoteData, validUntil: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/20 focus:border-primary outline-none py-1"
                                />
                            </div>
                        </section>

                        {/* Line Items */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Items</h2>
                            <div className="border border-white/10 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="p-3 text-left w-5/12">Description</th>
                                            <th className="p-3 text-right w-2/12">Qty</th>
                                            <th className="p-3 text-right w-3/12">Price</th>
                                            <th className="p-3 text-right w-2/12">Total</th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {quoteData.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Item name"
                                                        value={item.name}
                                                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                        className="w-full bg-transparent outline-none font-medium mb-1"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Description (optional)"
                                                        value={item.description}
                                                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                                                        className="w-full bg-transparent outline-none text-xs text-gray-500"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-transparent outline-none text-right"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={e => updateItem(item.id, 'unit_price', Number(e.target.value))}
                                                        className="w-full bg-transparent outline-none text-right"
                                                    />
                                                </td>
                                                <td className="p-2 text-right font-mono">
                                                    ${item.total.toFixed(2)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="flex gap-2 p-2 bg-white/5">
                                    <button
                                        onClick={addItem}
                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-primary font-medium transition-colors flex items-center justify-center gap-2 rounded-md border border-dashed border-white/20"
                                    >
                                        <Plus size={16} /> Add Empty Item
                                    </button>

                                    <div className="flex-1 relative group">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    addProductItem(e.target.value)
                                                    e.target.value = "" // Reset
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        >
                                            <option value="">Select product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors flex items-center justify-center gap-2 rounded-md border border-primary/20">
                                            <Package size={16} /> Add from Catalog
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Totals */}
                        <section className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Tax ({quoteData.taxRate}%)</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold pt-4 border-t border-white/10">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>

                {/* Right: Preview (Hidden on mobile) */}
                <div className="hidden lg:flex w-1/2 bg-gray-900/50 items-center justify-center p-8">
                    <div ref={componentRef} className="w-full max-w-lg bg-white text-black shadow-2xl rounded-sm p-8 h-full overflow-y-auto print:max-w-none print:w-full print:h-auto print:overflow-visible print:shadow-none print:m-0 print:p-8">
                        {/* PDF Preview Mockup */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                {company?.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" className="h-12 object-contain" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">No Logo</div>
                                )}
                                <div className="mt-4 text-sm text-gray-600">
                                    <strong>{company?.name || 'Your Company'}</strong><br />
                                    {company?.address}<br />
                                    {company?.email}<br />
                                    {company?.phone}
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">COTIZACIÓN</h1>
                                <div className="text-gray-500 mt-1"># {quoteData.quoteNumber || 'BORRADOR'}</div>
                                <div className="text-sm text-gray-600 mt-4">
                                    <strong>Fecha:</strong> {quoteData.issueDate}<br />
                                    <strong>Válido Hasta:</strong> {quoteData.validUntil || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 p-4 bg-gray-50 rounded-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Cliente</h3>
                            {quoteData.clientId ? (
                                (() => {
                                    const client = clients.find(c => c.id === quoteData.clientId)
                                    return client ? (
                                        <div className="text-sm text-gray-800">
                                            <strong>{client.name}</strong><br />
                                            {client.company}<br />
                                            {client.email}
                                        </div>
                                    ) : <div>Loading...</div>
                                })()
                            ) : (
                                <div className="text-sm text-gray-400 italic">Select a client...</div>
                            )}
                        </div>

                        <table className="w-full text-sm mb-8">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="text-left py-2 font-semibold text-gray-600">Descripción</th>
                                    <th className="text-right py-2 font-semibold text-gray-600">Cant.</th>
                                    <th className="text-right py-2 font-semibold text-gray-600">Precio</th>
                                    <th className="text-right py-2 font-semibold text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {quoteData.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-3">
                                            <div className="font-medium text-gray-800">{item.name || 'Item Name'}</div>
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                        </td>
                                        <td className="text-right py-3 text-gray-600">{item.quantity}</td>
                                        <td className="text-right py-3 text-gray-600">${item.unit_price.toFixed(2)}</td>
                                        <td className="text-right py-3 font-semibold text-gray-800">${item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end">
                            <div className="w-48 space-y-2 text-right">
                                <div className="text-sm text-gray-600 flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="text-sm text-gray-600 flex justify-between">
                                    <span>Impuesto ({quoteData.taxRate}%):</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 flex justify-between pt-2 border-t border-gray-200">
                                    <span>Total:</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
                            <p>¡Gracias por su preferencia!</p>
                            <div className="mt-4 flex items-center justify-center gap-1 opacity-50">
                                <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
                                <span>Creado con CotizaPro</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
