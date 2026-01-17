import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token
  const body = await request.json()

  const {
    name,
    id_number,
    phone,
    email,
    address,
    bank_name,
    bank_branch,
    bank_account,
    is_union_member,
    signature_data,
    id_card_front_url,
    id_card_back_url,
    bank_book_url,
  } = body

  // 取得客戶端 IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

  // 1. 查詢勞報單
  const { data: report, error: reportError } = await supabase
    .from('labor_reports')
    .select('*')
    .eq('sign_token', token)
    .single()

  if (reportError || !report) {
    return NextResponse.json(
      { error: '找不到此勞報單' },
      { status: 404 }
    )
  }

  if (report.status === 'signed') {
    return NextResponse.json(
      { error: '此勞報單已簽名完成' },
      { status: 400 }
    )
  }

  // 2. 更新或建立聯絡人資料
  const { data: existingContact } = await supabase
    .from('labor_contacts')
    .select('id')
    .eq('id_number', id_number)
    .single()

  let contactId = existingContact?.id

  if (existingContact) {
    // 更新現有聯絡人
    await supabase
      .from('labor_contacts')
      .update({
        name,
        phone,
        email,
        address,
        bank_name,
        bank_branch,
        bank_account,
        is_union_member,
        id_card_front_url,
        id_card_back_url,
        bank_book_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingContact.id)
  } else {
    // 建立新聯絡人
    const { data: newContact } = await supabase
      .from('labor_contacts')
      .insert({
        company_id: report.company_id,
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
        bank_book_url,
      })
      .select('id')
      .single()

    contactId = newContact?.id
  }

  // 3. 更新勞報單狀態為已簽名
  const { error: updateError } = await supabase
    .from('labor_reports')
    .update({
      contact_id: contactId,
      payee_name: name,
      payee_id_number: id_number,
      payee_address: address,
      payee_bank_name: bank_name,
      payee_bank_account: bank_account,
      status: 'signed',
      signature_data,
      signed_at: new Date().toISOString(),
      signed_ip: ip,
    })
    .eq('id', report.id)

  if (updateError) {
    return NextResponse.json(
      { error: '簽名失敗，請重試' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: '簽名完成！',
  })
}
