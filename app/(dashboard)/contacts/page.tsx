'use client'

import { useState } from 'react'
import { Users, Plus, Edit, Trash2, Search, Shield, Building } from 'lucide-react'
import { toast } from 'sonner'
import { maskIdNumber, maskBankAccount } from '@/lib/calculations'
import { clsx } from 'clsx'

// 模擬資料
const initialContacts = [
  { 
    id: '1', 
    name: '王小明', 
    id_number: 'A123456789', 
    phone: '0912345678',
    email: 'wang@example.com',
    address: '台北市大安區忠孝東路100號',
    bank_name: '台北富邦銀行',
    bank_account: '12345678901234',
    is_union_member: false,
  },
  { 
    id: '2', 
    name: '李小華', 
    id_number: 'B234567890',
    phone: '0923456789', 
    email: 'lee@example.com',
    address: '台中市西屯區台灣大道200號',
    bank_name: '國泰世華銀行',
    bank_account: '23456789012345',
    is_union_member: true,
  },
  { 
    id: '3', 
    name: '張小美', 
    id_number: 'C345678901',
    phone: '0934567890', 
    email: 'chang@example.com',
    address: '高雄市前鎮區中山路300號',
    bank_name: '中國信託銀行',
    bank_account: '34567890123456',
    is_union_member: false,
  },
]

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
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    bank_account: '',
    is_union_member: false,
  })

  const filteredContacts = contacts.filter(contact =>
    contact.name.includes(searchTerm) ||
    contact.email.includes(searchTerm) ||
    contact.phone.includes(searchTerm)
  )

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact)
      setFormData({
        name: contact.name,
        id_number: contact.id_number,
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        bank_name: contact.bank_name,
        bank_account: contact.bank_account,
        is_union_member: contact.is_union_member,
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
        bank_account: '',
        is_union_member: false,
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.id_number) {
      toast.error('請填寫必填欄位')
      return
    }

    if (editingContact) {
      // 編輯
      setContacts(contacts.map(c => 
        c.id === editingContact.id 
          ? { ...c, ...formData }
          : c
      ))
      toast.success('已更新聯絡人')
    } else {
      // 新增
      const newContact: Contact = {
        id: Date.now().toString(),
        ...formData,
      }
      setContacts([...contacts, newContact])
      toast.success('已新增聯絡人')
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此聯絡人嗎？')) {
      setContacts(contacts.filter(c => c.id !== id))
      toast.success('已刪除聯絡人')
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">聯絡人管理</h1>
          <p className="text-gray-500 mt-1">管理領款人資料</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增聯絡人
        </button>
      </div>

      {/* 搜尋 */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋姓名、電話、Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* 聯絡人列表 */}
      <div className="card overflow-hidden">
        {filteredContacts.length > 0 ? (
          <div className="divide-y">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 font-bold text-lg">
                        {contact.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{contact.name}</span>
                        {contact.is_union_member && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                            <Shield className="w-3 h-3" />
                            工會成員
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {maskIdNumber(contact.id_number)} · {contact.phone}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {contact.email}
                      </p>
                      {contact.bank_name && (
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {contact.bank_name} · {maskBankAccount(contact.bank_account)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(contact)}
                      className="p-2 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
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
            <p className="text-gray-500 mb-4">尚無聯絡人</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-primary-700 hover:underline"
            >
              新增第一位聯絡人
            </button>
          </div>
        )}
      </div>

      {/* 新增/編輯彈窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingContact ? '編輯聯絡人' : '新增聯絡人'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="王小明"
                  />
                </div>
                <div>
                  <label className="form-label">
                    身分證字號 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value.toUpperCase() })}
                    className="form-input"
                    placeholder="A123456789"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">電話</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                    placeholder="0912345678"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input"
                  placeholder="台北市大安區..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">銀行名稱</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="form-input"
                    placeholder="台北富邦銀行"
                  />
                </div>
                <div>
                  <label className="form-label">銀行帳號</label>
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    className="form-input"
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
                  className="w-4 h-4 text-primary-700 rounded focus:ring-primary-700"
                />
                <label htmlFor="is_union_member" className="text-sm text-gray-700">
                  工會成員（免扣二代健保補充保費）
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="btn-primary flex-1"
              >
                {editingContact ? '儲存變更' : '新增'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
