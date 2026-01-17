import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 檢查環境變數
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    return NextResponse.json(
      { error: '環境變數未設定', companies: [] },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: companies, error } = await supabase
    .from('labor_companies')
    .select('*')
    .order('name')

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json(
      { error: '查詢失敗: ' + error.message, companies: [] },
      { status: 500 }
    )
  }

  return NextResponse.json({ companies: companies || [] })
}
