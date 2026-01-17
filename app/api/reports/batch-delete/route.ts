import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 批量刪除勞報單
export async function POST(request: NextRequest) {
  const { ids } = await request.json()

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: '請提供要刪除的 ID' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('labor_reports')
    .delete()
    .in('id', ids)

  if (error) {
    return NextResponse.json(
      { error: '刪除失敗：' + error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: ids.length })
}
