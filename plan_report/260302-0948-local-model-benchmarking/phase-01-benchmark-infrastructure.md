# Phase 01: Benchmark Infrastructure

**Status**: ✅ Complete  
**Dependencies**: None  
**Estimated Time**: 4-6 hours

---

## Objective

Xây dựng hạ tầng benchmark:
- CLI script có thể chạy lại bất kỳ lúc nào
- Đo lường tự động: latency, token count, accuracy
- Export kết quả ra file JSON/CSV
- Switch model qua biến môi trường

---

## Requirements

### Functional
- [x] Script TypeScript chạy được bằng `npx ts-node`
- [x] Đo latency (ms) cho mỗi LLM call
- [ ] Đo latency (ms) cho STT processing (Phase 03)
- [x] Ghi lại token usage (prompt_tokens, completion_tokens)
- [ ] Ghi lại VRAM usage trước/sau mỗi model load (Phase 03/04)
- [x] Export kết quả ra `reports/` dưới dạng JSON

### Non-Functional
- [x] Idempotent: chạy lại N lần cho kết quả ổn định
- [x] Không ảnh hưởng production code (standalone scripts)

---

## Implementation Steps

### 1. Tạo benchmark utilities

- [x] **1.1** Tạo `benchmarks/` folder trong `medical-examination-assistant-be-kit/`
- [x] **1.2** Tạo `benchmarks/utils/timer.ts` - Utility class đo thời gian
  ```typescript
  export class BenchmarkTimer {
    private start: number;
    begin() { this.start = performance.now(); }
    end(): number { return Math.round(performance.now() - this.start); }
  }
  ```
- [x] **1.3** Tạo `benchmarks/utils/ollama-client.ts` - Wrapper gọi Ollama với metrics
  ```typescript
  export async function benchmarkOllamaCall(options: {
    model: string;
    messages: Message[];
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<{
    content: string;
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    model: string;
  }>
  ```
- [x] **1.4** Tạo `benchmarks/utils/reporter.ts` - Ghi kết quả ra JSON file
  ```typescript
  export function saveReport(name: string, data: BenchmarkResult[]): void
  // → plans/260302-0948-local-model-benchmarking/reports/[name]-[timestamp].json
  ```

### 2. Tạo model registry

- [x] **2.1** Tạo `benchmarks/config/models.ts` - Danh sách tất cả models cần test
  ```typescript
  export const LLM_CANDIDATES = [
    { name: 'gemma2:2b', category: 'light', vram: '1.5GB' },
    { name: 'qwen3:1.7b', category: 'light', vram: '1.2GB' },
    { name: 'qwen3:4b', category: 'standard', vram: '2.5GB' },
    { name: 'gemma3:4b', category: 'standard', vram: '2.5GB' },
    { name: 'phi3:3.8b', category: 'standard', vram: '2.3GB' },
    { name: 'phi4-mini:3.8b', category: 'standard', vram: '2.3GB' },
    { name: 'llama3.2:3b', category: 'standard', vram: '2GB' },
    { name: 'llama3.2:1b', category: 'light', vram: '0.8GB' },
    // { name: 'mistral:7b', category: 'expert', vram: '4GB' },  // optional if VRAM allows
  ];

  export const STT_CANDIDATES = ['tiny', 'base', 'small', 'medium'];
  
  export const EMBEDDING_CANDIDATES = [
    'nomic-embed-text-v2-moe',
    'mxbai-embed-large',
    'all-minilm',
    'snowflake-arctic-embed',
  ];
  ```

### 3. Tạo model pull helper

- [x] **3.1** Tạo `benchmarks/scripts/pull-models.ps1` - Script tải tất cả models
  ```powershell
  # Pull all candidate models
  $models = @("gemma2:2b", "qwen3:1.7b", "qwen3:4b", "gemma3:4b", ...)
  foreach ($m in $models) {
    Write-Host "Pulling $m..."
    ollama pull $m
  }
  ```

### 4. Tạo benchmark runner

- [x] **4.1** Tạo `benchmarks/run-benchmark.ts` - Main entry point
  ```typescript
  // Usage: npx ts-node benchmarks/run-benchmark.ts --task=stt --models=all
  // Usage: npx ts-node benchmarks/run-benchmark.ts --task=role-detection --model=qwen3:4b
  // Usage: npx ts-node benchmarks/run-benchmark.ts --task=all --models=all --runs=3
  ```

---

## Files to Create

| File | Purpose |
|------|---------|
| `benchmarks/utils/timer.ts` | Performance timer utility |
| `benchmarks/utils/ollama-client.ts` | Ollama API wrapper with metrics |
| `benchmarks/utils/reporter.ts` | JSON/CSV report generator |
| `benchmarks/config/models.ts` | Model registry (all candidates) |
| `benchmarks/config/tasks.ts` | Task definitions (prompts, ground truth paths) |
| `benchmarks/types/index.ts` | TypeScript types for benchmark results |
| `benchmarks/run-benchmark.ts` | CLI entry point |
| `benchmarks/scripts/pull-models.ps1` | Model download script |
| `benchmarks/tsconfig.json` | TypeScript config for benchmarks |

---

## Test Criteria

- [x] `npx ts-node benchmarks/run-benchmark.ts --help` hiển thị usage ✅
- [x] Benchmark 1 model, 1 task chạy thành công ✅ (gemma2:2b × Role Detection = 512ms)
- [x] Report JSON được tạo trong `reports/` ✅
- [x] Latency và token count chính xác ✅ (239 prompt + 22 completion tokens)

---

## Notes

- Benchmarks chạy **standalone**, không dùng NestJS modules
- Import trực tiếp `ollamaChat()` function, không cần DI
- Mỗi benchmark run tạo 1 report file riêng (không overwrite)
- Đặt tên report: `{task}-{model}-{timestamp}.json`

---

**Next Phase**: [Phase 02 - Test Data & Ground Truth](./phase-02-test-data.md)
