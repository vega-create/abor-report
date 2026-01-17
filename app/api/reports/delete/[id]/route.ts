import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 刪除單筆勞報單
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id

  const { error } = await supabase
    .from('labor_reports')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json(
      { error: '刪除失敗：' + error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
