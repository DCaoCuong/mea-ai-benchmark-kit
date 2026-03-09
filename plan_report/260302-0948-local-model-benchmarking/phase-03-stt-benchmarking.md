# Phase 03: STT Model Benchmarking (Expanded)

**Status**: ✅ Complete  
**Dependencies**: Phase 01, Phase 02  
**Estimated Time**: 6-10 hours (mở rộng: 4 engines thay vì chỉ WhisperX)

---

## Objective

Benchmark **4 STT engines khác nhau** (không chỉ WhisperX sizes) để tìm giải pháp tốt nhất cho:
- **Accuracy**: Độ chính xác nhận dạng tiếng Việt y khoa (thuật ngữ chuyên môn)
- **Speed**: Thời gian xử lý audio (realtime factor)
- **VRAM**: Bộ nhớ GPU cần dùng
- **Diarization**: Chất lượng phân biệt speaker (Bác sĩ / Bệnh nhân)
- **Punctuation**: Tự động thêm dấu câu?
- **Medical terms**: Nhận dạng thuật ngữ y khoa (amoxicillin, viêm amidan, ICD...)
- **Integration effort**: Dễ tích hợp vào NestJS backend hiện tại không?

---

## 🤖 4 STT Engines cần Benchmark

### Engine A: WhisperX (đang dùng)

| Variant | Params | VRAM | Diarization | Notes |
|---------|--------|------|-------------|-------|
| `tiny` | 39M | ~1GB | ✅ Yes | Baseline speed |
| `base` | 74M | ~1GB | ✅ Yes | |
| `small` | 244M | ~2GB | ✅ Yes | **Đang dùng** |
| `medium` | 769M | ~4GB | ✅ Yes | Max quality cho VRAM 4GB |

**Ưu điểm**:
- ✅ Đã tích hợp sẵn trong project (whisperx_server.py)
- ✅ Speaker diarization built-in (qua pyannote)
- ✅ Word-level alignment (timestamp chính xác từng từ)
- ✅ Chạy 100% local

**Nhược điểm**:
- ⚠️ Cần conda env riêng (Python)
- ⚠️ Diarization cần HuggingFace token
- ⚠️ Không tự thêm dấu câu

**Integration**: ✅ Đã có - gọi qua HTTP `/inference`

---

### Engine B: Whisper-large-v3 / v3-turbo (OpenAI)

| Variant | Params | VRAM | Diarization | Notes |
|---------|--------|------|-------------|-------|
| `large-v3` | 1.55B | ~6GB | ❌ No | Quá lớn cho 4GB VRAM → CPU hoặc Groq API |
| `large-v3-turbo` | 809M | ~4GB | ❌ No | Có thể vừa 4GB (rất tight) |

**Ưu điểm**:
- ✅ Accuracy cao nhất (train trên 5M+ hours data)
- ✅ Hỗ trợ 99 ngôn ngữ (Vietnamese included)
- ✅ 10-20% error reduction so với v2
- ✅ Có thể chạy qua `faster-whisper` library (tối ưu inference)
- ✅ Groq API free tier → dùng làm "accuracy ceiling" reference

**Nhược điểm**:
- ❌ VRAM 4GB có thể không đủ cho large-v3
- ❌ Không có diarization → cần thêm pipeline riêng
- ❌ Không có word alignment → cần WhisperX để post-process

**Integration options**:
1. **Local (faster-whisper)**: Tạo Python server giống whisperx_server.py nhưng dùng large-v3-turbo
2. **API (Groq)**: Gọi Groq API → nhanh nhưng cần internet
3. **Hybrid**: Dùng Groq API chỉ cho benchmark reference, production vẫn local

**Benchmark plan**:
- Chạy `large-v3-turbo` qua `faster-whisper` (local, CPU nếu VRAM không đủ)
- Chạy `large-v3` qua Groq API (free tier) → accuracy ceiling
- So sánh với WhisperX small/medium

---

### Engine C: Moonshine Voice (Useful Sensors)

| Variant | Params | Size | VRAM | Notes |
|---------|--------|------|------|-------|
| `moonshine-tiny` | ~26M | ~26MB | <1GB | Siêu nhẹ, <8MB RAM |
| `moonshine-base` | ~60M | ~60MB | <1GB | Production-grade edge |

**Ưu điểm**:
- ✅ **5x nhanh hơn Whisper** cho 10s audio segments
- ✅ Siêu nhẹ: chạy trên Raspberry Pi, IoT devices
- ✅ RoPE (variable-length audio, không padding waste)
- ✅ Open-source, hỗ trợ Vietnamese
- ✅ Real-time streaming capable (incremental processing)

**Nhược điểm**:
- ❌ Accuracy thấp hơn Whisper (đặc biệt cho low-resource languages)
- ❌ Không có diarization (cần pipeline riêng)
- ❌ Không có alignment (no word timestamps)
- ❌ Model nhỏ → khó handle thuật ngữ y khoa phức tạp
- ⚠️ Vietnamese support có thể chưa mature

**Integration**:
- Cần tạo Python/Node server wrapper mới
- Hoặc dùng ONNX runtime trong Node.js trực tiếp

**Benchmark plan**:
- Install `moonshine` package
- Tạo simple FastAPI server (giống whisperx_server.py)
- Test với cùng audio files
- Đặc biệt đo: latency cho short segments (<10s) vs long (1-3 min)

---

### Engine D: Parakeet-CTC-0.6B-Vietnamese (NVIDIA NeMo)

| Variant | Params | VRAM | Notes |
|---------|--------|------|-------|
| `parakeet-ctc-0.6b-vi` | 600M | ~2GB | Chuyên biệt tiếng Việt |

**Ưu điểm**:
- ✅ **Chuyên biệt cho tiếng Việt** - train trên 2000-4000h Vietnamese audio
- ✅ Benchmark cực tốt: VIVOS WER 5.96%, VLSP 2021 WER 8.99%
- ✅ Hỗ trợ Vietnamese-English code-switching (thuật ngữ y khoa Latin)
- ✅ **Tự động thêm dấu câu** (punctuation & capitalization)
- ✅ Word timestamps tích hợp
- ✅ FastConformer architecture (optimized Conformer)
- ✅ NVIDIA license: commercial + non-commercial OK

**Nhược điểm**:
- ❌ Cần NeMo toolkit (heavy dependency, ~2GB+ install)
- ❌ Không có speaker diarization (cần pipeline riêng)
- ❌ Setup phức tạp hơn WhisperX
- ⚠️ Có thể cần Docker hoặc specific CUDA version

**Integration**:
- Cần install `nemo_toolkit[asr]` 
- Tạo FastAPI server wrapper
- Hoặc: dùng NVIDIA NIM inference microservice (Docker)

**Benchmark plan**:
- Install NeMo toolkit trong conda env
- Tạo `parakeet_server.py` (FastAPI, cùng interface `/inference`)
- Test đặc biệt: **thuật ngữ y khoa** (advantage chính)
- Test Vietnamese-English mixed terms

---

## Requirements

### Functional
- [x] Benchmark **8 model variants** across 4 engines
- [x] Đo WER (Word Error Rate) cho tiếng Việt y khoa
- [x] Đo RTF (Real-Time Factor): processing_time / audio_duration
- [x] Đo chất lượng diarization (chỉ với WhisperX)
- [x] Đo VRAM peak usage cho mỗi model
- [x] Đo **medical term accuracy** riêng biệt (sub-metric)
- [x] Đo punctuation accuracy (cho Parakeet vs manual)

### Non-Functional
- [x] Mỗi model chạy ít nhất 3 lần mỗi scenario
- [x] Audio test cùng chất lượng (16kHz, mono, WAV)
- [x] Tất cả engines expose cùng HTTP interface để fair comparison

---

## Implementation Steps

### 1. Setup các STT servers

- [x] **1.1** WhisperX server - đã có `whisperx_server.py` ✅
- [x] **1.2** Tạo `faster_whisper_v3_server.py` - Whisper large-v3-turbo
  ```python
  # Dùng faster-whisper library
  from faster_whisper import WhisperModel
  model = WhisperModel("large-v3-turbo", device="cuda", compute_type="int8")
  ```
- [x] **1.3** Tạo `moonshine_server.py` - Moonshine Voice
  ```python
  # Dùng moonshine package
  import moonshine
  model = moonshine.load("moonshine-base")
  ```
- [x] **1.4** Tạo `parakeet_server.py` - Parakeet-CTC Vietnamese
  ```python
  # Dùng NeMo toolkit
  import nemo.collections.asr as nemo_asr
  model = nemo_asr.models.ASRModel.from_pretrained("nvidia/parakeet-ctc-0.6b-vi")
  ```
- [x] **1.5** Tất cả servers expose cùng interface:
  ```
  POST /inference
    Body: multipart/form-data { file: audio.wav, language: "vi" }
    Response: { text: string, segments: [{start, end, text, speaker?}], meta: {process_time} }
  ```

### 2. Tạo metrics

- [x] **2.1** Tạo `benchmarks/metrics/wer.ts`
  - Word Error Rate (Levenshtein distance at word level)
  - Normalize: lowercase, remove punctuation, handle Vietnamese Unicode
  ```typescript
  export function calculateWER(reference: string, hypothesis: string): number
  ```

- [x] **2.2** Tạo `benchmarks/metrics/medical-term-accuracy.ts`
  - Riêng cho thuật ngữ y khoa
  - Input: list of expected medical terms, transcript output
  - Output: % terms recognized correctly
  ```typescript
  export function calculateMedicalTermAccuracy(
    expectedTerms: string[],  // ["amoxicillin", "viêm họng", "ICD-10"]
    transcript: string
  ): { found: string[], missed: string[], accuracy: number }
  ```

- [x] **2.3** Tạo `benchmarks/metrics/diarization.ts`
  - Chỉ applicable cho WhisperX
  - Các engine khác: gán N/A

- [x] **2.4** Tạo `benchmarks/metrics/rtf.ts`
  - Real-Time Factor = processing_time / audio_duration
  - RTF < 1.0 = real-time capable
  ```typescript
  export function calculateRTF(processingTimeMs: number, audioDurationS: number): number
  ```

### 3. Tạo STT benchmark runner

- [ ] **3.1** Tạo `benchmarks/tasks/stt-benchmark.ts`
  ```typescript
  /**
   * STT Multi-Engine Benchmark Runner
   * 
   * Usage:
   *   npx ts-node benchmarks/tasks/stt-benchmark.ts --engine=whisperx --model=small
   *   npx ts-node benchmarks/tasks/stt-benchmark.ts --engine=all
   * 
   * Quy trình per engine/model:
   * 1. Check server availability (health endpoint)
   * 2. Send each test audio 3 times
   * 3. Measure: WER, RTF, medical_term_accuracy, VRAM
   * 4. Save results to reports/
   */
  ```

### 4. Benchmark execution matrix

- [ ] **4.1** Run matrix:
  ```
  ┌─────────────────────────┬──────────┬──────────┬──────────┐
  │ Engine / Model          │ Scen. 01 │ Scen. 02 │ Scen. 03 │
  │                         │ (Easy)   │ (Medium) │ (Hard)   │
  ├─────────────────────────┼──────────┼──────────┼──────────┤
  │ WhisperX tiny           │ 3 runs   │ 3 runs   │ 3 runs   │
  │ WhisperX base           │ 3 runs   │ 3 runs   │ 3 runs   │
  │ WhisperX small ⭐       │ 3 runs   │ 3 runs   │ 3 runs   │
  │ WhisperX medium         │ 3 runs   │ 3 runs   │ 3 runs   │
  │ Whisper large-v3-turbo  │ 3 runs   │ 3 runs   │ 3 runs   │
  │ Whisper large-v3 (API)  │ 3 runs   │ 3 runs   │ 3 runs   │
  │ Moonshine tiny          │ 3 runs   │ 3 runs   │ 3 runs   │
  │ Moonshine base          │ 3 runs   │ 3 runs   │ 3 runs   │
  │ Parakeet-CTC-0.6B-Vi ⭐ │ 3 runs   │ 3 runs   │ 3 runs   │
  └─────────────────────────┴──────────┴──────────┴──────────┘
  Total: 9 models × 3 scenarios × 3 runs = 81 individual runs
  ```

### 5. So sánh kết quả

- [ ] **5.1** Tạo comparison report:
  ```
  ┌─────────────────────────┬─────────┬──────┬──────┬──────────┬────────────┬───────────┐
  │ Engine / Model          │ WER (%) │ RTF  │ VRAM │ Med.Term │ Diarize    │ Punctuation│
  │                         │         │      │ (GB) │ Acc (%)  │            │            │
  ├─────────────────────────┼─────────┼──────┼──────┼──────────┼────────────┼───────────┤
  │ WhisperX tiny           │ ???     │ ???  │ ???  │ ???      │ ✅ Yes     │ ❌ No      │
  │ WhisperX base           │ ???     │ ???  │ ???  │ ???      │ ✅ Yes     │ ❌ No      │
  │ WhisperX small ⭐       │ ???     │ ???  │ ???  │ ???      │ ✅ Yes     │ ❌ No      │
  │ WhisperX medium         │ ???     │ ???  │ ???  │ ???      │ ✅ Yes     │ ❌ No      │
  │ Whisper large-v3-turbo  │ ???     │ ???  │ ???  │ ???      │ ❌ No      │ ❌ No      │
  │ Whisper large-v3 (API)  │ ???     │ ???  │ N/A  │ ???      │ ❌ No      │ ❌ No      │
  │ Moonshine tiny          │ ???     │ ???  │ ???  │ ???      │ ❌ No      │ ❌ No      │
  │ Moonshine base          │ ???     │ ???  │ ???  │ ???      │ ❌ No      │ ❌ No      │
  │ Parakeet-CTC-0.6B-Vi ⭐ │ ???     │ ???  │ ???  │ ???      │ ❌ No      │ ✅ Yes     │
  └─────────────────────────┴─────────┴──────┴──────┴──────────┴────────────┴───────────┘
  ```

---

## 🧩 Feature Comparison Matrix (Pre-Benchmark)

| Feature | WhisperX | Whisper-v3 | Moonshine | Parakeet-Vi |
|---------|----------|------------|-----------|-------------|
| Speaker Diarization | ✅ Built-in | ❌ | ❌ | ❌ |
| Word Alignment | ✅ Built-in | ❌ | ❌ | ✅ Timestamps |
| Auto Punctuation | ❌ | ❌ | ❌ | ✅ Built-in |
| Vietnamese-specialized | ❌ General | ❌ General | ❌ General | ✅ **Chuyên biệt** |
| Code-switching (Vi-En) | ❌ | ❌ | ❌ | ✅ |
| Real-time capable | ❌ Batch only | ❌ | ✅ Streaming | ❌ Batch |
| VRAM < 2GB | tiny/base | ❌ | ✅ All | ✅ |
| Already integrated | ✅ | ❌ | ❌ | ❌ |
| Ease of setup | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★☆☆ |

---

## 🔄 Hybrid Strategy (Dự kiến)

Sau benchmark, có thể kết hợp nhiều engines:

```
Strategy A: "Parakeet + WhisperX Diarize"
  1. Parakeet-CTC → Transcription (best Vietnamese accuracy + punctuation)
  2. WhisperX → Diarization only (phân biệt speakers)
  3. Merge: Parakeet text + WhisperX speaker labels

Strategy B: "WhisperX All-in-One"  
  1. WhisperX small/medium → Everything (transcribe + align + diarize)
  2. Simple, single pipeline

Strategy C: "Speed First (Moonshine + LLM)"
  1. Moonshine base → Quick transcription
  2. Ollama LLM → Role detection (hiện tại đã có)
  3. Fastest pipeline, acceptable accuracy
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `benchmarks/tasks/stt-benchmark.ts` | Multi-engine STT benchmark runner |
| `benchmarks/metrics/wer.ts` | Word Error Rate calculator |
| `benchmarks/metrics/medical-term-accuracy.ts` | Medical terminology accuracy |
| `benchmarks/metrics/diarization.ts` | Diarization Error Rate calculator |
| `benchmarks/metrics/rtf.ts` | Real-Time Factor calculator |
| `benchmarks/servers/faster_whisper_v3_server.py` | Whisper large-v3 server |
| `benchmarks/servers/moonshine_server.py` | Moonshine Voice server |
| `benchmarks/servers/parakeet_server.py` | Parakeet-CTC Vietnamese server |

---

## Test Criteria

- [ ] WER calculator: `calculateWER("xin chào", "sin chào")` ≈ 0.5
- [ ] Medical term accuracy: `["amoxicillin"]` in `"bệnh nhân uống amoxicillin 500mg"` = 100%
- [ ] Tất cả 4 engines chạy được với cùng audio input
- [ ] Benchmark report có đủ data cho 9 model variants
- [ ] Mỗi variant chạy 3 lần, có mean ± std cho mỗi metric

---

## Expected Outcomes & Hypotheses

| Engine | Hypothesis | Lý do |
|--------|-----------|-------|
| **WhisperX small** | Balanced winner | Đã thử nghiệm, diarization built-in |
| **Parakeet-CTC-Vi** | 🏆 **Best WER for Vietnamese** | Chuyên biệt Vi, train 4000h Vi, WER 6-11% |
| **Whisper large-v3** | Best overall accuracy | Largest model, most training data |
| **Moonshine** | Fastest | 5x speed vs Whisper, edge-optimized |

> ⚠️ **Key question**: Parakeet-CTC-Vi có **tốt hơn đáng kể** so với WhisperX small cho thuật ngữ y khoa tiếng Việt không?  
> Nếu CÓ → hybrid strategy (Parakeet + WhisperX diarize) có thể là optimal.

---

## Setup Requirements

### Dependencies cần cài:
```powershell
# Engine A: WhisperX (đã có)
conda activate whisperx

# Engine B: Whisper large-v3
pip install faster-whisper  # Trong cùng env hoặc env mới

# Engine C: Moonshine
pip install moonshine  # Hoặc: pip install useful-moonshine

# Engine D: Parakeet-CTC
pip install nemo_toolkit[asr]  # Heavy (~2GB+)
# Hoặc dùng Docker: nvcr.io/nvidia/nemo:24.xx
```

---

**Next Phase**: [Phase 04 - LLM Task Benchmarking](./phase-04-llm-benchmarking.md)
