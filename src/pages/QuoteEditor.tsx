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
        discountPercent: 0,
        currency: 'USD',
        notes: '',
        includes: ''
    })

    useEffect(() => {
        if (!user?.id) return

        // Fetch Clients & Products
        const fetchData = async () => {
            const { data: clientsData } = await supabase.from('clients').select('*').eq('user_id', user.id)
            if (clientsData) setClients(clientsData)

            const { data: productsData } = await supabase.from('products').select('*').eq('user_id', user.id)
            if (productsData) setProducts(productsData)
        }
        fetchData()
    }, [user?.id])

    useEffect(() => {
        if (!user?.id || !id || id === 'new') return

        const fetchQuote = async () => {
            const { data: quote } = await supabase
                .from('quotes')
                .select('*, quote_items(*)')
                .eq('id', id)
                .single()

            if (quote) {
                setQuoteData(prev => ({
                    ...prev,
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
                    taxRate: Number(quote.tax_rate) || 0,
                    discountPercent: Number(quote.discount_amount) || 0,
                    notes: quote.notes || '',
                    includes: quote.includes || ''
                }))
            }
        }
        fetchQuote()
    }, [user?.id, id])

    // Calculation Helpers
    const subtotal = quoteData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const discountValue = (subtotal * quoteData.discountPercent) / 100
    const taxableAmount = Math.max(0, subtotal - discountValue)
    const taxAmount = (taxableAmount * quoteData.taxRate) / 100
    const total = taxableAmount + taxAmount

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
                tax_rate: quoteData.taxRate,
                tax: taxAmount,
                discount_amount: quoteData.discountPercent,
                total,
                notes: quoteData.notes,
                includes: quoteData.includes,
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
                                    onChange={(e) => setQuoteData(prev => ({ ...prev, clientId: e.target.value }))}
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
                                    onChange={e => setQuoteData(prev => ({ ...prev, issueDate: e.target.value }))}
                                    className="w-full bg-transparent border-b border-white/20 focus:border-primary outline-none py-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">Valid Until</label>
                                <input
                                    type="date"
                                    value={quoteData.validUntil}
                                    onChange={e => setQuoteData(prev => ({ ...prev, validUntil: e.target.value }))}
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
                                    <span>Descuento (%)</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quoteData.discountPercent}
                                        onChange={e => setQuoteData(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
                                        className="w-24 bg-transparent border-b border-white/20 focus:border-primary outline-none text-right text-gray-400"
                                    />
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Impuesto ({quoteData.taxRate}%)</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold pt-4 border-t border-white/10">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                        {/* Incluye / Observaciones */}
                        <section className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">Incluye / Notas Adicionales</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Incluye</label>
                                    <textarea
                                        value={quoteData.includes}
                                        onChange={e => setQuoteData(prev => ({ ...prev, includes: e.target.value }))}
                                        placeholder="Ej: Instalación, Garantía por 1 año, Envío gratis..."
                                        rows={2}
                                        className="w-full p-3 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none text-sm resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Observaciones</label>
                                    <textarea
                                        value={quoteData.notes}
                                        onChange={e => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Términos de pago, condiciones especiales..."
                                        rows={2}
                                        className="w-full p-3 rounded-md bg-white/5 border border-white/10 focus:border-primary focus:outline-none text-sm resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                    </div>
                </div>

                <div className="hidden lg:flex w-1/2 bg-gray-900/50 items-start justify-center p-4 overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Scaling Wrapper to fit A4 on screen */}
                    <div className="w-full flex items-center justify-center pointer-events-none scale-[0.6] xl:scale-[0.7] 2xl:scale-[0.8] origin-top my-8">
                        <div ref={componentRef} className="w-[210mm] h-[297mm] bg-white text-black shadow-2xl rounded-sm p-[15mm] print:shadow-none print:m-0 print:p-[10mm] relative shrink-0 pointer-events-auto overflow-hidden">
                            {/* PDF Preview Mockup */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    {company?.logo_url ? (
                                        <img src={company.logo_url} alt="Logo" className="h-[58px] object-contain" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">No Logo</div>
                                    )}
                                    <div className="mt-1 text-[11px] text-gray-600">
                                        <strong>{company?.name || 'Your Company'}</strong><br />
                                        {company?.address}<br />
                                        {company?.email}<br />
                                        {company?.phone}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">COTIZACIÓN</h1>
                                    <div className="text-gray-500 text-[11px] mt-0.5"># {quoteData.quoteNumber || 'BORRADOR'}</div>
                                    <div className="text-[11px] text-gray-600 mt-1">
                                        <strong>Fecha:</strong> {quoteData.issueDate}<br />
                                        <strong>Válido Hasta:</strong> {quoteData.validUntil || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 flex justify-between gap-4 border-y border-gray-100 py-2 text-[11px]">
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-bold text-gray-400 uppercase mb-0.5">Cliente</h3>
                                    {quoteData.clientId ? (
                                        (() => {
                                            const client = clients.find(c => c.id === quoteData.clientId)
                                            return client ? (
                                                <div className="font-semibold text-gray-800 truncate">{client.name}</div>
                                            ) : <div className="text-gray-400 animate-pulse">Cargando...</div>
                                        })()
                                    ) : (
                                        <div className="text-gray-400 italic">-</div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-bold text-gray-400 uppercase mb-0.5">Empresa</h3>
                                    {quoteData.clientId ? (
                                        (() => {
                                            const client = clients.find(c => c.id === quoteData.clientId)
                                            return client ? (
                                                <div className="text-gray-800 truncate">{client.company || '-'}</div>
                                            ) : null
                                        })()
                                    ) : (
                                        <div className="text-gray-400 italic">-</div>
                                    )}
                                </div>
                                <div className="flex-[1.8] overflow-hidden">
                                    <h3 className="font-bold text-gray-400 uppercase mb-0.5">Email</h3>
                                    {quoteData.clientId ? (
                                        (() => {
                                            const client = clients.find(c => c.id === quoteData.clientId)
                                            return client ? (
                                                <div className="text-gray-800 truncate">{client.email || '-'}</div>
                                            ) : null
                                        })()
                                    ) : (
                                        <div className="text-gray-400 italic">-</div>
                                    )}
                                </div>
                                <div className="flex-1 text-right overflow-hidden">
                                    <h3 className="font-bold text-gray-400 uppercase mb-0.5">Teléfono</h3>
                                    {quoteData.clientId ? (
                                        (() => {
                                            const client = clients.find(c => c.id === quoteData.clientId)
                                            return client ? (
                                                <div className="text-gray-800 truncate">{client.phone || '-'}</div>
                                            ) : null
                                        })()
                                    ) : (
                                        <div className="text-gray-400 italic">-</div>
                                    )}
                                </div>
                            </div>

                            <table className="w-full text-[11px] mb-6">
                                <thead>
                                    <tr className="border-b border-gray-300">
                                        <th className="text-left py-1 font-semibold text-gray-600">Descripción</th>
                                        <th className="text-right py-1 font-semibold text-gray-600">Cant.</th>
                                        <th className="text-right py-1 font-semibold text-gray-600">Precio</th>
                                        <th className="text-right py-1 font-semibold text-gray-600">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {quoteData.items.map(item => (
                                        <tr key={item.id}>
                                            <td className="py-2">
                                                <div className="font-medium text-gray-800">{item.name || 'Item Name'}</div>
                                                <div className="text-[10px] text-gray-500">{item.description}</div>
                                            </td>
                                            <td className="text-right py-2 text-gray-600">{item.quantity}</td>
                                            <td className="text-right py-2 text-gray-600">${item.unit_price.toFixed(2)}</td>
                                            <td className="text-right py-2 font-semibold text-gray-800">${item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-between items-start">
                                <div className="w-1/2 text-left pr-4">
                                    {quoteData.includes && (
                                        <div className="bg-gray-50/50 p-2 rounded-sm border border-gray-100 min-w-0">
                                            <h4 className="text-[8px] font-bold text-gray-400 uppercase mb-1">Incluye:</h4>
                                            <p className="text-[9px] text-gray-600 whitespace-pre-wrap break-words">
                                                {quoteData.includes.match(new RegExp('.{1,80}', 'g'))?.join('\n')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="w-40 space-y-1 text-right">
                                    <div className="text-[11px] text-gray-600 flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-600 flex justify-between gap-2">
                                        <span className="whitespace-nowrap">Descuento ({quoteData.discountPercent}%):</span>
                                        <span>-${discountValue.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-600 flex justify-between">
                                        <span>Impuesto ({quoteData.taxRate}%):</span>
                                        <span>${taxAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 flex justify-between pt-1 border-t border-gray-200">
                                        <span>Total:</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-100 text-center text-[9px] text-gray-400">
                                {quoteData.notes && (
                                    <div className="mb-4 text-left p-2 bg-gray-50 rounded-sm italic text-gray-600 border-l-2 border-primary/20">
                                        <h4 className="text-[8px] font-bold text-gray-400 uppercase mb-0.5 not-italic">Observaciones</h4>
                                        <p className="whitespace-pre-wrap">{quoteData.notes}</p>
                                    </div>
                                )}
                                <p>¡Gracias por su preferencia!</p>
                                <div className="mt-2 flex items-center justify-center gap-1 opacity-50">
                                    <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                                    <span>Creado con CotizaPro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
