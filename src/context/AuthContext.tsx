import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Company = Database['public']['Tables']['companies']['Row']

interface AuthContextType {
    user: User | null
    session: Session | null
    company: Company | null
    loading: boolean
    refreshCompany: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [company, setCompany] = useState<Company | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchCompany = async (userId: string) => {
        const { data } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', userId)
            .single()
        setCompany(data)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchCompany(session.user.id).then(() => setLoading(false))
            } else {
                setLoading(false)
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchCompany(session.user.id)
            } else {
                setCompany(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const refreshCompany = async () => {
        if (user) await fetchCompany(user.id)
    }

    return (
        <AuthContext.Provider value={{ user, session, company, loading, refreshCompany }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
