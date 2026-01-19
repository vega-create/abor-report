'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calculator, Copy, Check, Link2, Loader2, Building2, User, Search, UserPlus, CheckCircle, MessageCircle, Send } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { useCompany } from '@/lib/company-context'

// 所得類別
const INCOME_TYPES = [
  { code: '50', name: '兼職薪資所得 (50)', desc: '兼職薪資、臨時工資' },
  { code: '9A', name: '執行業務所得 (9A)', desc: '講師費、顧問費、設計費' },
  { code: '9B', name: '稿費所得 (9B)', desc: '稿費、版稅、演講鐘點費' },
  { code: '92', name: '其他所得 (92)', desc: '競賽獎金、其他勞務' },
]

// 格式化金額
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount)
}

// 2025 年稅務計算
function calculateTax(grossAmount: number, incomeType: string, isUnionMember: boolean = false) {
  let incomeTax = 0
  let healthInsurance = 0
  let taxRate = 0
  let taxThreshold = 0
  let hiThreshold = 0
  
  switch (incomeType) {
    case '50':
      taxRate = 0.05
      taxThreshold = 88501
      hiThreshold = 28590
      if (grossAmount >= taxThreshold) {
        incomeTax = Math.floor(grossAmount * taxRate)
      }
      break
    case '9A':
    case '9B':
      taxRate = 0.1
      taxThreshold = 20010
      hiThreshold = 20000
      if (grossAmount >= taxThreshold) {
        incomeTax = Math.floor(grossAmount * taxRate)
      }
      break
    case '92':
      taxRate = 0
      taxThreshold = 0
      hiThreshold = 20000
      break
  }
  
  // 工會成員免扣健保
  if (!isUnionMember && grossAmount >= hiThreshold) {
    healthInsurance = Math.floor(grossAmount * 0.0211)
  }
  
  const netAmount = grossAmount - incomeTax - healthInsurance
  
  return { incomeTax, healthInsurance, netAmount, taxRate, taxThreshold, hiThreshold }
}

interface Contact {
  id: string
  name: string
  id_number: string
  phone: string
  email: string
  address: string
  bank_name: string
  bank_account: string
  is_union_member: boolean
  id_card_front_url?: string
  id_card_back_url?: string
  bank_book_url?: string
}

// 檢查聯絡人是否有完整資料（可以只需簽名）
const hasCompleteData = (contact: Contact) => {
  return !!(
    contact.id_number &&
    contact.address &&
    contact.bank_name &&
    contact.bank_account &&
    contact.id_card_front_url &&
    contact.id_card_back_url &&
    contact.bank_book_url
  )
}

interface LineGroup {
  id: string
  group_id: string
  group_name: string
}

export default function NewReportPage() {
  const router = useRouter()
  const { currentCompany, loading: companyLoading } = useCompany()
  
  // 聯絡人列表
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [searchContact, setSearchContact] = useState('')
  const [showContactList, setShowContactList] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  
  // LINE 群組
  const [lineGroups, setLineGroups] = useState<LineGroup[]>([])
  const [selectedLineGroup, setSelectedLineGroup] = useState<string>('')
  const [sendingLine, setSendingLine] = useState(false)
  const [lineSent, setLineSent] = useState(false)
  
  // 表單狀態
  const [payeeName, setPayeeName] = useState('')
  const [incomeType, setIncomeType] = useState('9A')
  const [grossAmount, setGrossAmount] = useState('')
  const [description, setDescription] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  
  // UI 狀態
  const [loading, setLoading] = useState(false)
  const [showSignLink, setShowSignLink] = useState(false)
  const [signLink, setSignLink] = useState('')
  const [reportNumber, setReportNumber] = useState('')
  const [reportGrossAmount, setReportGrossAmount] = useState(0)
  const [reportNetAmount, setReportNetAmount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [hasContact, setHasContact] = useState(false)
  
  // 載入聯絡人列表
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/contacts')
        const data = await res.json()
        setContacts(data.contacts || [])
      } catch (err) {
        console.error('載入聯絡人失敗', err)
      } finally {
        setLoadingContacts(false)
      }
    }
    fetchContacts()
  }, [])

  // 載入 LINE 群組列表
  useEffect(() => {
    const fetchLineGroups = async () => {
      try {
        const res = await fetch('/api/line/groups')
        const data = await res.json()
        setLineGroups(data.groups || [])
      } catch (err) {
        console.error('載入 LINE 群組失敗', err)
      }
    }
    fetchLineGroups()
  }, [])

  // 篩選聯絡人
  const filteredContacts = contacts.filter(c => 
    c.name.includes(searchContact) || 
    c.id_number?.includes(searchContact) ||
    c.phone?.includes(searchContact)
  )

  // 選擇聯絡人
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setPayeeName(contact.name)
    setShowContactList(false)
    setSearchContact('')
    
    if (hasCompleteData(contact)) {
      toast.success(`已選擇 ${contact.name}，資料完整，對方只需簽名`)
    } else {
      toast.info(`已選擇 ${contact.name}，對方需補填部分資料`)
    }
  }

  // 清除選擇
  const handleClearContact = () => {
    setSelectedContact(null)
    setPayeeName('')
  }
  
  // 即時計算（考慮工會成員）
  const calculation = useMemo(() => {
    const amount = parseFloat(grossAmount)
    if (isNaN(amount) || amount <= 0) return null
    return calculateTax(amount, incomeType, selectedContact?.is_union_member || false)
  }, [grossAmount, incomeType, selectedContact])

  // 產生簽名連結
  const handleGenerateLink = async () => {
    if (!currentCompany) {
      toast.error('請先選擇公司')
      return
    }
    if (!payeeName.trim()) {
      toast.error('請填寫領款人姓名')
      return
    }
    if (!grossAmount || parseFloat(grossAmount) <= 0) {
      toast.error('請填寫金額')
      return
    }
    if (!paymentDate) {
      toast.error('請填寫支付日期')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: currentCompany.id,
          contact_id: selectedContact?.id || null,
          payee_name: payeeName,
          income_type: incomeType,
          gross_amount: grossAmount,
          description,
          period_start: periodStart || null,
          period_end: periodEnd || null,
          payment_date: paymentDate,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || '建立失敗')
        return
      }
      
      const link = `${window.location.origin}/sign/${data.report.sign_token}`
      setSignLink(link)
      setReportNumber(data.report.report_number)
      setReportGrossAmount(data.report.gross_amount)
      setReportNetAmount(data.report.net_amount)
      setHasContact(data.report.has_contact)
      setLineSent(false)
      setShowSignLink(true)
      toast.success('已產生簽名連結！')
    } catch (error) {
      toast.error('產生連結失敗')
    } finally {
      setLoading(false)
    }
  }

  // 複製連結
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(signLink)
      setCopied(true)
      toast.success('已複製到剪貼簿')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('複製失敗')
    }
  }

  // 發送到 LINE
  const handleSendToLine = async () => {
    if (!selectedLineGroup) {
      toast.error('請選擇 LINE 群組')
      return
    }
    
    setSendingLine(true)
    try {
      const res = await fetch('/api/line/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedLineGroup,
          payeeName,
          grossAmount: reportGrossAmount,
          netAmount: reportNetAmount,
          signLink,
        }),
      })
      
      if (!res.ok) {
        throw new Error('發送失敗')
      }
      
      setLineSent(true)
      toast.success('已發送到 LINE 群組！')
    } catch (error) {
      toast.error('LINE 發送失敗，請稍後再試')
    } finally {
      setSendingLine(false)
    }
  }

  const selectedIncomeType = INCOME_TYPES.find(t => t.code === incomeType)

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    )
  }

  if (!currentCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 無法載入公司資料</h2>
          <p className="text-yellow-700 mb-4">請確認資料庫設定正確</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Toaster position="top-center" richColors />
      
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新增勞報單</h1>
          <p className="text-gray-500">選擇聯絡人或手動輸入，產生簽名連結</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左側：表單 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
            
            <div className="space-y-4">
              {/* 公司 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開立公司</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <Building2 className="w-5 h-5 text-red-700" />
                  <div>
                    <p className="font-medium text-gray-900">{currentCompany.name}</p>
                    <p className="text-sm text-gray-500">統編：{currentCompany.tax_id}</p>
                  </div>
                </div>
              </div>

              {/* 領款人選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  領款人 <span className="text-red-500">*</span>
                </label>
                
                {selectedContact ? (
                  // 已選擇聯絡人
                  <div className={`border-2 rounded-lg p-4 ${hasCompleteData(selectedContact) ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasCompleteData(selectedContact) ? 'bg-green-100' : 'bg-amber-100'}`}>
                          <CheckCircle className={`w-6 h-6 ${hasCompleteData(selectedContact) ? 'text-green-600' : 'text-amber-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedContact.name}</p>
                          <p className="text-sm text-gray-500">
                            {selectedContact.id_number || '尚無身分證'} · {selectedContact.bank_name || '尚無銀行資料'}
                          </p>
                          {selectedContact.is_union_member && (
                            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              工會成員（免扣健保）
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleClearContact}
                        className="text-sm text-gray-500 hover:text-red-600"
                      >
                        更換
                      </button>
                    </div>
                    {hasCompleteData(selectedContact) ? (
                      <p className="text-sm text-green-700 mt-3">
                        ✓ 資料完整，對方打開連結只需簽名
                      </p>
                    ) : (
                      <p className="text-sm text-amber-700 mt-3">
                        ⚠️ 資料不完整，對方需補填缺少的資料
                      </p>
                    )}
                  </div>
                ) : (
                  // 選擇聯絡人或手動輸入
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchContact || payeeName}
                            onChange={(e) => {
                              const v = e.target.value
                              setSearchContact(v)
                              setPayeeName(v)
                              setShowContactList(v.length > 0)
                            }}
                            onFocus={() => setShowContactList(true)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="輸入姓名搜尋或新增..."
                          />
                        </div>
                      </div>
                      
                      {/* 聯絡人下拉選單 */}
                      {showContactList && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowContactList(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                            {loadingContacts ? (
                              <div className="p-4 text-center text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                              </div>
                            ) : filteredContacts.length > 0 ? (
                              <>
                                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                                  選擇已有聯絡人
                                </div>
                                {filteredContacts.map(contact => (
                                  <button
                                    key={contact.id}
                                    onClick={() => handleSelectContact(contact)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasCompleteData(contact) ? 'bg-green-100' : 'bg-gray-100'}`}>
                                      <User className={`w-4 h-4 ${hasCompleteData(contact) ? 'text-green-600' : 'text-gray-600'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900">{contact.name}</p>
                                      <p className="text-sm text-gray-500 truncate">
                                        {contact.id_number || '尚無身分證'} {contact.bank_name && `· ${contact.bank_name}`}
                                      </p>
                                    </div>
                                    {hasCompleteData(contact) ? (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                        資料完整
                                      </span>
                                    ) : (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                        需補填
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </>
                            ) : searchContact ? (
                              <div className="p-4">
                                <p className="text-sm text-gray-500 mb-2">找不到「{searchContact}」</p>
                                <button
                                  onClick={() => {
                                    setPayeeName(searchContact)
                                    setShowContactList(false)
                                  }}
                                  className="flex items-center gap-2 text-sm text-red-700 hover:text-red-800"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  使用「{searchContact}」作為新領款人
                                </button>
                              </div>
                            ) : (
                              <div className="p-4 text-sm text-gray-500">
                                輸入姓名搜尋聯絡人...
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {!selectedContact && payeeName && !showContactList && (
                      <p className="text-sm text-amber-600">
                        ⚠️ 新領款人需要填寫完整資料
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所得類別 <span className="text-red-500">*</span>
                </label>
                <select
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {INCOME_TYPES.map((type) => (
                    <option key={type.code} value={type.code}>{type.name}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">{selectedIncomeType?.desc}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  金額 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">NT$</span>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 pl-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right text-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">勞務內容說明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：網站設計、活動主持、文案撰寫..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服務期間起</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服務期間迄</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  支付日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* 流程說明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">📋 流程說明</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li className="flex gap-2">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span><strong>選擇聯絡人</strong>（已有資料）或輸入新領款人姓名</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>填寫金額 → 系統自動計算代扣稅額</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>產生連結 → 選擇 LINE 群組發送或複製連結</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                <span>
                  {selectedContact && hasCompleteData(selectedContact)
                    ? <strong className="text-green-700">對方只需簽名即可 ✓</strong>
                    : selectedContact
                    ? '對方補填缺少的資料並簽名'
                    : '對方填寫資料並簽名'
                  }
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* 右側：計算結果 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-red-700" />
              <h2 className="text-lg font-semibold text-gray-900">金額試算</h2>
            </div>
            
            {calculation ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">總金額</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(grossAmount))}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="text-gray-600">代扣所得稅</span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({(calculation.taxRate * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <span className={`font-semibold ${calculation.incomeTax > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {calculation.incomeTax > 0 ? '-' : ''}{formatCurrency(calculation.incomeTax)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="text-gray-600">二代健保</span>
                    <span className="text-xs text-gray-400 ml-1">(2.11%)</span>
                  </div>
                  <span className={`font-semibold ${calculation.healthInsurance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {calculation.healthInsurance > 0 ? '-' : ''}{formatCurrency(calculation.healthInsurance)}
                    {selectedContact?.is_union_member && calculation.healthInsurance === 0 && (
                      <span className="text-xs text-blue-600 ml-1">工會免扣</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 bg-red-50 -mx-6 px-6 rounded-b-lg">
                  <span className="text-red-700 font-semibold">實付金額</span>
                  <span className="text-2xl font-bold text-red-700">
                    {formatCurrency(calculation.netAmount)}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1 pt-2">
                  <p>• 所得稅起扣點：{formatCurrency(calculation.taxThreshold)}</p>
                  <p>• 健保起扣點：{formatCurrency(calculation.hiThreshold)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>輸入金額後自動計算</p>
              </div>
            )}
          </div>

          {/* 產生連結按鈕 */}
          <button
            onClick={handleGenerateLink}
            disabled={loading || !calculation}
            className="w-full bg-red-700 text-white py-3 rounded-lg font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                處理中...
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5" />
                產生簽名連結
              </>
            )}
          </button>
        </div>
      </div>

      {/* 簽名連結彈窗 */}
      {showSignLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">簽名連結已產生！</h3>
              <p className="text-gray-500 text-sm mt-1">勞報單編號：{reportNumber}</p>
            </div>
            
            <p className="text-gray-600 mb-4 text-center">
              請將連結發送給 <strong>{payeeName}</strong>
            </p>
            
            {hasContact && selectedContact && hasCompleteData(selectedContact) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
                ✓ 資料完整，對方<strong>只需簽名</strong>即可完成
              </div>
            )}
            
            {hasContact && selectedContact && !hasCompleteData(selectedContact) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
                ⚠️ 已帶入部分資料，對方需<strong>補填缺少的資料</strong>後簽名
              </div>
            )}
            
            {/* LINE 發送區塊 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">發送到 LINE 群組</span>
              </div>
              
              {lineGroups.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedLineGroup}
                    onChange={(e) => setSelectedLineGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={lineSent}
                  >
                    <option value="">選擇群組...</option>
                    {lineGroups.map(group => (
                      <option key={group.id} value={group.group_id}>
                        {group.group_name}
                      </option>
                    ))}
                  </select>
                  
                  {lineSent ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span>已發送到 LINE 群組！</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendToLine}
                      disabled={!selectedLineGroup || sendingLine}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sendingLine ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          發送中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          發送到 LINE
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-700">
                  尚未連接 LINE 群組。請將 Bot 加入群組後即可使用此功能。
                </p>
              )}
            </div>
            
            {/* 複製連結區塊 */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">或手動複製連結：</p>
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg mb-4">
                <input
                  type="text"
                  value={signLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm font-mono outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleCopyLink} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" />
                複製連結
              </button>
              <button onClick={() => { setShowSignLink(false); router.push('/reports') }} className="flex-1 bg-red-700 text-white py-2 rounded-lg font-medium hover:bg-red-800">
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
