import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'


export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const navigate = useNavigate()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
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
        <div className="min-h-screen flex items-center justify-center bg-[#8c2ce6] font-sans">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden p-10">
                <h2 className="text-4xl font-bold text-center text-black mb-10 tracking-tight">
                    {isSignUp ? 'Sign Up' : 'Login'}
                </h2>

                <form onSubmit={handleAuth} className="space-y-8">
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-2 uppercase tracking-wider">User Name</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-200 outline-none focus:border-[#d946ef] transition-colors bg-transparent text-gray-800 placeholder-[#d946ef]/60"
                            placeholder={isSignUp ? "Enter your email" : "Your Name"}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-2 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-200 outline-none focus:border-[#d946ef] transition-colors bg-transparent text-gray-800 placeholder-[#d946ef]/60"
                            placeholder="Your Password"
                            required
                        />
                        <div className="flex justify-end mt-2">
                            <button type="button" className="text-sm text-[#7c3aed] hover:underline font-medium">
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] text-white py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-95 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 uppercase tracking-wide"
                        >
                            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
                        </button>
                    </div>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm mb-6">Or Signup using</p>
                    <div className="flex justify-center gap-6">
                        <button className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-md w-12 h-12 flex items-center justify-center border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                        </button>
                        <button className="p-2 rounded-full bg-white text-black hover:bg-gray-50 transition-colors shadow-md w-12 h-12 flex items-center justify-center border border-gray-100">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="lucide lucide-apple"
                            >
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.29-.93 3.93-.93 1.55 0 2.68.66 3.5 1.66-3.23 1.97-2.6 6.02.59 7.39-.41 1.25-1.15 2.59-2.28 4.11zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.54 4.33-3.74 4.25z" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-8 text-center bg-transparent border-none">
                        <p className="text-gray-400 text-xs mb-2">Or Signup using</p>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-gray-500 text-xs font-bold hover:text-[#d946ef] transition-colors tracking-widest uppercase"
                        >
                            {isSignUp ? 'SIGN IN' : 'SIGNUP'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
