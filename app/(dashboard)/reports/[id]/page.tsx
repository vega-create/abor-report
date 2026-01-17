'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, FileText, Printer, Download, FileSpreadsheet,
  User, Building2, CreditCard, CheckCircle, Clock, Send, 
  XCircle, Loader2, Image as ImageIcon
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

// 格式化金額
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount)
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

// 所得類別名稱
const INCOME_TYPE_NAMES: Record<string, string> = {
  '50': '兼職薪資所得 (50)',
  '9A': '執行業務所得 (9A)',
  '9B': '稿費所得 (9B)',
  '92': '其他所得 (92)',
}

const statusConfig = {
  draft: { label: '草稿', icon: Clock, className: 'bg-gray-100 text-gray-700' },
  pending: { label: '待簽名', icon: Send, className: 'bg-yellow-100 text-yellow-800' },
  signed: { label: '已簽名', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', icon: XCircle, className: 'bg-red-100 text-red-800' },
}

interface Report {
  id: string
  report_number: string
  payee_name: string
  payee_id_number: string
  payee_address: string
  payee_bank_name: string
  payee_bank_account: string
  income_type: string
  description: string
  period_start: string
  period_end: string
  payment_date: string
  gross_amount: number
  income_tax: number
  health_insurance: number
  net_amount: number
  status: string
  signature_data: string
  signed_at: string
  signed_ip: string
  created_at: string
  labor_companies: {
    name: string
    tax_id: string
    responsible_person: string
  }
  labor_contacts: {
    name: string
    id_number: string
    phone: string
    email: string
    address: string
    bank_name: string
    bank_branch: string
    bank_account: string
    id_card_front_url: string
    id_card_back_url: string
    bank_book_url: string
  } | null
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/detail/${id}`)
        const data = await res.json()
        
        if (!res.ok) {
          setError(data.error || '載入失敗')
          return
        }
        
        setReport(data.report)
      } catch (err) {
        setError('無法載入資料')
      } finally {
        setLoading(false)
      }
    }
    
    fetchReport()
  }, [id])

  // 列印
  const handlePrint = () => {
    window.print()
  }

  // 下載 PDF（使用瀏覽器列印功能）
  const handleDownloadPDF = () => {
    toast.info('請在列印對話框中選擇「儲存為 PDF」')
    setTimeout(() => {
      window.print()
    }, 500)
  }

  // 匯出 Excel（CSV 格式）- 含完整報稅資料
  const handleExportExcel = () => {
    if (!report) return
    
    const contact = report.labor_contacts
    const company = report.labor_companies
    
    const INCOME_TYPE_CODES: Record<string, string> = {
      '50': '50',
      '9A': '9A',
      '9B': '9B',
      '92': '92',
    }
    
    const csvContent = [
      ['公司名稱', '公司統編', '勞報單編號', '領款人姓名', '身分證字號', '戶籍地址', '所得類別', '所得代碼', '總金額', '代扣所得稅', '二代健保', '實付金額', '銀行名稱', '銀行帳號', '支付日期', '簽名日期'],
      [
        company?.name || '',
        company?.tax_id || '',
        report.report_number,
        report.payee_name,
        report.payee_id_number || contact?.id_number || '',
        report.payee_address || contact?.address || '',
        INCOME_TYPE_NAMES[report.income_type] || report.income_type,
        INCOME_TYPE_CODES[report.income_type] || report.income_type,
        report.gross_amount,
        report.income_tax,
        report.health_insurance,
        report.net_amount,
        report.payee_bank_name || contact?.bank_name || '',
        report.payee_bank_account || contact?.bank_account || '',
        report.payment_date,
        report.signed_at ? formatDate(report.signed_at) : ''
      ]
    ]
    
    // 加入 BOM 讓 Excel 正確顯示中文
    const BOM = '\uFEFF'
    const csvString = BOM + csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.report_number}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('已下載 CSV 檔案')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">載入失敗</h2>
          <p className="text-red-700 mb-4">{error || '找不到此勞報單'}</p>
          <Link href="/reports" className="text-red-700 hover:underline">
            返回列表
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.draft
  const StatusIcon = status.icon
  const contact = report.labor_contacts

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Toaster position="top-center" richColors />
      
      {/* 頁面標題 - 不列印 */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{report.report_number}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>
            <p className="text-gray-500">{report.payee_name} · {INCOME_TYPE_NAMES[report.income_type]}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            列印
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            下載 PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileSpreadsheet className="w-4 h-4" />
            匯出 Excel
          </button>
        </div>
      </div>

      {/* 勞報單內容 - 可列印 */}
      <div className="bg-white rounded-lg shadow print:shadow-none print:border">
        {/* 標題區 */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">勞務報酬單</h2>
              <p className="text-gray-500">{report.labor_companies?.name}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{report.report_number}</p>
              <p className="text-sm text-gray-500">建立日期：{formatDate(report.created_at)}</p>
            </div>
          </div>
        </div>

        {/* 勞務資訊 */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-700" />
            勞務資訊
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">所得類別</p>
              <p className="font-medium">{INCOME_TYPE_NAMES[report.income_type]}</p>
            </div>
            <div>
              <p className="text-gray-500">支付日期</p>
              <p className="font-medium">{formatDate(report.payment_date)}</p>
            </div>
            {report.description && (
              <div className="col-span-2">
                <p className="text-gray-500">勞務內容</p>
                <p className="font-medium">{report.description}</p>
              </div>
            )}
            {report.period_start && (
              <div className="col-span-2">
                <p className="text-gray-500">服務期間</p>
                <p className="font-medium">{formatDate(report.period_start)} ~ {formatDate(report.period_end)}</p>
              </div>
            )}
          </div>
        </div>

        {/* 金額明細 */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4">金額明細</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">總金額</span>
              <span className="text-lg font-semibold">{formatCurrency(report.gross_amount)}</span>
            </div>
            {report.income_tax > 0 && (
              <div className="flex justify-between items-center py-2 text-red-600">
                <span>代扣所得稅 ({report.income_type === '50' ? '5%' : '10%'})</span>
                <span>-{formatCurrency(report.income_tax)}</span>
              </div>
            )}
            {report.health_insurance > 0 && (
              <div className="flex justify-between items-center py-2 text-red-600">
                <span>二代健保 (2.11%)</span>
                <span>-{formatCurrency(report.health_insurance)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-t border-dashed">
              <span className="text-lg font-semibold text-red-700">實付金額</span>
              <span className="text-2xl font-bold text-red-700">{formatCurrency(report.net_amount)}</span>
            </div>
          </div>
        </div>

        {/* 領款人資訊 */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-red-700" />
            領款人資訊
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">姓名</p>
              <p className="font-medium">{report.payee_name}</p>
            </div>
            <div>
              <p className="text-gray-500">身分證字號</p>
              <p className="font-medium">{report.payee_id_number || contact?.id_number || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">戶籍地址</p>
              <p className="font-medium">{report.payee_address || contact?.address || '-'}</p>
            </div>
            {(contact?.phone || contact?.email) && (
              <>
                <div>
                  <p className="text-gray-500">電話</p>
                  <p className="font-medium">{contact?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{contact?.email || '-'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 銀行資訊 */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-700" />
            銀行匯款資訊
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">銀行名稱</p>
              <p className="font-medium">{report.payee_bank_name || contact?.bank_name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">分行</p>
              <p className="font-medium">{contact?.bank_branch || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">銀行帳號</p>
              <p className="font-medium font-mono">{report.payee_bank_account || contact?.bank_account || '-'}</p>
            </div>
          </div>
        </div>

        {/* 證件附檔 */}
        {contact && (contact.id_card_front_url || contact.id_card_back_url || contact.bank_book_url) && (
          <div className="p-6 border-b print:hidden">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-700" />
              證件附檔
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {contact.id_card_front_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">身分證正面</p>
                  <a href={contact.id_card_front_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={contact.id_card_front_url} alt="身分證正面" className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                  </a>
                </div>
              )}
              {contact.id_card_back_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">身分證反面</p>
                  <a href={contact.id_card_back_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={contact.id_card_back_url} alt="身分證反面" className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                  </a>
                </div>
              )}
              {contact.bank_book_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">存摺封面</p>
                  <a href={contact.bank_book_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={contact.bank_book_url} alt="存摺封面" className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 簽名 */}
        {report.status === 'signed' && report.signature_data && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ✍️ 電子簽名
            </h3>
            <div className="flex items-end justify-between">
              <div>
                <div className="border rounded-lg p-2 bg-gray-50 inline-block">
                  <img src={report.signature_data} alt="簽名" className="h-20 object-contain" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  簽名時間：{formatDate(report.signed_at)} {new Date(report.signed_at).toLocaleTimeString('zh-TW')}
                </p>
                {report.signed_ip && (
                  <p className="text-xs text-gray-400">IP: {report.signed_ip}</p>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>本人確認以上資料正確無誤</p>
                <p>並同意以電子簽名方式簽署</p>
              </div>
            </div>
          </div>
        )}

        {/* 待簽名提示 */}
        {report.status === 'pending' && (
          <div className="p-6 bg-yellow-50">
            <div className="flex items-center gap-3">
              <Send className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">等待對方簽名</p>
                <p className="text-sm text-yellow-700">已產生簽名連結，請複製發送給領款人</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 列印樣式 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.rounded-lg.shadow,
          .bg-white.rounded-lg.shadow * {
            visibility: visible;
          }
          .bg-white.rounded-lg.shadow {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
