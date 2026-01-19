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

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: '環境變數未設定' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const body = await request.json()

  const { data, error } = await supabase
    .from('labor_contacts')
    .insert({
      company_id: body.company_id,
      name: body.name,
      id_number: body.id_number,
      phone: body.phone,
      email: body.email,
      address: body.address,
      bank_name: body.bank_name,
      bank_branch: body.bank_branch,
      bank_account: body.bank_account,
      is_union_member: body.is_union_member || false,
    })
    .select()
    .single()

  if (error) {
    console.error('Insert error:', error)
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }

  return NextResponse.json({ success: true, contact: data })
}
