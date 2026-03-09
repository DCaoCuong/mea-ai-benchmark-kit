# Medical Examination AI Accuracy Evaluation Module

## Goal

Xây dựng một **standalone CLI evaluation kit** để đánh giá độ chính xác của AI pipeline (Audio → STT → AI Analysis) với khả năng:
- Chạy N lượt thử nghiệm với cùng 1 kịch bản (đánh giá tính nhất quán)
- So sánh kết quả AI gợi ý vs Ground Truth
- Switch giữa các AI models để benchmark
- Export kết quả ra CSV

---

## Project Type

**BACKEND** - Standalone evaluation toolkit (CLI-based)

---

## Success Criteria

- [ ] CLI có thể chạy: `npx ts-node cli.ts --scenario="./scenarios/test1.json" --runs=5 --model="groq/gpt-oss-120b"`
- [ ] Kết quả CSV được tạo với đầy đủ metrics
- [ ] Có thể switch model qua CLI arguments
- [ ] Consistency score được tính qua N runs

---

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js + TypeScript | Tái sử dụng code từ BE/FE kits |
| CLI | Commander.js | Lightweight, widely used |
| AI APIs | Groq SDK, OpenAI SDK, Google GenAI | Multi-provider support |
| CSV Export | csv-writer | Simple, no dependencies |
| Metrics | Custom (WER, Semantic Similarity, ICD Accuracy) | Medical domain-specific |

---

## File Structure

```
medical-examination-evaluation-kit/
├── package.json
├── tsconfig.json
├── .env.example                    # API keys template
├── cli.ts                          # CLI entry point
├── src/
│   ├── config/
│   │   ├── models.ts               # Model configurations (Groq, OpenAI, Gemini)
│   │   └── environment.ts          # Environment loader
│   ├── types/
│   │   ├── scenario.ts             # Scenario + Ground Truth types
│   │   ├── evaluation.ts           # Evaluation result types
│   │   └── metrics.ts              # Metrics types
│   ├── runners/
│   │   ├── stt-runner.ts           # STT evaluation (Whisper models)
│   │   ├── analysis-runner.ts      # Full AI analysis (SOAP, ICD, Expert)
│   │   └── batch-runner.ts         # Run N iterations
│   ├── metrics/
│   │   ├── wer.ts                  # Word Error Rate calculator
│   │   ├── semantic-similarity.ts  # Cosine similarity for text
│   │   ├── icd-accuracy.ts         # ICD-10 code matching
│   │   └── consistency.ts          # Cross-run consistency score
│   ├── export/
│   │   └── csv-exporter.ts         # Export results to CSV
│   └── utils/
│       └── logger.ts               # Console logging with colors
├── scenarios/                      # Test scenarios
│   ├── example-scenario.json       # Example format
│   └── README.md                   # Format documentation
└── results/                        # Output directory (gitignored)
    └── .gitkeep
```

---

## Task Breakdown

### Phase 1: Project Setup

- [ ] **Task 1.1**: Khởi tạo project với `package.json` và dependencies
  - Agent: `backend-specialist`
  - INPUT: None
  - OUTPUT: `package.json` với commander, groq-sdk, openai, @google/generative-ai, csv-writer
  - VERIFY: `npm install` hoàn thành không lỗi

- [ ] **Task 1.2**: Tạo `tsconfig.json` và cấu trúc thư mục
  - Agent: `backend-specialist`
  - INPUT: File structure từ plan
  - OUTPUT: Tất cả folders và files trống
  - VERIFY: `npx tsc --noEmit` không lỗi

- [ ] **Task 1.3**: Tạo `.env.example` với template cho API keys
  - Agent: `backend-specialist`
  - INPUT: Danh sách providers (Groq, OpenAI, Google)
  - OUTPUT: `.env.example` file
  - VERIFY: File tồn tại với đầy đủ keys

---

### Phase 2: Core Types & Configuration

- [ ] **Task 2.1**: Định nghĩa types cho Scenario và Ground Truth
  - Agent: `backend-specialist`
  - INPUT: Cấu trúc dữ liệu mong muốn
  - OUTPUT: `src/types/scenario.ts`
  - VERIFY: TypeScript compile thành công

- [ ] **Task 2.2**: Định nghĩa types cho Evaluation Results
  - Agent: `backend-specialist`
  - INPUT: Metrics cần track (WER, similarity, ICD accuracy, timing)
  - OUTPUT: `src/types/evaluation.ts`, `src/types/metrics.ts`
  - VERIFY: TypeScript compile thành công

- [ ] **Task 2.3**: Tạo Model Configuration với multi-provider support
  - Agent: `backend-specialist`
  - INPUT: Groq models, OpenAI models, Gemini models
  - OUTPUT: `src/config/models.ts`
  - VERIFY: Export danh sách models đúng format

---

### Phase 3: Metrics Implementation

- [ ] **Task 3.1**: Implement Word Error Rate (WER) calculator
  - Agent: `backend-specialist`
  - INPUT: Reference text, hypothesis text
  - OUTPUT: `src/metrics/wer.ts`
  - VERIFY: Unit test với known values (vd: WER("hello world", "hello worlds") = 0.5)

- [ ] **Task 3.2**: Implement Semantic Similarity calculator
  - Agent: `backend-specialist`
  - INPUT: Text A, Text B
  - OUTPUT: `src/metrics/semantic-similarity.ts`
  - VERIFY: Similarity("đau đầu", "nhức đầu") > 0.8

- [ ] **Task 3.3**: Implement ICD-10 Accuracy calculator
  - Agent: `backend-specialist`
  - INPUT: Predicted codes[], Ground truth codes[]
  - OUTPUT: `src/metrics/icd-accuracy.ts`
  - VERIFY: Exact match + partial match scoring works

- [ ] **Task 3.4**: Implement Consistency Score calculator
  - Agent: `backend-specialist`
  - INPUT: Array of results from N runs
  - OUTPUT: `src/metrics/consistency.ts`
  - VERIFY: 5 identical outputs = 100% consistency

---

### Phase 4: Runners Implementation

- [ ] **Task 4.1**: Implement STT Runner (Whisper via Groq)
  - Agent: `backend-specialist`
  - INPUT: Audio file path
  - OUTPUT: `src/runners/stt-runner.ts`
  - VERIFY: Returns transcript text từ audio

- [ ] **Task 4.2**: Implement Analysis Runner (SOAP + ICD + Expert)
  - Agent: `backend-specialist`
  - INPUT: Transcript text, model config
  - OUTPUT: `src/runners/analysis-runner.ts`
  - VERIFY: Returns complete analysis với SOAP, ICD codes, advice

- [ ] **Task 4.3**: Implement Batch Runner (N iterations)
  - Agent: `backend-specialist`
  - INPUT: Scenario, N runs, model config
  - OUTPUT: `src/runners/batch-runner.ts`
  - VERIFY: Chạy N lần và aggregate results

---

### Phase 5: Export & CLI

- [ ] **Task 5.1**: Implement CSV Exporter
  - Agent: `backend-specialist`
  - INPUT: Evaluation results array
  - OUTPUT: `src/export/csv-exporter.ts`
  - VERIFY: CSV file được tạo với đúng columns

- [ ] **Task 5.2**: Implement CLI với Commander.js
  - Agent: `backend-specialist`
  - INPUT: CLI arguments spec
  - OUTPUT: `cli.ts`
  - VERIFY: `npx ts-node cli.ts --help` hiển thị usage

- [ ] **Task 5.3**: Tạo example scenario file
  - Agent: `backend-specialist`
  - INPUT: Ground truth format
  - OUTPUT: `scenarios/example-scenario.json`
  - VERIFY: JSON valid và có đủ fields

---

### Phase 6: Integration & Testing

- [ ] **Task 6.1**: Integration test với example scenario
  - Agent: `backend-specialist`
  - INPUT: Example scenario + audio file
  - OUTPUT: CSV report trong `results/`
  - VERIFY: CSV có đủ rows và columns

- [ ] **Task 6.2**: Test model switching
  - Agent: `backend-specialist`
  - INPUT: 2 different model configs
  - OUTPUT: 2 CSV reports
  - VERIFY: Results differ based on model

---

## Verification Plan

### Automated Tests

```bash
# Unit tests for metrics
npm test -- --grep "metrics"

# Integration test
npx ts-node cli.ts --scenario="./scenarios/example-scenario.json" --runs=1 --model="groq/openai/gpt-oss-120b" --output="./results/test-run.csv"
```

### Manual Verification

1. **Chạy với 5 runs**:
   ```bash
   npx ts-node cli.ts --scenario="./scenarios/example-scenario.json" --runs=5 --output="./results/5-runs.csv"
   ```
   → Kiểm tra CSV có 5 rows + summary row

2. **So sánh 2 models**:
   ```bash
   npx ts-node cli.ts --scenario="./scenarios/example-scenario.json" --runs=5 --model="groq/llama-3.3-70b-versatile" --output="./results/llama.csv"
   npx ts-node cli.ts --scenario="./scenarios/example-scenario.json" --runs=5 --model="groq/openai/gpt-oss-120b" --output="./results/gpt.csv"
   ```
   → Mở cả 2 CSV và so sánh metrics

3. **Kiểm tra CSV format**:
   → Mở bằng Excel/Google Sheets, đảm bảo columns đúng và data readable

---

## CLI Usage Examples

```bash
# Basic usage
npx ts-node cli.ts --scenario="./scenarios/test1.json" --runs=5

# With specific model
npx ts-node cli.ts --scenario="./scenarios/test1.json" --runs=5 --model="openai/gpt-4o-mini"

# Custom output path
npx ts-node cli.ts --scenario="./scenarios/test1.json" --runs=5 --output="./results/experiment-1.csv"

# List available models
npx ts-node cli.ts --list-models

# Verbose mode
npx ts-node cli.ts --scenario="./scenarios/test1.json" --runs=5 --verbose
```

---

## Scenario File Format

```json
{
  "id": "scenario-001",
  "name": "Viêm họng cấp - Bệnh nhân nam 35 tuổi",
  "audioPath": "./scenarios/audio/viemhong-001.wav",
  "groundTruth": {
    "transcript": "Bác sĩ: Chào anh, anh có triệu chứng gì...",
    "soap": {
      "subjective": "Bệnh nhân nam 35 tuổi, đau họng 3 ngày...",
      "objective": "Họng đỏ, amidan sưng...",
      "assessment": "Viêm họng cấp",
      "plan": "Kháng sinh Amoxicillin 500mg x 3 lần/ngày..."
    },
    "icdCodes": ["J02.9"],
    "advice": "Nghỉ ngơi, uống nhiều nước..."
  },
  "metadata": {
    "specialty": "ENT",
    "difficulty": "easy",
    "audioLength": 120
  }
}
```

---

## CSV Output Format

| Column | Description |
|--------|-------------|
| run_id | Lượt chạy (1-N) |
| scenario_id | ID của scenario |
| model | Model đã sử dụng |
| stt_wer | Word Error Rate của STT |
| soap_similarity | Similarity score của SOAP notes |
| icd_accuracy | Accuracy của ICD codes |
| advice_similarity | Similarity của medical advice |
| overall_score | Weighted average của tất cả metrics |
| latency_ms | Thời gian xử lý (ms) |
| timestamp | Thời điểm chạy |

**Summary Row (cuối file):**
| mean | std_dev | min | max | consistency_score |

---

## Notes

- Ground Truth phải được chuẩn bị kỹ bởi bác sĩ/chuyên gia y tế
- Audio files nên được chuẩn hóa (16kHz, mono) để đảm bảo consistency
- API rate limits cần được xử lý (retry logic)
- Cost estimation nên được log (token usage)
