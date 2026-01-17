'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Company {
  id: string
  name: string
  tax_id: string
}

interface CompanyContextType {
  companies: Company[]
  currentCompany: Company | null
  setCurrentCompany: (company: Company) => void
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // 載入公司列表
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies')
        const data = await res.json()
        const companiesList = data.companies || []
        setCompanies(companiesList)
        
        // 從 localStorage 讀取上次選擇的公司
        const savedCompanyId = localStorage.getItem('currentCompanyId')
        if (savedCompanyId) {
          const saved = companiesList.find((c: Company) => c.id === savedCompanyId)
          if (saved) {
            setCurrentCompanyState(saved)
          } else if (companiesList.length > 0) {
            setCurrentCompanyState(companiesList[0])
          }
        } else if (companiesList.length > 0) {
          setCurrentCompanyState(companiesList[0])
        }
      } catch (err) {
        console.error('載入公司失敗', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  // 切換公司時儲存到 localStorage
  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company)
    localStorage.setItem('currentCompanyId', company.id)
  }

  return (
    <CompanyContext.Provider value={{ companies, currentCompany, setCurrentCompany, loading }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
