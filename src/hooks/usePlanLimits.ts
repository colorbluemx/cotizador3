import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function usePlanLimits() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [plan, setPlan] = useState<string>('free')
    const [quoteCount, setQuoteCount] = useState(0)

    const checkLimits = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            // 1. Get User Plan
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', user.id)
                .single()

            const userPlan = profile?.plan || 'free'
            setPlan(userPlan)

            // 2. Get Quote Count
            const { count } = await supabase
                .from('quotes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            setQuoteCount(count || 0)

        } catch (error) {
            console.error('Error checking limits:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        checkLimits()
    }, [checkLimits])

    const FREE_LIMIT = 5
    const canCreateQuote = plan === 'pro' || quoteCount < FREE_LIMIT

    return { loading, plan, quoteCount, canCreateQuote, FREE_LIMIT, refreshLimits: checkLimits }
}
