import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: '環境變數未設定' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const id = params.id

  // 先查詢勞報單基本資料
  const { data: report, error: reportError } = await supabase
    .from('labor_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (reportError || !report) {
    console.error('Report error:', reportError)
    return NextResponse.json(
      { error: '找不到此勞報單' },
      { status: 404 }
    )
  }

  // 查詢公司資料
  let company = null
  if (report.company_id) {
    const { data: companyData } = await supabase
      .from('labor_companies')
      .select('*')
      .eq('id', report.company_id)
      .single()
    company = companyData
  }

  // 查詢聯絡人資料
  let contact = null
  if (report.contact_id) {
    const { data: contactData } = await supabase
      .from('labor_contacts')
      .select('*')
      .eq('id', report.contact_id)
      .single()
    contact = contactData
  }

  return NextResponse.json({ 
    report: {
      ...report,
      labor_companies: company,
      labor_contacts: contact,
    }
  })
}
