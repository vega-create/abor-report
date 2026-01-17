'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  FileText, Check, Trash2, Camera, User, CreditCard, 
  Building2, CheckCircle2, AlertCircle, Loader2
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
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW')
}

// 所得類別名稱
const INCOME_TYPE_NAMES: Record<string, string> = {
  '50': '兼職薪資所得 (50)',
  '9A': '執行業務所得 (9A)',
  '9B': '稿費所得 (9B)',
  '92': '其他所得 (92)',
}

interface ReportData {
  id: string
  report_number: string
  company_name: string
  income_type: string
  description: string
  period_start: string
  period_end: string
  payment_date: string
  gross_amount: number
  income_tax: number
  health_insurance: number
  net_amount: number
  payee_name: string
  status: string
  has_contact: boolean
  contact: {
    name: string
    id_number: string
    phone: string
    email: string
    address: string
    bank_name: string
    bank_branch: string
    bank_account: string
    is_union_member: boolean
    id_card_front_url: string
    id_card_back_url: string
    bank_book_url: string
  } | null
}

export default function SignPage() {
  const params = useParams()
  const token = params.token as string
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [hasExistingData, setHasExistingData] = useState(false)
  const [isCheckingId, setIsCheckingId] = useState(false)
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    bank_branch: '',
    bank_account: '',
    is_union_member: false,
    agreed: false,
  })
  
  // 檔案預覽
  const [previews, setPreviews] = useState({
    id_card_front: '',
    id_card_back: '',
    bank_book: '',
  })

  // 載入勞報單資料
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${token}`)
        const data = await res.json()
        
        if (!res.ok) {
          setError(data.error || '載入失敗')
          return
        }
        
        setReport(data)
        setFormData(prev => ({ ...prev, name: data.payee_name || '' }))
        
        // 如果有聯絡人資料，自動帶入所有欄位
        if (data.has_contact && data.contact) {
          const c = data.contact
          setHasExistingData(true)
          setFormData({
            name: c.name || data.payee_name || '',
            id_number: c.id_number || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            bank_name: c.bank_name || '',
            bank_branch: c.bank_branch || '',
            bank_account: c.bank_account || '',
            is_union_member: c.is_union_member || false,
            agreed: false,
          })
          setPreviews({
            id_card_front: c.id_card_front_url || '',
            id_card_back: c.id_card_back_url || '',
            bank_book: c.bank_book_url || '',
          })
          toast.success('您的資料已自動帶入，請確認後簽名即可')
        }
      } catch (err) {
        setError('無法載入勞報單資料')
      } finally {
        setLoading(false)
      }
    }
    
    fetchReport()
  }, [token])

  // 初始化 Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [loading])

  // 根據身分證號查找舊資料
  const checkExistingData = async (idNumber: string) => {
    if (idNumber.length !== 10) return
    
    setIsCheckingId(true)
    try {
      const res = await fetch(`/api/contacts/lookup?id_number=${idNumber}`)
      const data = await res.json()
      
      if (data.found) {
        setHasExistingData(true)
        setFormData(prev => ({
          ...prev,
          name: data.data.name || prev.name,
          phone: data.data.phone || '',
          email: data.data.email || '',
          address: data.data.address || '',
          bank_name: data.data.bank_name || '',
          bank_branch: data.data.bank_branch || '',
          bank_account: data.data.bank_account || '',
          is_union_member: data.data.is_union_member || false,
        }))
        setPreviews({
          id_card_front: data.data.id_card_front_url || '',
          id_card_back: data.data.id_card_back_url || '',
          bank_book: data.data.bank_book_url || '',
        })
        toast.success('已帶入您之前填寫的資料，請確認後簽名即可')
      } else {
        setHasExistingData(false)
      }
    } catch (err) {
      console.error('查詢失敗', err)
    } finally {
      setIsCheckingId(false)
    }
  }

  // 處理檔案上傳（暫時用 base64，正式應上傳到 Storage）
  const handleFileUpload = (type: 'id_card_front' | 'id_card_back' | 'bank_book', file: File | null) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('檔案大小不能超過 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('請上傳圖片檔案')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviews(prev => ({ ...prev, [type]: e.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // 簽名功能
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  // 驗證
  const validateForm = () => {
    if (!formData.name.trim()) { toast.error('請填寫姓名'); return false }
    if (!formData.id_number.trim() || formData.id_number.length !== 10) { toast.error('請填寫正確的身分證字號'); return false }
    if (!formData.address.trim()) { toast.error('請填寫戶籍地址'); return false }
    if (!formData.bank_name.trim() || !formData.bank_account.trim()) { toast.error('請填寫銀行資料'); return false }
    if (!previews.id_card_front) { toast.error('請上傳身分證正面'); return false }
    if (!previews.id_card_back) { toast.error('請上傳身分證反面'); return false }
    if (!previews.bank_book) { toast.error('請上傳銀行存摺封面'); return false }
    if (!formData.agreed) { toast.error('請勾選同意條款'); return false }
    if (!hasSignature) { toast.error('請簽名'); return false }
    return true
  }

  // 提交
  const handleSubmit = async () => {
    if (!validateForm()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const signatureData = canvas.toDataURL('image/png')
    
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reports/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          signature_data: signatureData,
          id_card_front_url: previews.id_card_front,
          id_card_back_url: previews.id_card_back,
          bank_book_url: previews.bank_book,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || '提交失敗')
        return
      }
      
      setSubmitted(true)
      toast.success('簽名完成！')
    } catch (err) {
      toast.error('提交失敗，請重試')
    } finally {
      setSubmitting(false)
    }
  }

  // 檔案上傳元件
  const FileUploadBox = ({ type, label, icon: Icon }: { type: 'id_card_front' | 'id_card_back' | 'bank_book'; label: string; icon: any }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const preview = previews[type]
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {!preview && <span className="text-red-500">*</span>}
        </label>
        <div 
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-red-500 hover:bg-red-50/50 ${preview ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(type, e.target.files?.[0] || null)} />
          {preview ? (
            <div className="relative">
              <img src={preview} alt={label} className="max-h-32 mx-auto rounded-lg object-contain" />
              <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>
            </div>
          ) : (
            <div className="py-4">
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">點擊上傳或拍照</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 載入中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-700 mx-auto mb-2" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 錯誤
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">無法開啟</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // 完成畫面
  if (submitted && report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">簽名完成！</h1>
          <p className="text-gray-600 mb-6">感謝您完成勞報單簽名，公司將於支付日期匯款至您的帳戶。</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
            <div><p className="text-sm text-gray-500">勞報單編號</p><p className="font-semibold">{report.report_number}</p></div>
            <div><p className="text-sm text-gray-500">實付金額</p><p className="text-2xl font-bold text-red-700">{formatCurrency(report.net_amount)}</p></div>
            <div><p className="text-sm text-gray-500">預計匯款日期</p><p className="font-semibold">{formatDate(report.payment_date)}</p></div>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="bg-red-700 text-white py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">勞務報酬單簽名</h1>
              <p className="text-white/80 text-sm">{report.company_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 勞報單資訊 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-700" />勞報單資訊
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">單號</p><p className="font-semibold">{report.report_number}</p></div>
            <div><p className="text-gray-500">所得類別</p><p className="font-semibold">{INCOME_TYPE_NAMES[report.income_type] || report.income_type}</p></div>
            {report.description && <div className="col-span-2"><p className="text-gray-500">勞務內容</p><p className="font-semibold">{report.description}</p></div>}
            {report.period_start && <div><p className="text-gray-500">服務期間</p><p className="font-semibold">{formatDate(report.period_start)} ~ {formatDate(report.period_end)}</p></div>}
            <div><p className="text-gray-500">支付日期</p><p className="font-semibold">{formatDate(report.payment_date)}</p></div>
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">總金額</span><span className="font-semibold">{formatCurrency(report.gross_amount)}</span></div>
            {report.income_tax > 0 && <div className="flex justify-between text-red-600"><span>代扣所得稅</span><span>-{formatCurrency(report.income_tax)}</span></div>}
            {report.health_insurance > 0 && <div className="flex justify-between text-red-600"><span>二代健保 (2.11%)</span><span>-{formatCurrency(report.health_insurance)}</span></div>}
            <div className="flex justify-between pt-2 border-t text-lg"><span className="font-semibold text-red-700">實付金額</span><span className="font-bold text-red-700">{formatCurrency(report.net_amount)}</span></div>
          </div>
        </div>

        {/* 舊資料提示 */}
        {hasExistingData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">已自動帶入您之前的資料</p>
              <p className="text-sm text-green-700 mt-1">請確認資料無誤後，直接捲動到最下方簽名即可。</p>
            </div>
          </div>
        )}

        {/* 個人資料 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-red-700" />個人資料</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="王小明" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">身分證字號 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={formData.id_number} onChange={(e) => { const v = e.target.value.toUpperCase(); setFormData({ ...formData, id_number: v }); if (v.length === 10) checkExistingData(v) }} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="A123456789" maxLength={10} />
                  {isCheckingId && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="w-4 h-4 animate-spin text-red-500" /></div>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">電話</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="0912345678" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="email@example.com" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">戶籍地址 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="台北市大安區..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_union_member" checked={formData.is_union_member} onChange={(e) => setFormData({ ...formData, is_union_member: e.target.checked })} className="w-4 h-4 text-red-700 rounded" />
              <label htmlFor="is_union_member" className="text-sm text-gray-700">我有加入職業工會（免扣二代健保）</label>
            </div>
          </div>
        </div>

        {/* 銀行資料 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-red-700" />銀行資料</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">銀行名稱 <span className="text-red-500">*</span></label><input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="台北富邦銀行" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">分行名稱</label><input type="text" value={formData.bank_branch} onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="敦南分行" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">銀行帳號 <span className="text-red-500">*</span></label><input type="text" value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="1234567890123" /></div>
          </div>
        </div>

        {/* 證件上傳 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-700" />證件上傳
            {hasExistingData && <span className="text-sm font-normal text-green-600">（已有資料）</span>}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <FileUploadBox type="id_card_front" label="身分證正面" icon={CreditCard} />
            <FileUploadBox type="id_card_back" label="身分證反面" icon={CreditCard} />
            <FileUploadBox type="bank_book" label="存摺封面" icon={Building2} />
          </div>
          <p className="text-xs text-gray-500 mt-4">* 證件照片僅供公司報稅使用</p>
        </div>

        {/* 簽名區 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">✍️ 簽名</h2>
            {hasSignature && <button onClick={clearSignature} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-4 h-4" />清除重簽</button>}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg relative bg-white" style={{ touchAction: 'none' }}>
            <canvas ref={canvasRef} className="w-full h-48 cursor-crosshair rounded-lg" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
            {!hasSignature && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><p className="text-gray-400">請在此處簽名</p></div>}
          </div>
        </div>

        {/* 同意條款 */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.agreed} onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })} className="w-5 h-5 mt-0.5 text-red-700 rounded" />
            <span className="text-sm text-gray-700">本人已確認上述資訊正確無誤，並同意以電子簽名方式簽署本勞務報酬單。</span>
          </label>
        </div>

        {/* 提交按鈕 */}
        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-red-700 text-white py-4 rounded-lg text-lg font-medium hover:bg-red-800 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />處理中...</> : <><Check className="w-5 h-5" />確認簽名送出</>}
        </button>

        <p className="text-center text-xs text-gray-500 pb-4">© 2025 {report.company_name}</p>
      </main>
    </div>
  )
}
