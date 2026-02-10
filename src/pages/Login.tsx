import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'


export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const navigate = useNavigate()

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            })
            if (error) throw error
        } catch (error: any) {
            alert(error.message)
        }
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                })
                if (error) throw error
                alert('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                navigate('/')
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <span className="text-white text-2xl font-bold italic">Q</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">
                        {isSignUp ? 'Únete a nosotros hoy mismo' : 'Ingresa para gestionar tus cotizaciones'}
                    </p>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {isSignUp ? 'Crear Cuenta' : 'Login'}
                    </h2>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 placeholder-gray-400"
                            placeholder="tu@ejemplo.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 placeholder-gray-400"
                            placeholder="••••••••"
                            required
                        />
                        {!isSignUp && (
                            <div className="flex justify-end mt-2">
                                <button type="button" className="text-xs text-primary hover:underline font-semibold">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-base shadow-md hover:bg-primary/90 hover:shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? 'Procesando...' : isSignUp ? 'Registrarse' : 'Entrar'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400">O ingresa con</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleGoogleSignIn}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            Google
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-gray-500 text-sm hover:text-primary transition-colors font-medium"
                        >
                            {isSignUp ? '¿Ya tienes cuenta? Ingresa aquí' : '¿No tienes cuenta? Registrate gratis'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
