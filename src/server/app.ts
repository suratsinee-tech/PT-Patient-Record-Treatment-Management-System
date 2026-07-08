import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { INITIAL_RECORDS } from "../data";
import { PatientRecord } from "../types";

dotenv.config();

const app = express();
const DATA_FILE = path.join(process.cwd(), "records.json");

// Parse JSON payloads
app.use(express.json());

// Initialize Supabase Client if credentials are provided
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);

let supabase: any = null;
if (isSupabaseEnabled) {
  console.log("Supabase URL and Key found. Using Supabase for data persistence.");
  supabase = createClient(supabaseUrl!, supabaseKey!);
} else {
  console.log("Supabase credentials not configured. Falling back to local file storage (records.json).");
}

// Initialize Gemini SDK lazily
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helpers for fallback file database
function loadRecords(): PatientRecord[] {
  if (!fs.existsSync(DATA_FILE)) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_RECORDS, null, 2), "utf-8");
      return INITIAL_RECORDS;
    } catch (e) {
      console.error("Error writing initial seed data:", e);
      return INITIAL_RECORDS;
    }
  }
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error("Error reading records file:", e);
    return INITIAL_RECORDS;
  }
}

function saveRecords(records: PatientRecord[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving records:", e);
  }
}

// Seed the local JSON file if empty
if (!isSupabaseEnabled) {
  loadRecords();
}

// Unified Async Database Operations Layer
async function getAllRecords(): Promise<PatientRecord[]> {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("patient_records")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      console.error("Supabase error fetching records:", error);
      throw error;
    }
    return data || [];
  } else {
    return loadRecords();
  }
}

async function addRecord(newRecord: PatientRecord): Promise<PatientRecord> {
  if (!newRecord.id) {
    newRecord.id = 'rec_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Auto generate PT Number if empty
  if (!newRecord.ptNo || newRecord.ptNo.trim() === '') {
    const records = await getAllRecords();
    const currentYear = 69; // 2569
    const ptPrefix = `PT${currentYear}-`;
    let maxNum = 0;
    
    records.forEach(r => {
      if (r.ptNo && r.ptNo.startsWith(ptPrefix)) {
        const numPart = parseInt(r.ptNo.replace(ptPrefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    
    const nextNum = maxNum + 1;
    newRecord.ptNo = `${ptPrefix}${String(nextNum).padStart(3, '0')}`;
  }
  
  newRecord.createdAt = new Date().toISOString();

  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("patient_records")
      .insert([newRecord])
      .select();
    if (error) {
      console.error("Supabase error inserting record:", error);
      throw error;
    }
    return data && data[0] ? data[0] : newRecord;
  } else {
    const records = loadRecords();
    records.push(newRecord);
    saveRecords(records);
    return newRecord;
  }
}

async function updateRecord(id: string, updatedFields: Partial<PatientRecord>): Promise<PatientRecord> {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("patient_records")
      .update(updatedFields)
      .eq("id", id)
      .select();
    if (error) {
      console.error("Supabase error updating record:", error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error("Record not found");
    }
    return data[0];
  } else {
    const records = loadRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error("Record not found");
    }
    const updatedRecord = { ...records[index], ...updatedFields, id };
    records[index] = updatedRecord;
    saveRecords(records);
    return updatedRecord;
  }
}

async function deleteRecordById(id: string): Promise<boolean> {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from("patient_records")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Supabase error deleting record:", error);
      throw error;
    }
    return true;
  } else {
    const records = loadRecords();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length === records.length) {
      return false;
    }
    saveRecords(filtered);
    return true;
  }
}

async function resetDbToSeed(): Promise<PatientRecord[]> {
  if (isSupabaseEnabled) {
    const { error: deleteError } = await supabase
      .from("patient_records")
      .delete()
      .neq("id", "none");
    if (deleteError) {
      console.error("Supabase error clearing during reset:", deleteError);
      throw deleteError;
    }
    const { data, error: insertError } = await supabase
      .from("patient_records")
      .insert(INITIAL_RECORDS)
      .select();
    if (insertError) {
      console.error("Supabase error seeding during reset:", insertError);
      throw insertError;
    }
    return data || INITIAL_RECORDS;
  } else {
    saveRecords(INITIAL_RECORDS);
    return INITIAL_RECORDS;
  }
}

async function clearAllDbRecords(): Promise<PatientRecord[]> {
  if (isSupabaseEnabled) {
    const { error } = await supabase
      .from("patient_records")
      .delete()
      .neq("id", "none");
    if (error) {
      console.error("Supabase error clearing records:", error);
      throw error;
    }
    return [];
  } else {
    saveRecords([]);
    return [];
  }
}

async function importBulkRecords(recordsToImport: PatientRecord[]): Promise<PatientRecord[]> {
  const processed = recordsToImport.map(r => {
    if (!r.id) {
      r.id = 'rec_' + Math.random().toString(36).substr(2, 9);
    }
    if (!r.createdAt) {
      r.createdAt = new Date().toISOString();
    }
    return r;
  });

  if (isSupabaseEnabled) {
    const { data, error } = await supabase
      .from("patient_records")
      .upsert(processed)
      .select();
    if (error) {
      console.error("Supabase error importing records:", error);
      throw error;
    }
    return data || processed;
  } else {
    saveRecords(processed);
    return processed;
  }
}

// ================= API ENDPOINTS =================

// GET database status and test connection (diagnostic endpoint)
app.get("/api/db-status", async (req, res) => {
  try {
    const status = {
      isSupabaseEnabled,
      supabaseUrlConfigured: !!process.env.SUPABASE_URL,
      supabaseKeyConfigured: !!process.env.SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: !!process.env.VERCEL,
      testFetch: "not_attempted" as any
    };

    if (isSupabaseEnabled) {
      try {
        const { data, error } = await supabase
          .from("patient_records")
          .select("id")
          .limit(1);
        if (error) {
          status.testFetch = { success: false, error: error.message };
        } else {
          status.testFetch = { success: true, count: data?.length || 0 };
        }
      } catch (e: any) {
        status.testFetch = { success: false, error: e.message || e };
      }
    }
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all records
app.get("/api/records", async (req, res) => {
  try {
    const records = await getAllRecords();
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new record
app.post("/api/records", async (req, res) => {
  try {
    const saved = await addRecord(req.body);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) an existing record
app.put("/api/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateRecord(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a record
app.delete("/api/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteRecordById(id);
    if (!success) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST reset database to initial seed records
app.post("/api/records/reset", async (req, res) => {
  try {
    const records = await resetDbToSeed();
    res.json({ success: true, records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST clear all records
app.post("/api/records/clear", async (req, res) => {
  try {
    const records = await clearAllDbRecords();
    res.json({ success: true, records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST bulk import records
app.post("/api/records/import", async (req, res) => {
  try {
    const recordsToImport: PatientRecord[] = req.body;
    if (!Array.isArray(recordsToImport)) {
      return res.status(400).json({ error: "Invalid data format. Expected an array." });
    }
    const processed = await importBulkRecords(recordsToImport);
    res.json({ success: true, count: processed.length, records: processed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
