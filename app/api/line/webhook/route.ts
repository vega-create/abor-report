import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// LINE Webhook - 接收事件並記錄群組 ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 處理每個事件
    for (const event of body.events || []) {
      // Bot 加入群組事件
      if (event.type === 'join' && event.source.type === 'group') {
        const groupId = event.source.groupId
        
        // 取得群組資訊
        const groupInfo = await getGroupInfo(groupId)
        
        // 儲存到資料庫
        await supabase
          .from('labor_line_groups')
          .upsert({
            group_id: groupId,
            group_name: groupInfo?.groupName || '未命名群組',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'group_id' })
        
        // 回覆確認訊息
        await sendLineMessage(groupId, '✅ 勞報單系統已連接此群組！\n\n之後產生的簽名連結可以直接發送到這裡。')
      }
      
      // 處理文字訊息（查詢群組 ID）
      if (event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === '!groupid' && event.source.type === 'group') {
          await sendLineMessage(event.source.groupId, `📋 此群組 ID：\n${event.source.groupId}`)
        }
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE Webhook error:', error)
    return NextResponse.json({ success: true }) // LINE 需要 200 回應
  }
}

// 取得群組資訊
async function getGroupInfo(groupId: string) {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
      headers: {
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (error) {
    console.error('Get group info error:', error)
  }
  return null
}

// 發送 LINE 訊息
async function sendLineMessage(to: string, text: string) {
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text }],
      }),
    })
  } catch (error) {
    console.error('Send LINE message error:', error)
  }
}

// GET - 驗證 webhook
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
