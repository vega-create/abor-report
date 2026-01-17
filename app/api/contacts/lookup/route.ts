import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const idNumber = searchParams.get('id_number')

  if (!idNumber) {
    return NextResponse.json(
      { error: '請提供身分證字號' },
      { status: 400 }
    )
  }

  // 根據身分證號查詢聯絡人
  const { data: contact, error } = await supabase
    .from('labor_contacts')
    .select('*')
    .eq('id_number', idNumber)
    .single()

  if (error || !contact) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({
    found: true,
    data: {
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      bank_name: contact.bank_name,
      bank_branch: contact.bank_branch,
      bank_account: contact.bank_account,
      id_card_front_url: contact.id_card_front_url,
      id_card_back_url: contact.id_card_back_url,
      bank_book_url: contact.bank_book_url,
      is_union_member: contact.is_union_member,
    }
  })
}
