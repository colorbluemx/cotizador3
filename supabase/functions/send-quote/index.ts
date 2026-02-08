import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { quote_id, email } = await req.json()

        if (!quote_id || !email) {
            throw new Error('Missing quote_id or email')
        }

        // 1. Fetch Quote Details
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('*, items:quote_items(*), client:clients(*), company:companies(*)')
            .eq('id', quote_id)
            .single()

        if (quoteError || !quote) {
            throw new Error('Quote not found')
        }

        // 2. Generate HTML (Simple version)
        const htmlContent = `
      <h1>Quote #${quote.quote_number}</h1>
      <p>Dear ${quote.client?.name},</p>
      <p>Here is the quote from <strong>${quote.company?.name}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: right;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map((item: any) => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px;">
                <strong>${item.name}</strong><br/>
                <span style="color: #666; font-size: 12px;">${item.description || ''}</span>
              </td>
              <td style="padding: 10px; text-align: right;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right;">$${item.unit_price}</td>
              <td style="padding: 10px; text-align: right;">$${item.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px; text-align: right;">
        <p><strong>Subtotal:</strong> $${quote.subtotal}</p>
        <p><strong>Tax:</strong> $${quote.tax}</p>
        <h2>Total: $${quote.total}</h2>
      </div>

      <p style="margin-top: 40px; font-size: 12px; color: #888;">
        Valid until: ${quote.valid_until || 'N/A'}
      </p>
    `

        // 3. Send Email via Resend
        const { data, error } = await resend.emails.send({
            from: 'CotizaPro <onboarding@resend.dev>', // Should be configured by user
            to: [email],
            subject: `New Quote: ${quote.quote_number} from ${quote.company?.name}`,
            html: htmlContent,
        })

        if (error) {
            console.error('Resend Error:', error)
            throw error
        }

        // 4. Update Quote Status
        await supabase
            .from('quotes')
            .update({ status: 'sent', updated_at: new Date().toISOString() })
            .eq('id', quote_id)

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
