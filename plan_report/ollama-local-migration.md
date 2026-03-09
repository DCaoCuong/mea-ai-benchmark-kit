# Ollama Local Migration - Full Local AI Setup

## Goal

Chuyển đổi BE từ Groq API sang chạy **100% local**:
- **LLM Chat**: Ollama (qwen3:4b, llama3.2)
- **Speech-to-Text**: WhisperX (Python, Alignment + Diarization)
- **Role Detection**: Giữ logic LLM hiện tại (context-aware cho medical)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Audio Input                            │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  WhisperX Server (Python/FastAPI)                            │
│  Port: 8080 | Model: small                                  │
│  → Transcribe + Align + Diarize                             │
│  → Result: JSON with Speakers & Precise Timestamps          │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Ollama LLM (GPU ~3GB VRAM)                                 │
│  Port: 11434 | Model: qwen3:4b                              │
│  → Role Detection (Bác sĩ/Bệnh nhân)                        │
│  → Medical Text Fixer                                       │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Ollama LLM Agents                                          │
│  → Scribe Agent (SOAP notes) - qwen3:4b                     │
│  → ICD-10 Agent - qwen3:4b                                  │
│  → Medical Expert Agent - llama3.2                          │
└─────────────────────────────────────────────────────────────┘
```

---

| Component | Spec | Vai trò |
|-----------|------|---------|
| CPU | i7-11800H @ 2.30GHz | ✅ WhisperX (Alignment/CPU fallback) |
| RAM | 16GB | ✅ Đủ cho WhisperX + Ollama |
| GPU | RTX 3050 Ti ~4GB | ✅ Ollama models & WhisperX (Sequential) |
| Ollama Models | qwen3:4b, llama3.2 | ✅ Đủ VRAM |

> [!TIP]
> Do hệ thống chạy tuần tự (STT xong mới đến LLM), GPU 4GB hoàn toàn đáp ứng được cả hai nếu giải phóng memory giữa các bước.

---

## Proposed Changes

### Component 1: LLM Provider (Ollama)

#### [NEW] [ollama.models.ts](file:///d:/Senlyzer/agent_skill_kits/medical-examination-assistant-be-kit/src/agents/models/ollama.models.ts)

Tạo Ollama client thay thế Groq:
- OpenAI-compatible API wrapper (`fetch` to `localhost:11434/v1/chat/completions`)
- Environment-based configuration
- Model mapping:
  - `GROQ_MODEL_STANDARD` → `qwen3:4b`
  - `GROQ_MODEL_EXPERT` → `llama3.2`

#### [MODIFY] [agent-nodes.service.ts](file:///d:/Senlyzer/agent_skill_kits/medical-examination-assistant-be-kit/src/agents/services/agent-nodes.service.ts)

- Thay import từ `groq.models` → `ollama.models`
- Thay `groq.chat.completions.create()` → `ollamaChat()`
- Cập nhật model names

#### [MODIFY] [stt.service.ts](file:///d:/Senlyzer/agent_skill_kits/medical-examination-assistant-be-kit/src/stt/stt.service.ts)

- Thay `getGroqClient()` → `ollamaChat()` cho:
  - `detectSpeakerRoleByContent()` - role detection
  - `fixMedicalText()` - medical terminology fixer
- Giữ nguyên logic, chỉ đổi LLM provider

---

### Component 2: Speech-to-Text (WhisperX)

> [!IMPORTANT]
> Dùng **WhisperX** thay vì Whisper.cpp vì:
> - Có tính năng **Alignment** (khớp từ chính xác với timestamp)
> - Hỗ trợ **Speaker Diarization** (phân biệt Bác sĩ/Bệnh nhân)
> - Dễ dàng quản lý logic Python cho medical context

#### Setup WhisperX Server (Windows/Conda)

```powershell
# Step 1: Create Environment
conda create -n whisperx python=3.10
conda activate whisperx

# Step 2: Install WhisperX & Dependencies
pip install whisperx fastapi uvicorn python-multipart
# Lưu ý: Cần cài đặt ffmpeg trên Windows (choco install ffmpeg)

# Step 3: Run Server
# File: whisperx_server.py (Sẽ được tạo ở bước tiếp theo)
python whisperx_server.py --port 8080
```

#### [MODIFY] [stt.service.ts](file:///d:/Senlyzer/agent_skill_kits/medical-examination-assistant-be-kit/src/stt/stt.service.ts)

Thay đổi `transcribeWithGroq()` sang gọi local WhisperX:
```diff
- const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', ...)
+ const response = await fetch(`${process.env.WHISPER_BASE_URL}/inference`, ...)
```

---

### Component 3: Environment Configuration

#### [MODIFY] [.env](file:///d:/Senlyzer/agent_skill_kits/medical-examination-assistant-be-kit/.env)

```diff
- GROQ_API_KEY=""
- GOOGLE_API_KEY=""
+ # ============================================
+ # LOCAL AI CONFIGURATION
+ # ============================================
+
+ # Ollama LLM
+ OLLAMA_BASE_URL="http://localhost:11434"
+ OLLAMA_MODEL_STANDARD="qwen3:4b"
+ OLLAMA_MODEL_EXPERT="llama3.2"
+
+ # WhisperX STT
+ WHISPER_BASE_URL="http://localhost:8080"
+ WHISPER_MODEL="small"
+ WHISPER_LANGUAGE="vi"
+ HF_TOKEN="your_hugging_face_token_here"

KNOWLEDGE_BASE_PATH="./data/knowledge_base"
VECTOR_STORE_PATH="./data/vector_store"
POSTGRES_URL=""
CORS_ORIGIN=""
```

---

## Tasks

- [x] **Task 1**: Setup Whisper.cpp server ✅
  - User setup manually
  - Test: `curl http://localhost:8080/` returns server info
  
- [x] **Task 2**: Tạo `ollama.models.ts` ✅
  - OpenAI-compatible client wrapper
  - Verify: TypeScript compile OK

- [x] **Task 3**: Cập nhật `agent-nodes.service.ts` ✅
  - Thay Groq → Ollama cho 3 agents
  - Verify: Không còn import từ `groq.models`

- [x] **Task 4**: Cập nhật `stt.service.ts` ✅
  - Thay Groq LLM → Ollama cho role detection
  - Thay Groq Whisper → WhisperX endpoint
  - Verify: Không còn call `api.groq.com`

- [x] **Task 5**: Cập nhật `.env` ✅
  - Thêm Ollama và Whisper config
  - Verify: `npm run start:dev` không lỗi env

- [x] **Task 6**: Remove Groq dependency ✅
  - Xóa `groq-sdk` từ package.json
  - Xóa file `groq.models.ts`
  - Verify: `npm run build` thành công

- [ ] **Task 7**: Test tích hợp end-to-end
  - Upload audio → SOAP note từ local models
  - Verify: Toàn bộ pipeline offline-capable

---

## Done When

- [ ] `npm run build` thành công
- [ ] WhisperX server chạy ổn định (with Diarization)
- [ ] Ollama models được gọi thay vì Groq
- [ ] Không còn dependency `groq-sdk`
- [ ] Toàn bộ pipeline chạy offline

---

## Verification Plan

### Prerequisites Check

```powershell
# 1. Kiểm tra Ollama
ollama list
# Expected: qwen3:4b, llama3.2

# 2. Test Ollama API
curl http://localhost:11434/api/tags
# Expected: JSON với list models

# 3. Test WhisperX server
curl http://localhost:8080/
# Expected: Server status info
```

### Build & Lint

```powershell
cd d:\Senlyzer\agent_skill_kits\medical-examination-assistant-be-kit
npm run build
npm run lint
```

### Integration Test

```powershell
# Start BE
npm run start:dev

# Test STT endpoint (cần file audio test)
curl -X POST http://localhost:3000/stt/transcribe -F "audio=@test.wav"

# Test Agent pipeline
curl -X POST http://localhost:3000/agents/process -H "Content-Type: application/json" -d "{\"transcript\": \"Chào bác sĩ, tôi bị đau bụng\"}"
```

---

## Notes

### WhisperX Model Selection

| Model | Size | RAM | Accuracy | Speed |
|-------|------|-----|----------|-------|
| `tiny` | 75MB | ~1GB | ★★☆☆☆ | Rất nhanh |
| `small` | 466MB | ~2GB | ★★★☆☆ | Nhanh |
| `medium` | 1.5GB | ~4GB | ★★★★☆ | Trung bình |

> **Recommended**: `small` with `int8` - tối ưu hóa cho máy RAM 16GB và VRAM 4GB.

### Ollama Model Mapping

| Use Case | Groq Model | Ollama Model | VRAM |
|----------|------------|--------------|------|
| Scribe Agent | gpt-oss-120b | qwen3:4b | ~3GB |
| ICD-10 Agent | gpt-oss-120b | qwen3:4b | ~3GB |
| Expert Agent | gpt-oss-20b | llama3.2 | ~2GB |
| Role Detection | gpt-oss-120b | qwen3:4b | ~3GB |
| Medical Fixer | gpt-oss-120b | qwen3:4b | ~3GB |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WhisperX VRAM Peak | Ollama crash | Sequential execution và clear cache |
| Diarization Accuracy | Gán nhầm role | Dùng LLM context-aware để gán lại role |
| Latency cao | UX chậm | Dùng align model nhẹ (vi) |
