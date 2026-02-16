import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePlanLimits } from '../hooks/usePlanLimits'
import { Building2, Save, Upload, Image as ImageIcon, Crown, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Settings() {
    const { user, company, refreshCompany } = useAuth()
    const { plan, quoteCount, FREE_LIMIT, refreshLimits } = usePlanLimits()
    const [loading, setLoading] = useState(false)
    const [upgrading, setUpgrading] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        primary_color: '#3b82f6',
        tax_rate: 16,
        logo_url: ''
    })

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                email: company.email || '',
                phone: company.phone || '',
                address: company.address || '',
                primary_color: company.primary_color || '#3b82f6',
                tax_rate: company.tax_rate || 16,
                logo_url: company.logo_url || ''
            })
        }

        // Handle Stripe Return
        const params = new URLSearchParams(window.location.search)
        if (params.get('success')) {
            setMessage({ type: 'success', text: '¡Pago exitoso! Tu cuenta Pro se activará en unos segundos.' })
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
            // Refresh limits after a small delay to allow webhook processing
            setTimeout(refreshLimits, 2000)
        } else if (params.get('canceled')) {
            setMessage({ type: 'error', text: 'El proceso de pago fue cancelado.' })
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [company, refreshLimits])

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingLogo(true)
            const file = e.target.files?.[0]
            if (!file || !user) return

            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from('logos').getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, logo_url: data.publicUrl }))
            setMessage({ type: 'success', text: 'Logo subido con éxito. No olvides guardar los cambios.' })
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error al subir el logo: ' + error.message })
        } finally {
            setUploadingLogo(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !company) return
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.from('companies').update({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                primary_color: formData.primary_color,
                tax_rate: formData.tax_rate,
                logo_url: formData.logo_url,
                updated_at: new Date().toISOString()
            }).eq('id', company.id)

            if (error) throw error

            await refreshCompany()
            setMessage({ type: 'success', text: 'Configuración actualizada con éxito.' })
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error al actualizar: ' + error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleUpgrade = async () => {
        if (!user) return
        setUpgrading(true)
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout')

            if (error) throw error
            if (data?.url) {
                window.location.href = data.url
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error al procesar el pago: ' + error.message })
        } finally {
            setUpgrading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Ajustes</h1>

            {/* Plan & Subscription Section */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
                        <Crown size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Suscripción y Plan</h2>
                        <p className="text-sm text-gray-500">Gestiona tu nivel de acceso y límites</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${plan === 'pro' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                Plan Actual: {plan?.toUpperCase()}
                            </span>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">Uso de Cotizaciones</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {plan === 'pro' ? '∞' : quoteCount} / {plan === 'pro' ? '∞' : FREE_LIMIT}
                                </span>
                            </div>
                            {plan !== 'pro' && (
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${quoteCount >= FREE_LIMIT ? 'bg-red-500' : 'bg-primary'}`}
                                        style={{ width: `${Math.min((quoteCount / FREE_LIMIT) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                {plan === 'pro'
                                    ? 'Tienes acceso ilimitado a todas las funcionalidades.'
                                    : `Te quedan ${Math.max(FREE_LIMIT - quoteCount, 0)} cotizaciones gratuitas.`}
                            </p>
                        </div>
                    </div>

                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Crown size={80} />
                        </div>
                        {plan === 'pro' ? (
                            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                                <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold">¡Cuenta Pro Activa!</h3>
                                <p className="text-gray-400 text-sm">Disfrutas de todos los beneficios de la plataforma.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    Pásate a Pro
                                    <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-black uppercase">Oferta</span>
                                </h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-gray-300">
                                        <CheckCircle2 size={14} className="text-amber-500" /> Cotizaciones Ilimitadas
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-300">
                                        <CheckCircle2 size={14} className="text-amber-500" /> PDF sin marca de agua
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-300">
                                        <CheckCircle2 size={14} className="text-amber-500" /> Soporte prioritario
                                    </li>
                                </ul>
                                <button
                                    onClick={handleUpgrade}
                                    disabled={upgrading}
                                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {upgrading ? 'Procesando...' : 'Obtener Pro Ahora'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Información de la Empresa</h2>
                        <p className="text-sm text-gray-500">Actualiza los detalles que aparecen en tus cotizaciones</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Logo Upload Section */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Logo de la Empresa</label>
                        <div className="flex items-center gap-8">
                            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative group transition-all hover:border-primary/50">
                                {formData.logo_url ? (
                                    <img src={formData.logo_url} alt="Company Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <ImageIcon className="text-gray-300" size={32} />
                                )}
                                {uploadingLogo && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 inline-flex shadow-lg shadow-gray-200 active:scale-95">
                                    <Upload size={16} />
                                    {uploadingLogo ? 'Subiendo...' : 'Subir Nuevo Logo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                        disabled={uploadingLogo}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-3 font-medium">Tamaño recomendado: 200x200px. Máx: 2MB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Nombre de la Empresa</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all font-medium text-gray-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Correo Electrónico</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all font-medium text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all font-medium text-gray-900"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Dirección</label>
                            <textarea
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:outline-none h-28 transition-all font-medium text-gray-900 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Color de Marca</label>
                            <div className="flex items-center gap-4">
                                <div className="relative overflow-hidden w-14 h-14 rounded-2xl border-2 border-gray-100 shadow-sm transition-all hover:scale-105">
                                    <input
                                        type="color"
                                        value={formData.primary_color}
                                        onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                                        className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer border-none bg-transparent"
                                    />
                                </div>
                                <span className="text-sm font-bold text-gray-700 uppercase bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-inner">{formData.primary_color}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Impuesto Predeterminado (%)</label>
                            <input
                                type="number"
                                value={formData.tax_rate}
                                onChange={e => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all font-medium text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
