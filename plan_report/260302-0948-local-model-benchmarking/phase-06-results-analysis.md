# Phase 06: Results Analysis & Final Configuration

**Status**: ⬜ Pending  
**Dependencies**: Phase 03, 04, 05 (tất cả benchmark data)  
**Estimated Time**: 3-4 hours

---

## Objective

1. Tổng hợp toàn bộ benchmark results
2. Tạo **comparison dashboard** trực quan
3. Rút ra **kết luận cuối cùng**: model nào cho task nào
4. Update `.env` với optimal model config
5. Document findings cho tương lai

---

## Requirements

### Functional
- [ ] Tổng hợp tất cả reports từ Phase 03-05
- [ ] Tạo Score Matrix: model × task → composite score
- [ ] Xác định Top-1 model cho mỗi task
- [ ] Kiểm tra VRAM compatibility (tổng VRAM các model chọn ≤ 4GB)
- [ ] Update `.env` và `ollama.models.ts`

### Non-Functional
- [ ] Kết quả reproducible (có raw data)
- [ ] Document decisions (tại sao chọn model X thay vì Y)

---

## Implementation Steps

### 1. Tạo Analysis Script

- [ ] **1.1** Tạo `benchmarks/analysis/analyze-results.ts`
  ```typescript
  /**
   * Reads all report JSON files from reports/
   * Aggregates metrics by model × task
   * Generates:
   * - Composite score matrix
   * - Ranking per task
   * - VRAM compatibility check
   * - Recommendation summary
   */
  ```

### 2. Composite Scoring Formula

- [ ] **2.1** Định nghĩa scoring weights cho mỗi task:

  **Role Detection Score** = 
  ```
  accuracy × 0.50 + json_compliance × 0.20 + (1 - latency_normalized) × 0.15 + (1 - error_rate) × 0.15
  ```

  **Medical Fixer Score** =
  ```
  fix_accuracy × 0.50 + (1 - over_correction) × 0.25 + (1 - latency_normalized) × 0.25
  ```

  **SOAP Generation Score** =
  ```
  soap_similarity × 0.40 + json_compliance × 0.20 + completeness × 0.20 + (1 - latency_normalized) × 0.20
  ```

  **ICD-10 Score** =
  ```
  f1_score × 0.45 + exact_match × 0.20 + json_compliance × 0.20 + (1 - latency_normalized) × 0.15
  ```

  **Expert Advice Score** =
  ```
  relevance × 0.40 + vietnamese_compliance × 0.20 + structure × 0.15 + (1 - latency_normalized) × 0.25
  ```

### 3. VRAM Compatibility Check

- [ ] **3.1** Kiểm tra tổng VRAM khi chạy pipeline:
  ```
  Pipeline flow (sequential):
  1. WhisperX STT → unload
  2. LLM Role Detection → keep loaded
  3. LLM Medical Fixer → same model (no reload)
  4. LLM Scribe Agent → keep/reload
  5. LLM ICD Agent → parallel with Expert → cần cùng model hoặc unload/reload
  6. LLM Expert Agent → keep/reload
  
  Best case: Tất cả LLM tasks dùng CÙNG 1 model → load 1 lần
  Worst case: Mỗi task dùng model khác → cần unload/reload
  ```

- [ ] **3.2** VRAM budget:
  ```
  Total VRAM: 4GB
  Reserved for system: ~0.5GB
  Available for models: ~3.5GB
  
  Config A (Single model): 1 model ≤ 3.5GB → gemma2:2b, qwen3:4b, etc.
  Config B (Dual model): Model A + Model B ≤ 3.5GB → tiny model + medium model
  Config C (Sequential): Any model ≤ 3.5GB, unload between tasks
  ```

### 4. Tạo Decision Matrix

- [ ] **4.1** Generate final matrix:
  ```
  ┌──────────────────┬────────────┬───────────┬──────────┬──────────┐
  │ Task             │ Best Model │ Score     │ Latency  │ VRAM     │
  ├──────────────────┼────────────┼───────────┼──────────┼──────────┤
  │ Role Detection   │ ???        │ ???/100   │ ???ms    │ ???GB    │
  │ Medical Fixer    │ ???        │ ???/100   │ ???ms    │ ???GB    │
  │ Scribe (SOAP)    │ ???        │ ???/100   │ ???ms    │ ???GB    │
  │ ICD-10 Coding    │ ???        │ ???/100   │ ???ms    │ ???GB    │
  │ Expert Advice    │ ???        │ ???/100   │ ???ms    │ ???GB    │
  │ STT              │ ???        │ WER: ???  │ ???s     │ ???GB    │
  │ Embeddings       │ ???        │ MRR: ???  │ ???ms    │ ???GB    │
  └──────────────────┴────────────┴───────────┴──────────┴──────────┘
  ```

### 5. Proposed Configurations

- [ ] **5.1** Tạo 3 proposed configs dựa trên results:

  **Config A: "Speed First" (Everything Ultra-Fast)**
  ```env
  OLLAMA_MODEL_LIGHT=<fastest-acceptable-model>
  OLLAMA_MODEL_STANDARD=<fastest-acceptable-model>
  OLLAMA_MODEL_EXPERT=<fastest-acceptable-model>
  WHISPER_MODEL=base
  ```

  **Config B: "Balanced" (Best Quality/Speed Tradeoff)**
  ```env
  OLLAMA_MODEL_LIGHT=<best-balance-for-light-tasks>
  OLLAMA_MODEL_STANDARD=<best-balance-for-soap-icd>
  OLLAMA_MODEL_EXPERT=<best-for-expert>
  WHISPER_MODEL=small
  ```

  **Config C: "Quality First" (Best Accuracy)**
  ```env
  OLLAMA_MODEL_LIGHT=<highest-accuracy-model>
  OLLAMA_MODEL_STANDARD=<highest-accuracy-model>
  OLLAMA_MODEL_EXPERT=<highest-accuracy-model>
  WHISPER_MODEL=medium
  ```

### 6. Apply Final Configuration

- [ ] **6.1** Update BE `.env`:
  ```diff
  - OLLAMA_MODEL_LIGHT="gemma2:2b"
  - OLLAMA_MODEL_STANDARD="phi3:3.8b"
  - OLLAMA_MODEL_EXPERT="llama3.2"
  + OLLAMA_MODEL_LIGHT="<winner-light>"
  + OLLAMA_MODEL_STANDARD="<winner-standard>"
  + OLLAMA_MODEL_EXPERT="<winner-expert>"
  ```

- [ ] **6.2** Update `ollama.models.ts` default values to match

- [ ] **6.3** Update `whisperx_server.py` default model if changed

- [ ] **6.4** E2E test: chạy full pipeline với config mới

### 7. Documentation

- [ ] **7.1** Tạo `docs/MODEL-BENCHMARK-RESULTS.md`
  - Tổng hợp findings
  - Decision rationale
  - Future recommendations
  - How to re-run benchmarks

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `benchmarks/analysis/analyze-results.ts` | Create | Analysis & scoring script |
| `benchmarks/analysis/generate-report.ts` | Create | Report generator |
| `docs/MODEL-BENCHMARK-RESULTS.md` | Create | Final findings documentation |
| `.env` | Modify | Update model configuration |
| `src/agents/models/ollama.models.ts` | Modify | Update default models |

---

## Test Criteria

- [ ] Decision matrix has data for all task × model combinations
- [ ] VRAM compatibility verified (pipeline runs without OOM)
- [ ] E2E test passes with new config
- [ ] Documentation complete and clear
- [ ] Old config backed up (git commit before changes)

---

## Expected Outcome Hypotheses

Dựa trên kinh nghiệm với các models tương tự:

| Task | Likely Winner | Reasoning |
|------|--------------|-----------|
| Role Detection | `qwen3:4b` hoặc `gemma3:4b` | Cần hiểu context tiếng Việt + JSON output |
| Medical Fixer | `qwen3:1.7b` hoặc `gemma2:2b` | Task đơn giản, ưu tiên speed |
| Scribe (SOAP) | `qwen3:4b` | Cần quality + JSON + Vietnamese |
| ICD-10 | `qwen3:4b` | Cần kiến thức y khoa chuyên sâu |
| Expert Advice | `qwen3:4b` hoặc `gemma3:4b` | Cần reasoning + Vietnamese output |
| STT | `small` | Best tradeoff cho Vietnamese |
| Embeddings | `nomic-embed-text-v2-moe` | Multilingual, good quality |

> ⚠️ Đây chỉ là **dự đoán**. Benchmark results sẽ cho câu trả lời chính xác!

---

**End of Plan**
