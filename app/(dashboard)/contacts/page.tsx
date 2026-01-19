'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Search, Shield, Building, Loader2, X } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { useCompany } from '@/lib/company-context'

interface Contact {
  id: string
  name: string
  id_number: string
  phone: string
  email: string
  address: string
  bank_name: string
  bank_branch: string
  bank_account: string
  is_union_member: boolean
}

// 遮蔽身分證
const maskIdNumber = (id: string) => {
  if (!id || id.length < 4) return id
  return id.substring(0, 4) + '****' + id.substring(id.length - 2)
}

// 遮蔽帳號
const maskBankAccount = (account: string) => {
  if (!account || account.length < 4) return account
  return '****' + account.substring(account.length - 4)
}

export default function ContactsPage() {
  const { currentCompany, loading: companyLoading } = useCompany()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)
  
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
  })

  // 載入聯絡人
  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('載入失敗', error)
      toast.error('載入聯絡人失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const filteredContacts = contacts.filter(contact =>
    contact.name?.includes(searchTerm) ||
    contact.email?.includes(searchTerm) ||
    contact.phone?.includes(searchTerm) ||
    contact.id_number?.includes(searchTerm)
  )

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact)
      setFormData({
        name: contact.name || '',
        id_number: contact.id_number || '',
        phone: contact.phone || '',
        email: contact.email || '',
        address: contact.address || '',
        bank_name: contact.bank_name || '',
        bank_branch: contact.bank_branch || '',
        bank_account: contact.bank_account || '',
        is_union_member: contact.is_union_member || false,
      })
    } else {
      setEditingContact(null)
      setFormData({
        name: '',
        id_number: '',
        phone: '',
        email: '',
        address: '',
        bank_name: '',
        bank_branch: '',
        bank_account: '',
        is_union_member: false,
      })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('請填寫姓名')
      return
    }

    setSaving(true)
    try {
      if (editingContact) {
        // 編輯
        const res = await fetch(`/api/contacts/${editingContact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('更新失敗')
        toast.success('已更新聯絡人')
      } else {
        // 新增
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            company_id: currentCompany?.id,
          }),
        })
        if (!res.ok) throw new Error('新增失敗')
        toast.success('已新增聯絡人')
      }
      setShowModal(false)
      fetchContacts()
    } catch (error) {
      toast.error('儲存失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此聯絡人嗎？')) return
    
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('刪除失敗')
      toast.success('已刪除聯絡人')
      fetchContacts()
    } catch (error) {
      toast.error('刪除失敗')
    }
  }

  if (companyLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Toaster position="top-center" richColors />
      
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">聯絡人管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理領款人資料</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-red-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增聯絡人
        </button>
      </div>

      {/* 搜尋 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋姓名、電話、Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* 聯絡人列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredContacts.length > 0 ? (
          <div className="divide-y">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-700 font-bold text-sm sm:text-lg">
                        {contact.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{contact.name}</span>
                        {contact.is_union_member && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                            <Shield className="w-3 h-3" />
                            工會成員
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {maskIdNumber(contact.id_number)} · {contact.phone}
                      </p>
                      {contact.email && (
                        <p className="text-sm text-gray-400 mt-0.5 truncate">
                          {contact.email}
                        </p>
                      )}
                      {contact.bank_name && (
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{contact.bank_name} · {maskBankAccount(contact.bank_account)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(contact)}
                      className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="編輯"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm ? '找不到符合的聯絡人' : '尚無聯絡人'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => handleOpenModal()}
                className="text-red-700 hover:underline"
              >
                新增第一位聯絡人
              </button>
            )}
          </div>
        )}
      </div>

      {/* 新增/編輯彈窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            {/* 標題列 */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingContact ? '編輯聯絡人' : '新增聯絡人'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="王小明"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    身分證字號
                  </label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="A123456789"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0912345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="台北市大安區..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">銀行名稱</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="台北富邦銀行"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">銀行帳號</label>
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_union_member"
                  checked={formData.is_union_member}
                  onChange={(e) => setFormData({ ...formData, is_union_member: e.target.checked })}
                  className="w-5 h-5 text-red-700 rounded focus:ring-red-700"
                />
                <label htmlFor="is_union_member" className="text-sm text-gray-700">
                  工會成員（免扣二代健保）
                </label>
              </div>
            </div>
            
            {/* 底部按鈕 */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-red-700 text-white py-3 rounded-lg font-medium hover:bg-red-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  editingContact ? '儲存變更' : '新增'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
