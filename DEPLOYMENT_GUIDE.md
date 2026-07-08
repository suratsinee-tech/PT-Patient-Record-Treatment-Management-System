# คู่มือการเตรียมระบบและอัปโหลดไปยัง GitHub + Supabase 🚀
(Deployment & Setup Guide: GitHub + Supabase)

ระบบบันทึกข้อมูลคลินิกกายภาพบำบัดนี้ ได้รับการออกแบบให้พร้อมทำงานทั้งแบบ **Local File Fallback** (จัดเก็บใน `records.json` อัตโนมัติใน AI Studio) และพร้อมเปลี่ยนไปใช้ **Supabase Cloud Database** เมื่อคุณระบุค่าตัวแปรใน Environment Variables

นี่คือวิธีดำเนินการทีละขั้นตอนในการย้ายระบบของคุณไปยังฐานข้อมูล Supabase และ GitHub:

---

## ส่วนที่ 1: การตั้งค่าฐานข้อมูลใน Supabase 🗄️

1. **สมัคร/เข้าใช้งาน Supabase**: เข้าไปที่ [https://supabase.com](https://supabase.com) และเข้าสู่ระบบ
2. **สร้างโปรเจกต์ใหม่ (Create New Project)**:
   - กดปุ่ม **New Project**
   - เลือก Organization, ตั้งชื่อโปรเจกต์ (เช่น `physio-clinic-log`)
   - กำหนดรหัสผ่านฐานข้อมูล (Database Password) และเลือกภูมิภาคเซิร์ฟเวอร์ (แนะนำ Singapore หรือภูมิภาคใกล้เคียงเพื่อการเชื่อมต่อที่รวดเร็ว)
3. **รันคำสั่งสร้างตารางใน SQL Editor**:
   - ไปที่เมนู **SQL Editor** จากแถบเครื่องมือด้านซ้าย
   - กด **New Query**
   - คัดลอกเนื้อหาทั้งหมดจากไฟล์ `supabase_schema.sql` ในโปรเจกต์นี้ไปวางลงในช่องพิมพ์คำสั่ง
   - กดปุ่ม **Run** ด้านขวาล่าง
   - *ระบบจะทำการสร้างตาราง `patient_records` ตั้งค่าความปลอดภัย RLS, สร้างดัชนี และนำเข้า 9 รายการข้อมูลตัวอย่างเริ่มต้นให้เรียบร้อยโดยอัตโนมัติ!*

---

## ส่วนที่ 2: คัดลอกกุญแจเชื่อมต่อ (Supabase API Keys) 🔑

เมื่อรัน SQL เสร็จแล้ว ให้คัดลอกค่าต่อไปนี้จากหน้าแดชบอร์ดของ Supabase:
1. ไปที่เมนู **Project Settings** (ไอคอนฟันเฟืองด้านล่างซ้าย) -> **API**
2. คัดลอกค่าของ:
   - **Project URL**: (เช่น `https://xyzabc.supabase.co`) -> จะนำไปตั้งเป็น `SUPABASE_URL`
   - **API Key (anon / public)**: -> จะนำไปตั้งเป็น `SUPABASE_ANON_KEY`

---

## ส่วนที่ 3: การตั้งค่าบน GitHub & Hosting (เช่น Render, Vercel, Cloud Run) 🌐

1. **ส่งออกโค้ดไปยัง GitHub (Export to GitHub)**:
   - ที่มุมขวาบนของ AI Studio ให้คลิกที่เมนู **Settings** (หรือเมนูส่งออก)
   - เลือก **Export to GitHub** หรือดาวน์โหลดไฟล์ ZIP แล้วอัปโหลดขึ้น GitHub Repository ของคุณเอง
2. **ตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)**:
   - เมื่อคุณติดตั้งแอปพลิเคชันของคุณบนโฮสติ้ง (เช่น Render, Vercel, Zeabur, หรือ Docker Container) ให้ระบุค่าตัวแปรสิ่งแวดล้อมเหล่านี้ในโปรเจกต์ของคุณ:

```env
# URL และ API Key จาก Supabase ที่คัดลอกมาใน ส่วนที่ 2
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"

# คีย์ของ Google Gemini (ระบบจะอ่านอัตโนมัติเพื่อใช้ AI วิเคราะห์อาการ)
GEMINI_API_KEY="your-gemini-api-key-here"

# โหมดการทำงาน (ควรตั้งเป็น production เมื่อเผยแพร่ใช้งานจริง)
NODE_ENV="production"
```

---

## โครงสร้างไฟล์ที่เตรียมไว้ให้ในระบบ 📂

- `supabase_schema.sql`: โครงสร้างคำสั่งตาราง ดัชนี นโยบายความปลอดภัย RLS และตัวอย่างข้อมูลเริ่มต้น
- `server.ts`: เซิร์ฟเวอร์ที่รองรับระบบ Dual-Mode (เชื่อมต่อ Supabase โดยอัตโนมัติเมื่อตรวจพบ Credentials และจะสลับกลับมาที่ Local File Storage เสมอหากยังไม่พร้อม เพื่อป้องกันระบบล่ม)
- `.env.example`: แม่แบบแสดงรายการตัวแปรสิ่งแวดล้อมที่แอปพลิเคชันนี้ใช้งาน
