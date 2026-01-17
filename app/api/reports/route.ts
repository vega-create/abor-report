import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 產生簡單的 token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 2025 年稅務計算
function calculateTax(grossAmount: number, incomeType: string, isUnionMember: boolean = false) {
  let incomeTax = 0
  let healthInsurance = 0
  
  // 所得稅
  switch (incomeType) {
    case '50': // 兼職薪資
      if (grossAmount >= 88501) {
        incomeTax = Math.floor(grossAmount * 0.05)
      }
      break
    case '9A': // 執行業務
    case '9B': // 稿費
      if (grossAmount >= 20010) {
        incomeTax = Math.floor(grossAmount * 0.1)
      }
      break
    case '92': // 其他所得
      // 免扣繳
      break
  }
  
  // 二代健保（工會成員免扣）
  if (!isUnionMember) {
    const threshold = incomeType === '50' ? 28590 : 20000
    if (grossAmount >= threshold) {
      healthInsurance = Math.floor(grossAmount * 0.0211)
    }
  }
  
  const netAmount = grossAmount - incomeTax - healthInsurance
  
  return { incomeTax, healthInsurance, netAmount }
}

// 產生勞報單編號
async function generateReportNumber(companyId: string) {
  const year = new Date().getFullYear()
  
  const { count } = await supabase
    .from('labor_reports')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', `${year}-01-01`)
  
  const num = (count || 0) + 1
  return `LR-${year}-${String(num).padStart(4, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      company_id,
      payee_name,
      contact_id, // 新增：聯絡人 ID
      income_type,
      gross_amount,
      description,
      period_start,
      period_end,
      payment_date,
    } = body

    // 驗證必填欄位
    if (!company_id || !payee_name || !income_type || !gross_amount || !payment_date) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位' },
        { status: 400 }
      )
    }

    // 如果有選擇聯絡人，查詢聯絡人資料
    let contactData = null
    if (contact_id) {
      const { data } = await supabase
        .from('labor_contacts')
        .select('*')
        .eq('id', contact_id)
        .single()
      contactData = data
    }

    // 計算稅額（考慮工會成員）
    const isUnionMember = contactData?.is_union_member || false
    const { incomeTax, healthInsurance, netAmount } = calculateTax(
      parseFloat(gross_amount),
      income_type,
      isUnionMember
    )

    // 產生編號和 token
    const reportNumber = await generateReportNumber(company_id)
    const signToken = generateToken()

    // 新增勞報單（帶入聯絡人資料）
    const { data: report, error } = await supabase
      .from('labor_reports')
      .insert({
        company_id,
        contact_id: contact_id || null,
        report_number: reportNumber,
        payee_name,
        payee_id_number: contactData?.id_number || null,
        payee_address: contactData?.address || null,
        payee_bank_name: contactData?.bank_name || null,
        payee_bank_account: contactData?.bank_account || null,
        income_type,
        description,
        period_start: period_start || null,
        period_end: period_end || null,
        payment_date,
        gross_amount: parseFloat(gross_amount),
        income_tax: incomeTax,
        health_insurance: healthInsurance,
        net_amount: netAmount,
        sign_token: signToken,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: '建立失敗：' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        report_number: report.report_number,
        sign_token: report.sign_token,
        gross_amount: report.gross_amount,
        income_tax: report.income_tax,
        health_insurance: report.health_insurance,
        net_amount: report.net_amount,
        has_contact: !!contact_id, // 告訴前端是否已帶入聯絡人
      }
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

// 取得勞報單列表
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: '環境變數未設定', reports: [] }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('labor_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: reports, error } = await query

  if (error) {
    console.error('Query error:', error)
    return NextResponse.json(
      { error: '查詢失敗: ' + error.message, reports: [] },
      { status: 500 }
    )
  }

  return NextResponse.json({ reports: reports || [] })
}
