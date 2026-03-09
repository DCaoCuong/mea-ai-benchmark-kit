# Phase 05: Embedding Model Benchmarking

**Status**: ⬜ Pending  
**Dependencies**: Phase 01, Phase 02  
**Estimated Time**: 2-3 hours

---

## Objective

Benchmark các embedding models để tìm model tốt nhất cho:
1. **RAG retrieval**: Tìm documents y khoa liên quan nhất
2. **Comparison scoring**: Cosine similarity giữa AI SOAP vs Doctor SOAP

---

## Requirements

### Functional
- [ ] Benchmark 4 embedding models
- [ ] Đo: embedding speed, retrieval quality, similarity accuracy
- [ ] Test cả bilingal (Việt + thuật ngữ Latin y khoa)

### Non-Functional
- [ ] Mỗi model test ít nhất 10 query pairs
- [ ] VRAM usage tracking

---

## Implementation Steps

### 1. Tạo embedding benchmark script

- [ ] **1.1** Tạo `benchmarks/tasks/embedding-benchmark.ts`
  ```typescript
  /**
   * Tests:
   * 1. Embedding speed (ms per text)
   * 2. Retrieval quality (relevant docs ranked higher?)
   * 3. Similarity accuracy (similar pairs → high score, different → low?)
   */
  ```

### 2. Tạo test pairs cho similarity

- [ ] **2.1** Tạo `benchmarks/test-data/embedding-pairs.json`
  ```json
  {
    "similarPairs": [
      { "a": "đau đầu", "b": "nhức đầu", "expectedSimilarity": "high" },
      { "a": "viêm họng cấp", "b": "viêm amidan", "expectedSimilarity": "high" },
      { "a": "tăng huyết áp", "b": "hypertension", "expectedSimilarity": "high" },
      { "a": "đau bụng thượng vị", "b": "epigastric pain", "expectedSimilarity": "high" }
    ],
    "differentPairs": [
      { "a": "đau đầu", "b": "gãy xương", "expectedSimilarity": "low" },
      { "a": "viêm họng", "b": "đái tháo đường", "expectedSimilarity": "low" }
    ]
  }
  ```

### 3. RAG retrieval benchmark

- [ ] **3.1** Với mỗi embedding model:
  1. Index knowledge base documents
  2. Query với test questions
  3. Đo retrieval relevance (relevant docs in top-3?)
  ```typescript
  const queries = [
    { query: "bệnh nhân bị viêm họng cần uống thuốc gì", relevantDoc: "pharyngitis.md" },
    { query: "phác đồ điều trị tăng huyết áp", relevantDoc: "hypertension.md" },
  ];
  ```

### 4. Scoring

- [ ] **4.1** Metrics:
  | Metric | Mô tả |
  |--------|-------|
  | `embed_speed_ms` | Thời gian embed 1 text (ms) |
  | `similar_pair_score` | Cosine similarity cho similar pairs (expected > 0.7) |
  | `different_pair_score` | Cosine similarity cho different pairs (expected < 0.4) |
  | `separation_ratio` | similar_score / different_score (higher = better) |
  | `retrieval_mrr` | Mean Reciprocal Rank cho relevant docs |
  | `vram_usage_mb` | VRAM khi embedding |

---

## Models to Test

| Model | Dimensions | Size | Expected Speed |
|-------|-----------|------|----------------|
| `nomic-embed-text-v2-moe` | 768 | ~280MB | Trung bình |
| `mxbai-embed-large` | 1024 | ~670MB | Chậm hơn |
| `all-minilm` | 384 | ~110MB | Nhanh nhất |
| `snowflake-arctic-embed` | 1024 | ~670MB | Chậm hơn |

---

## Files to Create

| File | Purpose |
|------|---------|
| `benchmarks/tasks/embedding-benchmark.ts` | Embedding model benchmark runner |
| `benchmarks/test-data/embedding-pairs.json` | Test pairs for similarity |
| `benchmarks/metrics/retrieval.ts` | MRR and retrieval metrics |

---

## Test Criteria

- [ ] Similar pairs: similarity > 0.6 cho model tốt
- [ ] Different pairs: similarity < 0.4
- [ ] RAG retrieval: relevant doc in top-3 cho > 80% queries
- [ ] Report có comparison table across 4 models

---

**Next Phase**: [Phase 06 - Results Analysis & Final Config](./phase-06-results-analysis.md)
