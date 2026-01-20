'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FileText, Plus, Send, Download, Eye, Clock, CheckCircle, XCircle, 
  Search, FileSpreadsheet, CheckSquare, Square, Trash2, Loader2, AlertTriangle,
  Calendar, X
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { useCompany } from '@/lib/company-context'

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
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

// 所得類別名稱
const INCOME_TYPE_NAMES: Record<string, string> = {
  '50': '兼職所得 (50)',
  '9A': '執行業務所得 (9A)',
  '9B': '稿費 (9B)',
  '92': '其他所得 (92)',
}

// 所得類別代碼
const INCOME_TYPE_CODES: Record<string, string> = {
  '50': '50',
  '9A': '9A',
  '9B': '9B',
  '92': '92',
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
  company_id: string
  payee_name: string
  payee_id_number: string
  payee_address: string
  payee_bank_name: string
  payee_bank_account: string
  income_type: string
  gross_amount: number
  income_tax: number
  health_insurance: number
  net_amount: number
  payment_date: string
  status: string
  sign_token: string
  created_at: string
}

type DateRangeOption = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export default function ReportsPage() {
  const { currentCompany, companies } = useCompany()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  
  // 匯出 Modal 狀態
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportDateRange, setExportDateRange] = useState<DateRangeOption>('month')
  const [exportCustomStart, setExportCustomStart] = useState('')
  const [exportCustomEnd, setExportCustomEnd] = useState('')
  const [exportStatusFilter, setExportStatusFilter] = useState({
    signed: true,
    pending: true,
    draft: false
  })
  const [exporting, setExporting] = useState(false)

  // 載入勞報單
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      toast.error('載入失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  // 切換公司時清除選擇
  useEffect(() => {
    setSelectedIds([])
  }, [currentCompany?.id])

  // 取得公司名稱
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || ''
  }

  // 取得公司統編
  const getCompanyTaxId = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.tax_id || ''
  }

  // 篩選（只顯示當前公司的勞報單）
  const filteredReports = reports.filter(report => {
    const matchCompany = report.company_id === currentCompany?.id
    const matchSearch = report.payee_name.includes(searchTerm) || 
                       report.report_number.includes(searchTerm)
    const matchStatus = filterStatus === 'all' || report.status === filterStatus
    return matchCompany && matchSearch && matchStatus
  })

  // 統計
  const companyReports = reports.filter(r => r.company_id === currentCompany?.id)
  const stats = {
    total: companyReports.length,
    draft: companyReports.filter(r => r.status === 'draft').length,
    pending: companyReports.filter(r => r.status === 'pending').length,
    signed: companyReports.filter(r => r.status === 'signed').length,
  }

  // 切換選擇
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // 全選
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReports.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredReports.map(r => r.id))
    }
  }

  // 單筆刪除
  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/reports/delete/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id))
        toast.success('已刪除')
      } else {
        toast.error('刪除失敗')
      }
    } catch (err) {
      toast.error('刪除失敗')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
    }
  }

  // 批量刪除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    
    setDeleting(true)
    try {
      const res = await fetch('/api/reports/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      
      if (res.ok) {
        setReports(prev => prev.filter(r => !selectedIds.includes(r.id)))
        toast.success(`已刪除 ${selectedIds.length} 筆`)
        setSelectedIds([])
      } else {
        toast.error('刪除失敗')
      }
    } catch (err) {
      toast.error('刪除失敗')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // 複製簽名連結
  const copySignLink = async (token: string) => {
    const link = `${window.location.origin}/sign/${token}`
    await navigator.clipboard.writeText(link)
    toast.success('已複製簽名連結')
  }

  // 單筆匯出 CSV
  const handleSingleExport = (report: Report) => {
    const companyName = getCompanyName(report.company_id)
    const companyTaxId = getCompanyTaxId(report.company_id)
    
    const csvContent = [
      ['公司名稱', '公司統編', '勞報單編號', '領款人姓名', '身分證字號', '戶籍地址', '所得類別', '所得代碼', '總金額', '代扣所得稅', '二代健保', '實付金額', '銀行名稱', '銀行帳號', '支付日期', '狀態'],
      [
        companyName,
        companyTaxId,
        report.report_number,
        report.payee_name,
        report.payee_id_number || '',
        report.payee_address || '',
        INCOME_TYPE_NAMES[report.income_type] || report.income_type,
        INCOME_TYPE_CODES[report.income_type] || report.income_type,
        report.gross_amount,
        report.income_tax || 0,
        report.health_insurance || 0,
        report.net_amount,
        report.payee_bank_name || '',
        report.payee_bank_account || '',
        report.payment_date,
        report.status === 'signed' ? '已簽名' : report.status === 'pending' ? '待簽名' : '草稿'
      ]
    ]
    
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
    
    toast.success('已下載 CSV')
  }

  // 批次匯出 CSV（選取的）
  const handleBatchExport = () => {
    const selectedReports = reports.filter(r => selectedIds.includes(r.id))
    const companyName = currentCompany?.name.replace('股份有限公司', '') || '全部'
    
    const csvContent = [
      ['公司名稱', '公司統編', '勞報單編號', '領款人姓名', '身分證字號', '戶籍地址', '所得類別', '所得代碼', '總金額', '代扣所得稅', '二代健保', '實付金額', '銀行名稱', '銀行帳號', '支付日期', '狀態'],
      ...selectedReports.map(report => [
        getCompanyName(report.company_id),
        getCompanyTaxId(report.company_id),
        report.report_number,
        report.payee_name,
        report.payee_id_number || '',
        report.payee_address || '',
        INCOME_TYPE_NAMES[report.income_type] || report.income_type,
        INCOME_TYPE_CODES[report.income_type] || report.income_type,
        report.gross_amount,
        report.income_tax || 0,
        report.health_insurance || 0,
        report.net_amount,
        report.payee_bank_name || '',
        report.payee_bank_account || '',
        report.payment_date,
        report.status === 'signed' ? '已簽名' : report.status === 'pending' ? '待簽名' : '草稿'
      ])
    ]
    
    const BOM = '\uFEFF'
    const csvString = BOM + csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    link.download = `勞報單匯出_${companyName}_${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`已匯出 ${selectedReports.length} 筆資料`)
  }

  // ========== 匯出 Modal 相關功能 ==========
  
  // 計算日期範圍
  const getExportDateRange = (): { start: Date; end: Date } => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    switch (exportDateRange) {
      case 'today':
        return { start: today, end }
      
      case 'week': {
        const start = new Date(today)
        start.setDate(today.getDate() - today.getDay())
        return { start, end }
      }
      
      case 'month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start, end }
      }
      
      case 'quarter': {
        const quarterStart = Math.floor(today.getMonth() / 3) * 3
        const start = new Date(today.getFullYear(), quarterStart, 1)
        return { start, end }
      }
      
      case 'year': {
        const start = new Date(today.getFullYear(), 0, 1)
        return { start, end }
      }
      
      case 'custom': {
        return {
          start: exportCustomStart ? new Date(exportCustomStart) : today,
          end: exportCustomEnd ? new Date(exportCustomEnd + 'T23:59:59') : end
        }
      }
      
      default:
        return { start: today, end }
    }
  }

  // 篩選要匯出的報表
  const getExportFilteredReports = () => {
    const { start, end } = getExportDateRange()
    
    return companyReports.filter(report => {
      // 日期篩選
      const reportDate = new Date(report.payment_date || report.created_at)
      if (reportDate < start || reportDate > end) return false
      
      // 狀態篩選
      if (report.status === 'signed' && !exportStatusFilter.signed) return false
      if (report.status === 'pending' && !exportStatusFilter.pending) return false
      if (report.status === 'draft' && !exportStatusFilter.draft) return false
      
      return true
    })
  }

  // 時間範圍匯出
  const handleDateRangeExport = () => {
    const exportReports = getExportFilteredReports()
    
    if (exportReports.length === 0) {
      toast.error('沒有符合條件的資料')
      return
    }

    setExporting(true)

    try {
      const csvContent = [
        ['公司名稱', '公司統編', '勞報單編號', '領款人姓名', '身分證字號', '戶籍地址', '所得類別', '所得代碼', '總金額', '代扣所得稅', '二代健保', '實付金額', '銀行名稱', '銀行帳號', '支付日期', '狀態'],
        ...exportReports.map(report => [
          getCompanyName(report.company_id),
          getCompanyTaxId(report.company_id),
          report.report_number,
          report.payee_name,
          report.payee_id_number || '',
          report.payee_address || '',
          INCOME_TYPE_NAMES[report.income_type] || report.income_type,
          INCOME_TYPE_CODES[report.income_type] || report.income_type,
          report.gross_amount,
          report.income_tax || 0,
          report.health_insurance || 0,
          report.net_amount,
          report.payee_bank_name || '',
          report.payee_bank_account || '',
          report.payment_date,
          report.status === 'signed' ? '已簽名' : report.status === 'pending' ? '待簽名' : '草稿'
        ])
      ]

      const BOM = '\uFEFF'
      const csvString = BOM + csvContent.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n')

      // 產生檔名
      const { start, end } = getExportDateRange()
      const formatDateStr = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '')
      const companyName = currentCompany?.name.replace('股份有限公司', '') || ''
      const fileName = `勞報單_${companyName}_${formatDateStr(start)}_${formatDateStr(end)}.csv`

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`已匯出 ${exportReports.length} 筆資料`)
      setShowExportModal(false)
    } catch (error) {
      toast.error('匯出失敗')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  const exportFilteredCount = getExportFilteredReports().length

  const rangeLabels: Record<DateRangeOption, string> = {
    today: '今日',
    week: '本週',
    month: '本月',
    quarter: '本季',
    year: '今年度',
    custom: '自訂範圍'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">勞報單管理</h1>
          <p className="text-gray-500 mt-1">
            {currentCompany?.name.replace('股份有限公司', '')} 的勞務報酬單
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            匯出報表
          </button>
          <Link href="/reports/new" className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增勞報單
          </Link>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">全部</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">草稿</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">待簽名</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">已簽名</p>
          <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
        </div>
      </div>

      {/* 批次操作列 */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-red-700" />
            <span className="font-medium text-red-700">已選擇 {selectedIds.length} 筆</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              批次匯出 Excel
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              批次刪除
            </button>
          </div>
        </div>
      )}

      {/* 搜尋與篩選 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋姓名或單號..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">全部狀態</option>
            <option value="draft">草稿</option>
            <option value="pending">待簽名</option>
            <option value="signed">已簽名</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* 勞報單列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* 批次選擇列 */}
        {filteredReports.length > 0 && (
          <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredReports.length && filteredReports.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-red-700 rounded"
              />
              <span className="text-sm text-gray-600">
                全選 ({filteredReports.length})
              </span>
            </label>
            <p className="text-xs text-gray-500">
              💡 勾選後上方會出現批次操作按鈕
            </p>
          </div>
        )}
        
        {filteredReports.length > 0 ? (
          <div className="divide-y">
            {filteredReports.map((report) => {
              const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.draft
              const StatusIcon = status.icon
              const isSelected = selectedIds.includes(report.id)
              
              return (
                <div 
                  key={report.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* 選擇框 */}
                      <button
                        onClick={() => toggleSelect(report.id)}
                        className="mt-1 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-red-700" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-red-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{report.payee_name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {report.report_number} · {INCOME_TYPE_NAMES[report.income_type] || report.income_type}
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          支付日期：{formatDate(report.payment_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(report.net_amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        總額 {formatCurrency(report.gross_amount)}
                      </p>
                      
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <Link
                          href={`/reports/${report.id}`}
                          className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="檢視"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        
                        {report.status === 'pending' && (
                          <button
                            onClick={() => copySignLink(report.sign_token)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="複製簽名連結"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                        
                        {report.status === 'signed' && (
                          <button
                            onClick={() => handleSingleExport(report)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="下載 CSV"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        )}

                        <button
                          onClick={() => { setDeleteTarget(report.id); setShowDeleteConfirm(true) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {currentCompany?.name.replace('股份有限公司', '')} 尚無勞報單
            </p>
            <Link href="/reports/new" className="text-red-700 hover:underline">
              建立第一張勞報單
            </Link>
          </div>
        )}
      </div>

      {/* 刪除確認彈窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">確認刪除</h3>
                <p className="text-gray-500 text-sm">
                  {deleteTarget ? '確定要刪除這筆勞報單嗎？' : `確定要刪除 ${selectedIds.length} 筆勞報單嗎？`}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              此操作無法復原，刪除後資料將永久消失。
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => deleteTarget ? handleDelete(deleteTarget) : handleBatchDelete()}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 匯出報表 Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600" />
                匯出勞報單
              </h2>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* 時間範圍 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  時間範圍
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['today', 'week', 'month', 'quarter', 'year', 'custom'] as DateRangeOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setExportDateRange(option)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        exportDateRange === option
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                      }`}
                    >
                      {rangeLabels[option]}
                    </button>
                  ))}
                </div>

                {/* 自訂日期輸入 */}
                {exportDateRange === 'custom' && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="date"
                      value={exportCustomStart}
                      onChange={(e) => setExportCustomStart(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="date"
                      value={exportCustomEnd}
                      onChange={(e) => setExportCustomEnd(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              {/* 狀態篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  狀態篩選
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportStatusFilter.signed}
                      onChange={(e) => setExportStatusFilter(s => ({ ...s, signed: e.target.checked }))}
                      className="w-4 h-4 text-red-700 rounded"
                    />
                    <span className="text-sm">已簽名</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportStatusFilter.pending}
                      onChange={(e) => setExportStatusFilter(s => ({ ...s, pending: e.target.checked }))}
                      className="w-4 h-4 text-red-700 rounded"
                    />
                    <span className="text-sm">待簽名</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportStatusFilter.draft}
                      onChange={(e) => setExportStatusFilter(s => ({ ...s, draft: e.target.checked }))}
                      className="w-4 h-4 text-red-700 rounded"
                    />
                    <span className="text-sm">草稿</span>
                  </label>
                </div>
              </div>

              {/* 預覽數量 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  符合條件的資料：
                  <span className="font-semibold text-red-700 ml-1">
                    {exportFilteredCount} 筆
                  </span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDateRangeExport}
                disabled={exporting || exportFilteredCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                {exporting ? '匯出中...' : `匯出 CSV`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
