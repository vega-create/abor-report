import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 更新聯絡人
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const body = await request.json()

  const { error } = await supabase
    .from('labor_contacts')
    .update({
      name: body.name,
      id_number: body.id_number,
      phone: body.phone,
      email: body.email,
      address: body.address,
      bank_name: body.bank_name,
      bank_branch: body.bank_branch,
      bank_account: body.bank_account,
      is_union_member: body.is_union_member || false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// 刪除聯絡人
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id

  const { error } = await supabase
    .from('labor_contacts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
