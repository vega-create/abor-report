import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: '環境變數未設定', contacts: [] }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: contacts, error } = await supabase
    .from('labor_contacts')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Query error:', error)
    return NextResponse.json({ error: '查詢失敗', contacts: [] }, { status: 500 })
  }

  return NextResponse.json({ contacts: contacts || [] })
}
