'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Users, Send, Download, Building2, CheckCircle, HelpCircle } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">使用說明</h1>
          <p className="text-gray-500">勞報單系統操作指南</p>
        </div>
      </div>

      {/* 快速開始 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          🚀 快速開始
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-medium text-gray-900">選擇公司</p>
              <p className="text-gray-600 text-sm">點擊左上角公司名稱切換「智慧媽咪國際」或「薇佳工作室」</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-medium text-gray-900">新增勞報單</p>
              <p className="text-gray-600 text-sm">點「新增勞報單」→ 選擇領款人或輸入新名字 → 填金額 → 產生連結</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-medium text-gray-900">發送連結給對方</p>
              <p className="text-gray-600 text-sm">複製簽名連結，用 LINE 或 Email 發送給領款人</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
            <div>
              <p className="font-medium text-gray-900">等待簽名</p>
              <p className="text-gray-600 text-sm">對方填寫資料並簽名後，狀態會變成「已簽名」</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">5</div>
            <div>
              <p className="font-medium text-gray-900">匯出給會計</p>
              <p className="text-gray-600 text-sm">勾選已簽名的勞報單 → 點「批次匯出 Excel」下載 CSV</p>
            </div>
          </div>
        </div>
      </div>

      {/* 功能說明 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 新增勞報單 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-700" />
            新增勞報單
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <strong>選擇已有聯絡人</strong>：輸入姓名會自動搜尋，選擇後資料自動帶入，對方只需簽名</li>
            <li>• <strong>新領款人</strong>：直接輸入姓名，對方需填寫完整資料</li>
            <li>• <strong>金額自動計算</strong>：系統依所得類別自動算代扣稅額</li>
          </ul>
        </div>

        {/* 公司切換 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-700" />
            公司切換
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 點擊左上角公司名稱切換</li>
            <li>• 切換後只會顯示該公司的勞報單</li>
            <li>• 新增的勞報單會自動歸屬當前公司</li>
            <li>• 系統會記住上次選擇</li>
          </ul>
        </div>

        {/* 簽名連結 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Send className="w-5 h-5 text-red-700" />
            簽名連結
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 每張勞報單有專屬連結</li>
            <li>• 連結可多次開啟直到簽名完成</li>
            <li>• 簽名後連結失效，無法重複簽</li>
            <li>• 列表中點 <Send className="w-4 h-4 inline" /> 可複製連結</li>
          </ul>
        </div>

        {/* 匯出資料 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Download className="w-5 h-5 text-red-700" />
            匯出資料
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <strong>單筆下載</strong>：點勞報單旁的 <Download className="w-4 h-4 inline" /></li>
            <li>• <strong>批次匯出</strong>：勾選多筆後點「批次匯出 Excel」</li>
            <li>• CSV 格式可直接用 Excel 開啟</li>
            <li>• 包含報稅所需的完整資料</li>
          </ul>
        </div>
      </div>

      {/* 稅務計算說明 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📊 2025 年稅務計算規則</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">所得類別</th>
                <th className="text-left py-2 px-3">代扣所得稅</th>
                <th className="text-left py-2 px-3">二代健保 (2.11%)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">50 兼職薪資</td>
                <td className="py-2 px-3">≥ $88,501 扣 5%</td>
                <td className="py-2 px-3">≥ $28,590 扣</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">9A 執行業務</td>
                <td className="py-2 px-3">≥ $20,010 扣 10%</td>
                <td className="py-2 px-3">≥ $20,000 扣</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">9B 稿費</td>
                <td className="py-2 px-3">≥ $20,010 扣 10%</td>
                <td className="py-2 px-3">≥ $20,000 扣</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">92 其他所得</td>
                <td className="py-2 px-3">免扣</td>
                <td className="py-2 px-3">≥ $20,000 扣</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <strong>💡 工會成員</strong>：如果領款人是工會成員，系統會自動免扣二代健保
        </div>
      </div>

      {/* 領款人操作說明 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">👤 領款人操作流程</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🆕 第一次簽署</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>開啟簽名連結</li>
              <li>填寫身分證字號</li>
              <li>填寫戶籍地址</li>
              <li>填寫銀行帳戶資訊</li>
              <li>上傳身分證正反面</li>
              <li>上傳存摺封面</li>
              <li>手寫簽名</li>
              <li>確認送出</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔄 再次簽署（資料已存）</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>開啟簽名連結</li>
              <li>資料自動帶入 ✓</li>
              <li>確認資料正確</li>
              <li>手寫簽名</li>
              <li>確認送出</li>
            </ol>
            <p className="text-sm text-green-700 mt-2">
              ✓ 如果後台已選擇聯絡人，對方只需簽名即可！
            </p>
          </div>
        </div>
      </div>

      {/* 常見問題 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          常見問題
        </h2>
        
        <div className="space-y-4">
          <div>
            <p className="font-medium text-gray-900">Q: 對方說連結打不開？</p>
            <p className="text-sm text-gray-600 ml-4">A: 確認連結是否完整複製，或該勞報單是否已簽名/取消</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Q: 可以修改已簽名的勞報單嗎？</p>
            <p className="text-sm text-gray-600 ml-4">A: 已簽名的無法修改，需刪除後重新建立</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Q: CSV 用 Excel 開是亂碼？</p>
            <p className="text-sm text-gray-600 ml-4">A: 系統已加入 BOM，正常應該不會。如有問題，用「資料」→「從文字檔」匯入，選 UTF-8 編碼</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Q: 如何知道對方是否簽名？</p>
            <p className="text-sm text-gray-600 ml-4">A: 列表中狀態會從「待簽名」變成「已簽名」</p>
          </div>
        </div>
      </div>

      {/* 聯絡資訊 */}
      <div className="bg-gray-100 rounded-lg p-6 text-center text-sm text-gray-600">
        <p>如有系統問題，請聯繫系統管理員</p>
        <p className="mt-1">© 2025 智慧媽咪國際 / 薇佳工作室</p>
      </div>
    </div>
  )
}
