import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 取得已連接的 LINE 群組列表
export async function GET() {
  try {
    const { data: groups, error } = await supabase
      .from('labor_line_groups')
      .select('*')
      .order('group_name', { ascending: true })
    
    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ groups: [] })
    }
    
    return NextResponse.json({ groups: groups || [] })
  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json({ groups: [] })
  }
}
