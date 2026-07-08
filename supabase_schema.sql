-- ==========================================
-- SUPABASE / POSTGRESQL DATABASE SCHEMA
-- สหคลินิกเดชอุดม แลบ กายภาพบำบัด (Dej Udom Physical Therapy Clinic Log)
-- ==========================================

-- 1. DROP TABLE IF EXISTS (Optional safety)
-- DROP TABLE IF EXISTS patient_records;

-- 2. CREATE patient_records TABLE
CREATE TABLE patient_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "ptNo" TEXT,
  "serviceType" TEXT NOT NULL,
  "citizenId" TEXT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  "birthYear" TEXT,
  age TEXT,
  phone TEXT,
  address TEXT,
  "underlyingDisease" TEXT,
  "chiefComplaint" TEXT,
  "ptDiagnosis" TEXT,
  treatments JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of selected treatment IDs
  "otherTreatment" TEXT,
  fee INTEGER DEFAULT 0,
  remarks TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE INDEXES FOR OPTIMAL SEARCH & DASHBOARD PERFORMANCE
CREATE INDEX idx_patient_records_date ON patient_records(date DESC);
CREATE INDEX idx_patient_records_pt_no ON patient_records("ptNo");
CREATE INDEX idx_patient_records_citizen_id ON patient_records("citizenId");

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) FOR SECURITY
-- By default, you can enable RLS and create public policies or authentication policies.
-- Here we enable RLS and create a policy that allows all operations (can be locked down in production).
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to anyone" 
  ON patient_records FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert access to anyone" 
  ON patient_records FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update access to anyone" 
  ON patient_records FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete access to anyone" 
  ON patient_records FOR DELETE 
  USING (true);

-- 5. SEED INITIAL 9 PATIENT RECORDS (INITIAL_RECORDS)
INSERT INTO patient_records (
  id, date, "ptNo", "serviceType", "citizenId", name, gender, "birthYear", 
  age, phone, address, "underlyingDisease", "chiefComplaint", "ptDiagnosis", 
  treatments, "otherTreatment", fee, remarks, "createdAt"
) VALUES
(
  'seed-1', '2026-03-24', 'PT69-001', 'new', '3-4305-00355-60-9', 'นายจักรกริช ราชสิงห์', 'male', '2504', 
  '65', '', '118 ม.6 ต.เดชอุดม อ.เดชอุดม จ.อุบลราชธานี', '', 'ปวดไหล่', 'Frozen Shoulder', 
  '["US", "PMS"]'::jsonb, '', 500, '', '2026-03-24T09:00:00Z'::timestamptz
),
(
  'seed-2', '2026-03-28', 'PT69-002', 'followup', '', 'นางดารารัตน์ รัตนโคตร', 'female', '2508', 
  '61', '', 'ต.เดชอุดม อ.เดชอุดม จ.อุบลราชธานี', '', 'ปวดหลัง', 'LBP', 
  '["PMS"]'::jsonb, '', 450, '', '2026-03-28T10:30:00Z'::timestamptz
),
(
  'seed-3', '2026-04-04', 'PT69-003', 'new', '', 'นายเจริญ พฤกษาสน', 'male', '2529', 
  '40', '', '', '', 'ปวดบ่า', 'MPS', 
  '["PMS"]'::jsonb, '', 500, '', '2026-04-04T08:15:00Z'::timestamptz
),
(
  'seed-4', '2026-04-05', 'PT69-004', 'new', '', 'นางสาวศิริลักษณ์ ดวงจันทร์', 'female', '2512', 
  '57', '', '', '', 'ปวดสะโพก', 'LBP', 
  '["US", "PMS"]'::jsonb, '', 500, '', '2026-04-05T14:20:00Z'::timestamptz
),
(
  'seed-5', '2026-04-06', 'PT69-005', 'followup', '1-3409-00001-71-9', 'น.ส. อังคณา จำปาทอง', 'female', '2549', 
  '20', '', '400 ม.4 ต.โพธิ์ อ.เมือง จ.ศรีสะเกษ', '', 'ปวดคอ', 'C-Spondylosis', 
  '["US", "PMS"]'::jsonb, '', 800, '', '2026-04-06T09:00:00Z'::timestamptz
),
(
  'seed-6', '2026-04-06', 'PT69-006', 'new', '1-3407-00315-76-0', 'นายวีรภัทร ชินช้าง', 'male', '2533', 
  '36', '', '148 ม.6 ต.สำโรง อ.สำโรง จ.อุบลราชธานี', '', 'ปวดต้นคอ ร้าวบ่า', 'C-Spondylosis', 
  '["US", "PMS"]'::jsonb, '', 500, '', '2026-04-06T11:00:00Z'::timestamptz
),
(
  'seed-7', '2026-04-07', 'PT69-007', 'new', '', 'นายธนชัย โคตรสาร', 'male', '2502', 
  '67', '', '559 ม.19 ต.เมืองเดช อ.เดชอุดม จ.อุบลราชธานี', '', 'ปวดขาหนีบ', 'Spinal Stenosis', 
  '["US", "PMS"]'::jsonb, '', 800, '', '2026-04-07T10:00:00Z'::timestamptz
),
(
  'seed-8', '2026-04-09', 'PT69-008', 'followup', '', 'นายธีระชัย สารรักษ์', 'male', '2505', 
  '64', '', 'ต.เดชอุดม อ.เดชอุดม จ.อุบลราชธานี', '', 'ติดตามผลการประเมินปวดขาหนีบและกระดูกสันหลังทับเส้นประสาท', 'Spinal Stenosis', 
  '["US", "PMS"]'::jsonb, '', 500, '', '2026-04-09T15:30:00Z'::timestamptz
),
(
  'seed-9', '2026-04-16', 'PT69-009', 'new', '', 'นายสุทธิพร ไกรรัตน์', 'male', '2515', 
  '54', '', '', '', 'ปวดตึงหลัง', 'LBP', 
  '["PMS"]'::jsonb, '', 500, '', '2026-04-16T13:45:00Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;
