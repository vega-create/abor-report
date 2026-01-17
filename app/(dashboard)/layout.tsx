'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Users, Plus, Building2, ChevronDown, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { CompanyProvider, useCompany } from '@/lib/company-context'
import { useState } from 'react'

const navigation = [
  { name: '勞報單', href: '/reports', icon: FileText },
  { name: '聯絡人', href: '/contacts', icon: Users },
]

function DashboardHeader() {
  const pathname = usePathname()
  const { companies, currentCompany, setCurrentCompany, loading } = useCompany()
  const [showCompanyMenu, setShowCompanyMenu] = useState(false)

  if (loading) {
    return (
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {/* Logo + 公司切換 */}
            <div className="relative">
              <button
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-sm leading-tight">
                    {currentCompany?.name.replace('股份有限公司', '')}
                  </p>
                  <p className="text-white/70 text-xs">{currentCompany?.tax_id}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
              
              {/* 公司選單 */}
              {showCompanyMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCompanyMenu(false)} 
                  />
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border z-20 py-1">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setCurrentCompany(company)
                          setShowCompanyMenu(false)
                        }}
                        className={clsx(
                          "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                          currentCompany?.id === company.id && "bg-primary-50"
                        )}
                      >
                        <p className={clsx(
                          "font-medium",
                          currentCompany?.id === company.id ? "text-primary-700" : "text-gray-900"
                        )}>
                          {company.name.replace('股份有限公司', '')}
                        </p>
                        <p className="text-xs text-gray-500">統編：{company.tax_id}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* 導航 */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <Link
            href="/reports/new"
            className="flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新增勞報單</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentCompany } = useCompany()

  return (
    <>
      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b sticky top-0 z-10">
        <div className="flex">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3 transition-colors',
                  isActive 
                    ? 'text-primary-700 border-b-2 border-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 {currentCompany?.name || '勞報單系統'}
          </p>
        </div>
      </footer>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CompanyProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </CompanyProvider>
  )
}
