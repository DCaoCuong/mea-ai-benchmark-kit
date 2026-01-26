# Medical Examination Assistant (MEA) - BE (NestJS)


```
Bước 1: Khởi tạo phiên khám
  └─ GET /api/v1/emr/current-session (HIS)
  └─ Trả về: visitId, patient info, history

Bước 2: Ghi âm & Xử lý
  └─ Stream Audio → STT (Giọng nói → Văn bản)
  └─ NLP Processing (Triệu chứng, Thuốc...)

Bước 3: Auto-fill Form
  └─ Trigger Final Analysis
  └─ POST /api/v1/emr/update/{visitId}
  └─ Payload: Chẩn đoán, Triệu chứng, Sinh hiệu

Bước 4: Review & Final Save
  └─ Hiển thị dữ liệu màn hình (Draft)
  └─ Bác sĩ chỉnh sửa
  └─ Lưu bệnh án (Final Save) → HIS
```

### Flow hiện tại (đã implement)

```
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD - Entry Point                                 │
│ ┌─────────────┐  ┌──────────────┐                      │
│ │ Bệnh nhân   │  │ Tìm kiếm     │                      │
│ │ mới         │  │ bệnh nhân    │                      │
│ └─────────────┘  └──────────────┘                      │
│                                                          │
│ Stats: Today | Week | Month | Total                     │
│ Recent Sessions Table                                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ EXAMINATION PAGE - Progressive Vertical Layout          │
│                                                          │
│ ┌─ Step 1: Ghi âm hội thoại ─────────────────────┐     │
│ │ 🎙️ Bắt đầu ghi âm                               │     │
│ │ Status: ⏳ Pending → 🔄 Active → ✅ Completed    │     │
│ └──────────────────────────────────────────────────┘     │
│                    ↓                                     │
│ ┌─ Step 2: Speech-to-Text ────────────────────────┐     │
│ │ • Whisper STT (Groq)                             │     │
│ │ • Role Detection (Bác sĩ/Bệnh nhân)             │     │
│ │ • Medical Text Fixer                             │     │
│ │ • Display: Structured Transcripts                │     │
│ └──────────────────────────────────────────────────┘     │
│                    ↓                                     │
│ ┌─ Step 3: AI Analysis & Review ──────────────────┐     │
│ │ • 3 AI Agents (Scribe, ICD-10, Medical Expert)  │     │
│ │ • SOAP Notes generation                          │     │
│ │ • ICD-10 codes suggestion                        │     │
│ │ • RAG-based medical advice                       │     │
│ │ • Doctor Review Form (editable)                  │     │
│ └──────────────────────────────────────────────────┘     │
│                    ↓                                     │
│ ┌─ Step 4: AI vs Doctor Comparison ───────────────┐     │
│ │ • Semantic similarity scoring                    │     │
│ │ • ICD code matching                              │     │
│ │ • Overall match score (0-100%)                   │     │
│ │ • Save to database for analytics                 │     │
│ └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```