import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token

  // 根據 token 查詢勞報單
  const { data: report, error } = await supabase
    .from('labor_reports')
    .select(`
      *,
      labor_companies (
        name,
        tax_id,
        responsible_person
      ),
      labor_contacts (
        id,
        name,
        id_number,
        phone,
        email,
        address,
        bank_name,
        bank_branch,
        bank_account,
        is_union_member,
        id_card_front_url,
        id_card_back_url,
        bank_book_url
      )
    `)
    .eq('sign_token', token)
    .single()

  if (error || !report) {
    return NextResponse.json(
      { error: '找不到此勞報單或連結已失效' },
      { status: 404 }
    )
  }

  // 檢查狀態
  if (report.status === 'signed') {
    return NextResponse.json(
      { error: '此勞報單已簽名完成' },
      { status: 400 }
    )
  }

  if (report.status === 'cancelled') {
    return NextResponse.json(
      { error: '此勞報單已取消' },
      { status: 400 }
    )
  }

  // 如果有關聯的聯絡人，返回資料
  const contact = report.labor_contacts
  const hasContact = !!contact
  
  // 檢查聯絡人資料是否完整（可以只需簽名）
  const hasCompleteData = hasContact && !!(
    contact.id_number &&
    contact.address &&
    contact.bank_name &&
    contact.bank_account &&
    contact.id_card_front_url &&
    contact.id_card_back_url &&
    contact.bank_book_url
  )

  return NextResponse.json({
    id: report.id,
    report_number: report.report_number,
    company_name: report.labor_companies?.name || '',
    income_type: report.income_type,
    description: report.description,
    period_start: report.period_start,
    period_end: report.period_end,
    payment_date: report.payment_date,
    gross_amount: report.gross_amount,
    income_tax: report.income_tax,
    health_insurance: report.health_insurance,
    net_amount: report.net_amount,
    payee_name: report.payee_name,
    status: report.status,
    // 聯絡人資料
    has_contact: hasContact,           // 有關聯聯絡人（可能只有部分資料）
    has_complete_data: hasCompleteData, // 資料完整，只需簽名
    contact: hasContact ? {
      name: contact.name,
      id_number: contact.id_number,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      bank_name: contact.bank_name,
      bank_branch: contact.bank_branch,
      bank_account: contact.bank_account,
      is_union_member: contact.is_union_member,
      id_card_front_url: contact.id_card_front_url,
      id_card_back_url: contact.id_card_back_url,
      bank_book_url: contact.bank_book_url,
    } : null,
  })
}
