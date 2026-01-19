'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, Loader2, Building2 } from 'lucide-react'
import { toast, Toaster } from 'sonner'

// 帳號密碼設定
const USERS = [
  { username: 'vega', password: 'vega123' },
  { username: 'anna', password: 'anna123' },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // 檢查是否已登入
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('labor_logged_in')
    if (isLoggedIn === 'true') {
      router.replace('/reports')
    } else {
      setChecking(false)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error('請輸入帳號和密碼')
      return
    }

    setLoading(true)
    
    // 模擬驗證延遲
    await new Promise(resolve => setTimeout(resolve, 500))

    const user = USERS.find(u => u.username === username.toLowerCase() && u.password === password)
    
    if (user) {
      localStorage.setItem('labor_logged_in', 'true')
      localStorage.setItem('labor_username', user.username)
      toast.success('登入成功！')
      router.push('/reports')
    } else {
      toast.error('帳號或密碼錯誤')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Toaster position="top-center" richColors />
      
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">勞報單系統</h1>
          <p className="text-gray-500 mt-1">智慧媽咪國際 / 薇佳工作室</p>
        </div>

        {/* 登入表單 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              帳號
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="請輸入帳號"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="請輸入密碼"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 text-white py-3 rounded-lg font-medium hover:bg-red-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登入中...
              </>
            ) : (
              '登入'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2025 智慧媽咪國際股份有限公司
        </p>
      </div>
    </div>
  )
}
