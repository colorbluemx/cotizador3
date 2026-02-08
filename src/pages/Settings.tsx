import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Building2, Save, Upload, Image as ImageIcon } from 'lucide-react'

export default function Settings() {
    const { user, company, refreshCompany } = useAuth()
    const [loading, setLoading] = useState(false)
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
    }, [company])

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
            setMessage({ type: 'success', text: 'Logo uploaded successfully! Don\'t forget to save changes.' })
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error uploading logo: ' + error.message })
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
            setMessage({ type: 'success', text: 'Settings updated successfully!' })
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error updating settings: ' + error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="bg-card border border-white/5 rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Company Information</h2>
                        <p className="text-sm text-gray-400">Update your company details used in quotes</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Upload Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium mb-3 text-gray-400">Company Logo</label>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 overflow-hidden relative group">
                                {formData.logo_url ? (
                                    <img src={formData.logo_url} alt="Company Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="text-gray-500" size={32} />
                                )}
                                {uploadingLogo && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 inline-flex">
                                    <Upload size={16} />
                                    {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                        disabled={uploadingLogo}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2">Recommended size: 200x200px. Max size: 2MB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-gray-400">Company Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-400">Business Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-400">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2 text-gray-400">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-24 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-400">Brand Color</label>
                            <div className="flex items-center gap-3">
                                <div className="relative overflow-hidden w-12 h-12 rounded-lg border border-white/10">
                                    <input
                                        type="color"
                                        value={formData.primary_color}
                                        onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none bg-transparent"
                                    />
                                </div>
                                <span className="text-sm font-mono text-gray-400 uppercase bg-white/5 px-2 py-1 rounded">{formData.primary_color}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-400">Default Tax Rate (%)</label>
                            <input
                                type="number"
                                value={formData.tax_rate}
                                onChange={e => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-md p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
