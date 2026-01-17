import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: '環境變數未設定' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // id_card_front, id_card_back, bank_book

    if (!file) {
      return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
    }

    // 產生檔案名稱
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${type}_${timestamp}.${ext}`
    const filePath = `attachments/${fileName}`

    // 轉換為 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: '上傳失敗：' + error.message },
        { status: 500 }
      )
    }

    // 取得公開 URL
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: '上傳失敗' },
      { status: 500 }
    )
  }
}
