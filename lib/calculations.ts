/**
 * 勞報單計算邏輯 - 2025 年版
 * 參考：直誠會計事務所 雲端秘書
 */

// ============================================
// 2025 年扣繳規則
// ============================================
export const TAX_RULES_2025 = {
  // 所得稅扣繳
  incomeTax: {
    '50': { threshold: 88501, rate: 0.05 },   // 兼職所得：≥88,501 扣 5%
    '9A': { threshold: 20010, rate: 0.10 },   // 執行業務所得：≥20,010 扣 10%
    '9B': { threshold: 20010, rate: 0.10 },   // 稿費：≥20,010 扣 10%
    '92': { threshold: Infinity, rate: 0 },   // 其他所得：免扣繳
  },
  // 二代健保補充保費
  healthInsurance: {
    '50': { threshold: 28590, rate: 0.0211 }, // 兼職：≥基本工資 28,590 扣 2.11%
    '9A': { threshold: 20000, rate: 0.0211 }, // 執業：≥20,000 扣 2.11%
    '9B': { threshold: 20000, rate: 0.0211 }, // 稿費：≥20,000 扣 2.11%
    '92': { threshold: 20000, rate: 0.0211 }, // 其他：≥20,000 扣 2.11%
  },
  // 基本工資
  minimumWage: 28590,
}

// 所得類別名稱
export const INCOME_TYPE_NAMES: Record<string, string> = {
  '50': '兼職所得 (50)',
  '9A': '執行業務所得 (9A)',
  '9B': '稿費 (9B)',
  '92': '其他所得 (92)',
}

// 所得類別說明
export const INCOME_TYPE_DESC: Record<string, string> = {
  '50': '兼職薪資、臨時工資等',
  '9A': '講師費、顧問費、設計費等專業服務',
  '9B': '稿費、版稅、演講鐘點費等',
  '92': '競賽獎金、其他勞務所得等',
}

// ============================================
// 計算函數
// ============================================

export interface LaborReportCalculation {
  grossAmount: number      // 總金額
  incomeTax: number        // 代扣所得稅
  healthInsurance: number  // 二代健保
  netAmount: number        // 實付金額
  taxRate: number          // 所得稅率
  hiRate: number           // 健保費率
  taxThreshold: number     // 所得稅起扣點
  hiThreshold: number      // 健保起扣點
}

/**
 * 計算勞報單各項金額
 * @param grossAmount 總金額（稅前）
 * @param incomeType 所得類別 (50, 9A, 9B, 92)
 * @param isUnionMember 是否為工會成員（免扣二代健保）
 */
export function calculateLaborReport(
  grossAmount: number,
  incomeType: string,
  isUnionMember: boolean = false
): LaborReportCalculation {
  const taxRule = TAX_RULES_2025.incomeTax[incomeType as keyof typeof TAX_RULES_2025.incomeTax]
  const hiRule = TAX_RULES_2025.healthInsurance[incomeType as keyof typeof TAX_RULES_2025.healthInsurance]
  
  if (!taxRule || !hiRule) {
    throw new Error(`無效的所得類別: ${incomeType}`)
  }

  // 計算所得稅
  // 規則：達到起扣點才扣繳，無條件捨去至整數
  let incomeTax = 0
  if (grossAmount >= taxRule.threshold) {
    incomeTax = Math.floor(grossAmount * taxRule.rate)
  }

  // 計算二代健保補充保費
  // 規則：達到起扣點才扣繳（注意：剛好達到也要扣）
  // 工會成員免扣
  let healthInsurance = 0
  if (!isUnionMember && grossAmount >= hiRule.threshold) {
    healthInsurance = Math.floor(grossAmount * hiRule.rate)
  }

  // 實付金額
  const netAmount = grossAmount - incomeTax - healthInsurance

  return {
    grossAmount,
    incomeTax,
    healthInsurance,
    netAmount,
    taxRate: taxRule.rate,
    hiRate: hiRule.rate,
    taxThreshold: taxRule.threshold,
    hiThreshold: hiRule.threshold,
  }
}

/**
 * 格式化金額為台幣顯示格式
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 產生簽名 Token
 */
export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * 取得所得類別名稱
 */
export function getIncomeTypeName(type: string): string {
  return INCOME_TYPE_NAMES[type] || type
}

/**
 * 遮蔽身分證字號
 */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber || idNumber.length < 4) return idNumber
  return idNumber.slice(0, 4) + '****' + idNumber.slice(-2)
}

/**
 * 遮蔽銀行帳號
 */
export function maskBankAccount(account: string): string {
  if (!account || account.length < 4) return account
  return '****' + account.slice(-4)
}
