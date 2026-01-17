-- ============================================
-- 勞報系統 - Supabase Schema
-- Mommy Wisdom International Co. (智慧媽咪國際)
-- 參考：直誠會計事務所 雲端秘書
-- ============================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 公司表 (companies)
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- 公司名稱
  tax_id TEXT,                           -- 統一編號
  address TEXT,                          -- 地址
  phone TEXT,                            -- 電話
  responsible_person TEXT,               -- 負責人
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 預設公司資料
INSERT INTO companies (name, tax_id, responsible_person) VALUES
  ('智慧媽咪國際股份有限公司', '95493378', '林央珽'),
  ('薇佳工作室', '88535681', '林央珽');

-- ============================================
-- 2. 使用者表 (users) - 員工（完整權限）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),  -- 預設公司
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2.1 使用者可存取的公司（多公司權限）
-- ============================================
CREATE TABLE IF NOT EXISTS user_companies (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, company_id)
);

-- ============================================
-- 3. 聯絡人/領款人表 (contacts)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,                    -- 姓名
  id_number TEXT,                        -- 身分證字號
  phone TEXT,                            -- 電話
  email TEXT,                            -- Email
  address TEXT,                          -- 地址
  bank_code TEXT,                        -- 銀行代碼
  bank_name TEXT,                        -- 銀行名稱
  bank_account TEXT,                     -- 銀行帳號
  is_union_member BOOLEAN DEFAULT FALSE, -- 是否為工會成員（免扣二代健保）
  
  -- 附件（由領款人上傳，儲存後自動帶出）
  id_card_front_url TEXT,                -- 身分證正面
  id_card_back_url TEXT,                 -- 身分證反面
  bank_book_url TEXT,                    -- 銀行存摺封面
  
  notes TEXT,                            -- 備註
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 勞報單表 (reports)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES contacts(id),
  report_number TEXT NOT NULL,           -- 勞報單編號 (如: LR-2025-0001)
  
  -- 所得資訊
  income_type TEXT NOT NULL,             -- 所得類別: 50, 9A, 9B, 92
  description TEXT,                      -- 勞務內容說明
  period_start DATE,                     -- 服務期間起
  period_end DATE,                       -- 服務期間迄
  payment_date DATE NOT NULL,            -- 支付日期
  
  -- 金額計算
  gross_amount DECIMAL(12,2) NOT NULL,   -- 總金額（稅前）
  income_tax DECIMAL(12,2) DEFAULT 0,    -- 代扣所得稅
  health_insurance DECIMAL(12,2) DEFAULT 0, -- 二代健保補充保費
  net_amount DECIMAL(12,2) NOT NULL,     -- 實付金額（稅後）
  
  -- 領款人資訊快照
  payee_name TEXT NOT NULL,
  payee_id_number TEXT,
  payee_address TEXT,
  payee_bank_code TEXT,
  payee_bank_name TEXT,
  payee_bank_account TEXT,
  
  -- 簽名相關
  sign_token TEXT UNIQUE,                -- 簽名連結 Token
  sign_token_expires_at TIMESTAMPTZ,     -- Token 過期時間
  status TEXT DEFAULT 'draft',           -- draft, pending, signed, cancelled
  signature_data TEXT,                   -- 簽名圖片 Base64
  signed_at TIMESTAMPTZ,                 -- 簽名時間
  signed_ip TEXT,                        -- 簽名 IP
  
  -- 其他
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 索引
-- ============================================
CREATE INDEX idx_reports_company ON reports(company_id);
CREATE INDEX idx_reports_contact ON reports(contact_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_token ON reports(sign_token);
CREATE INDEX idx_reports_payment_date ON reports(payment_date);
CREATE INDEX idx_contacts_company ON contacts(company_id);

-- ============================================
-- 6. 函數：產生勞報單編號
-- ============================================
CREATE OR REPLACE FUNCTION generate_report_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INT;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM reports
  WHERE company_id = p_company_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  v_number := 'LR-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 觸發器：自動更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reports_updated
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_contacts_updated
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
