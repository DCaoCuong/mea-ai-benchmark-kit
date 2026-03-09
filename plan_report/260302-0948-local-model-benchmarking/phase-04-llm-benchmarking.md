# Phase 04: LLM Task Benchmarking (Core Phase)

**Status**: ⬜ Pending  
**Dependencies**: Phase 01, Phase 02  
**Estimated Time**: 8-12 hours (nhiều nhất vì nhiều model × nhiều task)

---

## Objective

Đây là **phase quan trọng nhất**: benchmark từng LLM model cho từng task cụ thể trong pipeline MEA.

**5 tasks cần benchmark** × **6-8 models** = **30-40 benchmark runs** (mỗi run × 3 scenarios × 3 lần)

---

## The 5 LLM Tasks

| # | Task | Current Model | Input | Output | Key Metric |
|---|------|---------------|-------|--------|------------|
| 1 | **Role Detection** | gemma2:2b | Segments text | JSON: roles[] | Accuracy (%) |
| 2 | **Medical Text Fixer** | gemma2:2b | Noisy medical text | Clean text | Fix Accuracy (%) |
| 3 | **Scribe Agent (SOAP)** | gemma2:2b | Full transcript | JSON: SOAP | Semantic Similarity |
| 4 | **ICD-10 Agent** | gemma2:2b | Assessment + Symptoms | JSON: codes[] | Code Match (%) |
| 5 | **Expert Agent (RAG)** | llama3.2 | SOAP + Context | Advice text | Quality Score |

---

## Requirements

### Functional
- [ ] Benchmark script cho từng task riêng biệt
- [ ] Có thể chạy 1 task × 1 model, hoặc all × all
- [ ] Đo: latency (ms), token usage, accuracy/similarity
- [ ] JSON mode compliance (model có trả JSON đúng không?)
- [ ] Error rate (bao nhiêu lần model trả output hỏng?)

### Non-Functional
- [ ] Mỗi model test ít nhất 3 scenarios × 3 runs = 9 data points
- [ ] Sequential execution (tránh VRAM conflict)
- [ ] Warm-up run (bỏ lần chạy đầu do model loading)

---

## Implementation Steps

### Task 1: Role Detection Benchmark

- [ ] **1.1** Tạo `benchmarks/tasks/role-detection.ts`
  ```typescript
  /**
   * Input: Array of segments [{ text: "...", index: 0 }, ...]
   * Expected: { roles: ["Bác sĩ", "Bệnh nhân", ...] }
   * 
   * Metrics:
   * - role_accuracy: % segments gán đúng role vs ground truth
   * - json_compliance: model có trả JSON hợp lệ không (boolean)
   * - latency_ms: thời gian xử lý
   * 
   * Prompt: Giống hệt stt.service.ts detectSpeakerRoleByContent()
   * Dùng /no_think prefix cho qwen3
   */
  ```

- [ ] **1.2** Scoring function:
  ```typescript
  function scoreRoleDetection(
    predicted: string[],  // ["Bác sĩ", "Bệnh nhân", ...]
    groundTruth: string[] // ["Bác sĩ", "Bệnh nhân", ...]
  ): number {
    // Return % correct (0-100)
    const correct = predicted.filter((p, i) => p === groundTruth[i]).length;
    return (correct / groundTruth.length) * 100;
  }
  ```

### Task 2: Medical Text Fixer Benchmark

- [ ] **2.1** Tạo `benchmarks/tasks/medical-fixer.ts`
  ```typescript
  /**
   * Input: Noisy medical text (typos, wrong terms)
   * Expected: Corrected text
   * 
   * Metrics:
   * - fix_accuracy: % cases sửa đúng vs ground truth
   * - over_correction: % cases model sửa quá mức (thêm nội dung mới)
   * - latency_ms: thời gian xử lý per segment
   * 
   * Prompt: Giống hệt stt.service.ts fixMedicalText()
   */
  ```

- [ ] **2.2** Scoring function:
  ```typescript
  function scoreMedicalFixer(
    input: string,
    predicted: string,
    expected: string
  ): {
    exactMatch: boolean;    // Khớp 100% ground truth
    improved: boolean;      // Tốt hơn input (edit distance giảm)
    overCorrected: boolean; // Thêm nội dung mới không cần thiết
  }
  ```

### Task 3: Scribe Agent (SOAP) Benchmark

- [ ] **3.1** Tạo `benchmarks/tasks/soap-generation.ts`
  ```typescript
  /**
   * Input: Full transcript text
   * Expected: SOAP JSON { subjective, objective, assessment, plan }
   * 
   * Metrics:
   * - soap_similarity: Semantic similarity (embedding cosine) cho mỗi S,O,A,P
   * - json_compliance: JSON output hợp lệ?
   * - completeness: Có đủ 4 fields S,O,A,P? Mỗi field có nội dung?
   * - latency_ms
   * - token_count: prompt + completion tokens
   * 
   * Prompt: Giống hệt agent-nodes.service.ts scribeNode()
   */
  ```

- [ ] **3.2** Scoring function:
  ```typescript
  async function scoreSoapGeneration(
    predicted: SoapNote,
    groundTruth: SoapNote,
    embeddings: OllamaEmbeddings
  ): Promise<{
    subjectiveSimilarity: number; // 0-100
    objectiveSimilarity: number;
    assessmentSimilarity: number;
    planSimilarity: number;
    overallSimilarity: number;   // Weighted average
    completeness: number;         // % fields non-empty
  }>
  ```

### Task 4: ICD-10 Agent Benchmark

- [ ] **4.1** Tạo `benchmarks/tasks/icd-coding.ts`
  ```typescript
  /**
   * Input: Assessment + Subjective from SOAP
   * Expected: Array of ICD-10 codes
   * 
   * Metrics:
   * - exact_match: Có chứa đúng ICD code cần thiết?
   * - category_match: Code cùng nhóm (K29 vs K29.7)?
   * - precision: Bao nhiêu code AI đề xuất là đúng?
   * - recall: Bao nhiêu code ground truth được AI tìm thấy?
   * - hallucination_rate: Bao nhiêu code AI đề xuất không liên quan?
   * - json_compliance
   * - latency_ms
   */
  ```

- [ ] **4.2** Scoring function:
  ```typescript
  function scoreIcdCoding(
    predicted: string[],  // ["K29.7 - Viêm dạ dày", ...]
    groundTruth: string[] // ["K29.7", ...]
  ): {
    exactMatch: number;     // % codes khớp chính xác
    categoryMatch: number;  // % codes cùng nhóm (3 ký tự đầu)
    precision: number;      // correct / total_predicted
    recall: number;         // correct / total_expected
    f1Score: number;        // harmonic mean of precision & recall
  }
  ```

### Task 5: Expert Agent (RAG) Benchmark

- [ ] **5.1** Tạo `benchmarks/tasks/expert-advice.ts`
  ```typescript
  /**
   * Input: SOAP note + RAG context (knowledge base)
   * Expected: Medical advice text (Vietnamese)
   * 
   * Metrics:
   * - relevance_score: Advice có liên quan đến bệnh không? (semantic similarity)
   * - language_compliance: Có viết bằng tiếng Việt 100% không?
   * - reference_usage: Có trích dẫn từ knowledge base không?
   * - latency_ms
   * - token_count
   * 
   * ĐẶC BIỆT: Task này cần RAG context → phải init VectorStore trước
   */
  ```

- [ ] **5.2** Simplified scoring (không có bác sĩ review):
  ```typescript
  async function scoreExpertAdvice(
    predicted: string,
    groundTruth: string,
    embeddings: OllamaEmbeddings
  ): Promise<{
    relevanceSimilarity: number;  // 0-100
    isVietnamese: boolean;        // Regex check
    wordCount: number;            // Độ dài response
    hasStructure: boolean;        // Có heading/bullet points
  }>
  ```

### 6. Main LLM Benchmark Orchestrator

- [ ] **6.1** Tạo `benchmarks/tasks/llm-benchmark-all.ts`
  ```typescript
  /**
   * Orchestrates all LLM benchmarks:
   * 
   * For each model in LLM_CANDIDATES:
   *   For each task in [role-detection, medical-fixer, soap, icd, expert]:
   *     For each scenario in test-data:
   *       Run 3 times
   *       Record metrics
   *   
   *   Generate per-model report
   * 
   * Generate comparison report across all models
   */
  ```

### 7. JSON Compliance Checker

- [ ] **7.1** Tạo `benchmarks/metrics/json-compliance.ts`
  - Đặc biệt quan trọng: nhiều small models trả JSON không hợp lệ
  - Kiểm tra:
    - Parse được JSON?
    - Có đúng schema expected?
    - Có markdown code blocks bọc ngoài? (cần extract)
    - Có text thừa ngoài JSON?

---

## Benchmark Matrix

```
                  gemma2  qwen3   qwen3  gemma3  phi3   phi4    llama   llama
                  :2b     :1.7b   :4b    :4b     :3.8b  -mini   3.2:3b  3.2:1b
                  ─────── ─────── ────── ─────── ────── ─────── ────── ──────
Role Detection    [ ]     [ ]     [ ]    [ ]     [ ]    [ ]     [ ]    [ ]
Medical Fixer     [ ]     [ ]     [ ]    [ ]     [ ]    [ ]     [ ]    [ ]
SOAP Generation   [ ]     [ ]     [ ]    [ ]     [ ]    [ ]     [ ]    [ ]
ICD-10 Coding     [ ]     [ ]     [ ]    [ ]     [ ]    [ ]     [ ]    [ ]
Expert Advice     [ ]     [ ]     [ ]    [ ]     [ ]    [ ]     [ ]    [ ]
```

**Total: 40 benchmark configurations** × 3 scenarios × 3 runs = **360 individual runs**

> 💡 **Ước tính thời gian**: ~2-5 seconds per LLM call → ~30-90 phút tổng thời gian benchmark

---

## Files to Create

| File | Purpose |
|------|---------|
| `benchmarks/tasks/role-detection.ts` | Role detection benchmark |
| `benchmarks/tasks/medical-fixer.ts` | Medical text fixer benchmark |
| `benchmarks/tasks/soap-generation.ts` | SOAP note generation benchmark |
| `benchmarks/tasks/icd-coding.ts` | ICD-10 coding benchmark |
| `benchmarks/tasks/expert-advice.ts` | Expert medical advice benchmark |
| `benchmarks/tasks/llm-benchmark-all.ts` | Orchestrator cho tất cả tasks |
| `benchmarks/metrics/json-compliance.ts` | JSON output validation |
| `benchmarks/metrics/text-similarity.ts` | Semantic similarity (embedding-based) |

---

## Test Criteria

- [ ] Mỗi task benchmark chạy ít nhất 1 model × 1 scenario thành công
- [ ] JSON compliance checker bắt được invalid JSON
- [ ] Similarity scorer trả giá trị 0-100 hợp lý
- [ ] Report có đủ metrics cho mỗi model × task combination
- [ ] Model comparison table tự động generate

---

## Notes

- **Warp-up**: Bỏ qua lần chạy đầu tiên khi load model mới (latency sẽ rất cao do loading)
- **Sequential**: Chạy từng model 1, không song song (VRAM constraint)
- **Ollama keep-alive**: Sau khi test 1 model, cần unload trước khi load model mới
  ```bash
  ollama stop <model-name>  # hoặc wait for auto-unload
  ```
- **Qwen3 đặc biệt**: Cần `/no_think` prefix để tắt thinking mode, nếu không latency sẽ x2-x3
- **Some models cần format hint**: Một số model nhỏ không hiểu "return JSON" → cần few-shot example

---

**Next Phase**: [Phase 05 - Embedding Model Benchmarking](./phase-05-embedding-benchmarking.md)
