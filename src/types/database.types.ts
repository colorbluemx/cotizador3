export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            clients: {
                Row: {
                    company: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    name: string
                    phone: string | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    company?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    name: string
                    phone?: string | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    company?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    name?: string
                    phone?: string | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "clients_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            companies: {
                Row: {
                    address: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    logo_url: string | null
                    name: string | null
                    phone: string | null
                    primary_color: string | null
                    tax_rate: number | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string | null
                    phone?: string | null
                    primary_color?: string | null
                    tax_rate?: number | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string | null
                    phone?: string | null
                    primary_color?: string | null
                    tax_rate?: number | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "companies_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    price: number | null
                    unit: string | null
                    sku: string | null
                    tax: number | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    price?: number | null
                    unit?: string | null
                    sku?: string | null
                    tax?: number | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    price?: number | null
                    unit?: string | null
                    sku?: string | null
                    tax?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "products_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    plan: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    plan?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    plan?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            quote_items: {
                Row: {
                    description: string | null
                    id: string
                    name: string
                    quantity: number | null
                    quote_id: string
                    total: number | null
                    unit_price: number | null
                }
                Insert: {
                    description?: string | null
                    id?: string
                    name: string
                    quantity?: number | null
                    quote_id: string
                    total?: number | null
                    unit_price?: number | null
                }
                Update: {
                    description?: string | null
                    id?: string
                    name?: string
                    quantity?: number | null
                    quote_id?: string
                    total?: number | null
                    unit_price?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "quote_items_quote_id_fkey"
                        columns: ["quote_id"]
                        isOneToOne: false
                        referencedRelation: "quotes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            quotes: {
                Row: {
                    client_id: string | null
                    company_id: string | null
                    created_at: string | null
                    id: string
                    issue_date: string | null
                    public_token: string | null
                    quote_number: string | null
                    status: string | null
                    subtotal: number | null
                    tax: number | null
                    total: number | null
                    updated_at: string | null
                    user_id: string
                    valid_until: string | null
                }
                Insert: {
                    client_id?: string | null
                    company_id?: string | null
                    created_at?: string | null
                    id?: string
                    issue_date?: string | null
                    public_token?: string | null
                    quote_number?: string | null
                    status?: string | null
                    subtotal?: number | null
                    tax?: number | null
                    total?: number | null
                    updated_at?: string | null
                    user_id: string
                    valid_until?: string | null
                }
                Update: {
                    client_id?: string | null
                    company_id?: string | null
                    created_at?: string | null
                    id?: string
                    issue_date?: string | null
                    public_token?: string | null
                    quote_number?: string | null
                    status?: string | null
                    subtotal?: number | null
                    tax?: number | null
                    total?: number | null
                    updated_at?: string | null
                    user_id?: string
                    valid_until?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "quotes_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quotes_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quotes_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            subscriptions: {
                Row: {
                    created_at: string | null
                    current_period_end: string | null
                    current_period_start: string | null
                    id: string
                    plan: string
                    status: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    current_period_end?: string | null
                    current_period_start?: string | null
                    id?: string
                    plan: string
                    status: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    current_period_end?: string | null
                    current_period_start?: string | null
                    id?: string
                    plan?: string
                    status?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
