# Plan: Local AI Model Benchmarking & Optimization

**Created**: 2026-03-02 09:48  
**Status**: 🟡 In Progress  
**Scope**: MEA (Medical Examination Assistant)

---

## 🎯 Mục tiêu

Đánh giá và benchmark **tất cả local AI models** đang dùng trong pipeline MEA để:
1. Tìm model **phù hợp nhất** cho từng công việc (accuracy + speed + VRAM)
2. Xây dựng **bộ test data** chuẩn cho evaluation
3. Tạo **benchmark infrastructure** tái sử dụng
4. Đưa ra **kết luận rõ ràng**: model nào cho task nào

---

## 📊 Current Model Mapping

| Task | Role | Current Model | VRAM | Timeout |
|------|------|---------------|------|---------|
| **STT (Speech-to-Text)** | Transcribe audio → text | WhisperX `small` | ~2GB | - |
| ↳ *STT Candidates* | *Benchmark: WhisperX / Whisper-large-v3 / Moonshine / Parakeet-CTC-Vi* | *(see below)* | *varies* | - |
| **Role Detection** | Phân biệt Bác sĩ / Bệnh nhân | Ollama `gemma2:2b` (LIGHT) | ~1.5GB | 60s |
| **Medical Text Fixer** | Sửa lỗi thuật ngữ y khoa | Ollama `gemma2:2b` (LIGHT) | ~1.5GB | 60s |
| **Scribe Agent (SOAP)** | Transcript → SOAP notes | Ollama `gemma2:2b` (LIGHT) | ~1.5GB | 60s |
| **ICD-10 Agent** | Gợi ý mã ICD-10 | Ollama `gemma2:2b` (LIGHT) | ~1.5GB | 60s |
| **Expert Agent (RAG)** | Tư vấn y khoa dựa trên knowledge base | Ollama `llama3.2` (EXPERT) | ~2GB | 60s |
| **Embeddings** | Tạo vector cho RAG / Comparison | Ollama `nomic-embed-text-v2-moe` | ~0.5GB | - |
| **Comparison** | So sánh AI vs Doctor (cosine similarity) | Ollama embeddings | ~0.5GB | - |

### Env Config hiện tại (.env)
```
OLLAMA_MODEL_LIGHT=gemma2:2b       # Role Detection, Medical Fixer, Scribe, ICD
OLLAMA_MODEL_STANDARD=phi3:3.8b    # Default fallback (code nhưng ít dùng)  
OLLAMA_MODEL_EXPERT=llama3.2       # Expert Agent (RAG)
OLLAMA_EMBEDDING_MODEL=nomic-embed-text-v2-moe  # Embeddings
WHISPER_MODEL=small                # WhisperX STT
```

---

## 🖥️ Hardware Constraints

| Component | Spec | Vai trò |
|-----------|------|---------|
| CPU | i7-11800H @ 2.30GHz | WhisperX fallback, general compute |
| RAM | 16GB | WhisperX + Ollama models |
| GPU | RTX 3050 Ti ~4GB VRAM | Ollama models & WhisperX |

> ⚠️ **Constraint quan trọng**: Chỉ có 4GB VRAM → các model lớn (>4B params) cần chạy tuần tự, không song song.

---

## 🎯 Candidate Models to Benchmark

### LLM Models (cho Chat/Analysis tasks)

| Model | Params | VRAM | Strengths | Khả năng tiếng Việt |
|-------|--------|------|-----------|---------------------|
| `gemma2:2b` | 2B | ~1.5GB | Nhẹ, nhanh | ★★★☆☆ |
| `gemma3:4b` | 4B | ~2.5GB | Cân bằng tốt | ★★★★☆ |
| `qwen3:4b` | 4B | ~2.5GB | Mạnh multilingual, thinking mode | ★★★★★ |
| `qwen3:1.7b` | 1.7B | ~1.2GB | Rất nhẹ | ★★★★☆ |
| `phi3:3.8b` | 3.8B | ~2.3GB | Reasoning tốt | ★★★☆☆ |
| `phi4-mini:3.8b` | 3.8B | ~2.3GB | Phi4 mới hơn | ★★★☆☆ |
| `llama3.2:3b` | 3B | ~2GB | Tốt cho instruction | ★★★☆☆ |
| `llama3.2:1b` | 1B | ~0.8GB | Cực nhẹ | ★★☆☆☆ |
| `mistral:7b` | 7B | ~4GB | Mạnh nhất (if fits) | ★★★☆☆ |
| `gemma3:12b` (Q4) | 12B | ~6GB+ | Reference (nếu fit CPU offload) | ★★★★★ |

### STT Models (4 Engines)

#### A. WhisperX (đang dùng - Whisper + Alignment + Diarization)

| Model | Size | VRAM | Acc (vi) | Speed | Diarization |
|-------|------|------|----------|-------|-------------|
| `tiny` | 75MB | ~1GB | ★★☆☆☆ | Rất nhanh | ✅ |
| `base` | 142MB | ~1GB | ★★★☆☆ | Nhanh | ✅ |
| `small` | 466MB | ~2GB | ★★★★☆ | Trung bình | ✅ |
| `medium` | 1.5GB | ~4GB | ★★★★★ | Chậm | ✅ |

> **Ưu điểm**: Alignment (timestamp chính xác) + Speaker Diarization (phân biệt người nói)  
> **Runtime**: Python (FastAPI server), cần conda env riêng

#### B. Whisper-large-v3 (OpenAI - chạy qua faster-whisper hoặc Groq API)

| Model | Params | VRAM | Acc (vi) | Speed | Notes |
|-------|--------|------|----------|-------|-------|
| `large-v3` | 1.55B | ~6GB | ★★★★★ | Chậm | Quá lớn cho 4GB VRAM → CPU offload hoặc API |
| `large-v3-turbo` | 809M | ~4GB | ★★★★★ | Nhanh hơn v3 | Có thể vừa 4GB VRAM (tight) |

> **Ưu điểm**: Accuracy cao nhất (train 5M+ hours), hỗ trợ 99 ngôn ngữ  
> **Nhược điểm**: VRAM lớn, không có diarization built-in  
> **Option**: Dùng Groq API (free tier) cho accuracy reference benchmark

#### C. Moonshine Voice (Useful Sensors - siêu nhẹ, real-time)

| Model | Params | Size | VRAM | Acc (vi) | Speed | Notes |
|-------|--------|------|------|----------|-------|-------|
| `moonshine-tiny` | ~26M | ~26MB | <1GB | ★★☆☆☆ | Cực nhanh | <8MB RAM, IoT-ready |
| `moonshine-base` | ~60M | ~60MB | <1GB | ★★★☆☆ | Rất nhanh | Production-grade |

> **Ưu điểm**: 5x nhanh hơn Whisper, RoPE (xử lý audio variable-length hiệu quả), hỗ trợ Vietnamese  
> **Nhược điểm**: Accuracy thấp hơn Whisper, không có diarization built-in  
> **Runtime**: Python, open-source

#### D. Parakeet-CTC-0.6B-Vietnamese (NVIDIA NeMo - chuyên tiếng Việt)

| Model | Params | VRAM | Acc (vi) | Speed | Notes |
|-------|--------|------|----------|-------|-------|
| `parakeet-ctc-0.6b-vi` | 600M | ~2GB | ★★★★★ | Nhanh | Train 2000-4000h Vietnamese audio |

> **Ưu điểm**: **Chuyên biệt cho tiếng Việt** (WER ~6-11% trên Vietnamese benchmarks),  
> hỗ trợ Vietnamese-English code-switching, tự động thêm dấu câu  
> **Nhược điểm**: Cần NeMo toolkit (nặng hơn), không có diarization  
> **Runtime**: Python + NeMo framework, NVIDIA license  
> **Benchmarks chính thức**: VIVOS WER 5.96%, VLSP 2021 WER 8.99%, Gigaspeech2 WER 11.23%

### Embedding Models

| Model | Dimensions | Size | Accuracy |
|-------|-----------|------|----------|
| `nomic-embed-text-v2-moe` | 768 | ~280MB | ★★★★☆ |
| `mxbai-embed-large` | 1024 | ~670MB | ★★★★★ |
| `all-minilm` | 384 | ~110MB | ★★★☆☆ |
| `snowflake-arctic-embed` | 1024 | ~670MB | ★★★★☆ |

---

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | Benchmark Infrastructure | ⬜ Pending | 0% |
| 02 | Test Data & Ground Truth | ⬜ Pending | 0% |
| 03 | STT Model Benchmarking | ⬜ Pending | 0% |
| 04 | LLM Task Benchmarking | ⬜ Pending | 0% |
| 05 | Embedding Model Benchmarking | ⬜ Pending | 0% |
| 06 | Results Analysis & Final Config | ⬜ Pending | 0% |

---

## Quick Commands

- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
