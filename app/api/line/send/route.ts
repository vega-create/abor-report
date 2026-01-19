import { NextRequest, NextResponse } from 'next/server'

// 發送勞報單簽名連結到 LINE 群組
export async function POST(request: NextRequest) {
  try {
    const { groupId, payeeName, grossAmount, netAmount, signLink } = await request.json()
    
    if (!groupId || !payeeName || !signLink) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
    }
    
    // 格式化金額
    const formatAmount = (amount: number) => 
      new Intl.NumberFormat('zh-TW').format(amount)
    
    // 組合訊息
    const message = `📋 勞報單簽署通知

👤 領款人：${payeeName}
💰 總金額：NT$ ${formatAmount(grossAmount)}
💵 實付金額：NT$ ${formatAmount(netAmount)}

請點擊下方連結完成簽署：
${signLink}

⚠️ 此連結為一次性使用，簽署後即失效`

    // 發送到 LINE
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: groupId,
        messages: [{ type: 'text', text: message }],
      }),
    })
    
    if (!res.ok) {
      const error = await res.json()
      console.error('LINE API error:', error)
      return NextResponse.json({ error: 'LINE 發送失敗' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send to LINE error:', error)
    return NextResponse.json({ error: '發送失敗' }, { status: 500 })
  }
}
