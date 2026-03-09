# Phase 02: Test Data & Ground Truth

**Status**: ✅ Complete  
**Dependencies**: Phase 01 (Benchmark Infrastructure)  
**Estimated Time**: 3-5 hours

---

## Objective

Tạo bộ **test data chuẩn** cho mỗi task trong pipeline, bao gồm:
- Audio samples cho STT
- Transcripts cho Role Detection & Medical Fixer
- Full transcripts cho SOAP/ICD/Expert agents
- Ground truth (đáp án chuẩn) cho mỗi test case

> ⚠️ **Lưu ý**: Ground truth y khoa lý tưởng nên được bác sĩ review. Ở giai đoạn này, ta tạo ground truth hợp lý dựa trên kiến thức y khoa và sử dụng để so sánh **tương đối** giữa các models.

---

## Requirements

### Functional
- [x] Tối thiểu 3 scenarios (dễ, trung bình, khó)
- [x] Mỗi scenario có đầy đủ ground truth cho tất cả tasks
- [x] Scenarios bằng tiếng Việt (medical context)
- [x] Audio samples: Skip (sẽ thực hiện trong Phase 03/04 cho STT)

### Non-Functional
- [x] Ground truth lưu dạng JSON, dễ machine-read
- [x] Scenarios có metadata (độ khó, chuyên khoa, thời lượng audio)

---

## Implementation Steps

### 1. Tạo folder structure cho test data

- [x] **1.1** Tạo folder `benchmarks/test-data/`
  ```
  benchmarks/test-data/
  ├── scenarios/
  │   ├── 01-viem-hong-cap.json      # Easy: Viêm họng cấp
  │   ├── 02-dau-da-day.json         # Medium: Đau dạ dày
  │   ├── 03-tang-huyet-ap.json      # Hard: Tăng huyết áp + Đái tháo đường
  │   └── schema.md                  # Mô tả format
  ├── audio/                          # Audio files (thêm sau)
  │   └── .gitkeep
  └── README.md
  ```

### 2. Thiết kế Scenario JSON Schema

- [x] **2.1** Tạo `benchmarks/test-data/scenarios/schema.md`
  ```json
  {
    "id": "scenario-001",
    "name": "Viêm họng cấp - Nam 35 tuổi",
    "difficulty": "easy|medium|hard",
    "specialty": "ENT|GI|Cardio|General",
    "metadata": {
      "patientAge": 35,
      "patientGender": "Nam",
      "audioLengthSeconds": 120
    },
    
    "groundTruth": {
      "transcript": "Bác sĩ: Chào anh...",
      
      "roleDetection": [
        { "text": "Chào anh, hôm nay anh đến khám có vấn đề gì?", "role": "Bác sĩ" },
        { "text": "Dạ thưa bác sĩ, em bị đau họng 3 ngày nay", "role": "Bệnh nhân" }
      ],
      
      "medicalFix": [
        { "input": "bệnh nhân bị viên họng cấp", "expected": "bệnh nhân bị viêm họng cấp" },
        { "input": "kê đơn amoxicilin", "expected": "kê đơn amoxicillin" }
      ],
      
      "soap": {
        "subjective": "Bệnh nhân nam 35 tuổi, đau họng 3 ngày, sốt nhẹ 37.8°C...",
        "objective": "Họng đỏ, amidan sưng nhẹ 2 bên...", 
        "assessment": "Viêm họng cấp (J02.9)",
        "plan": "Amoxicillin 500mg x 3 lần/ngày x 7 ngày..."
      },
      
      "icdCodes": ["J02.9"],
      
      "medicalAdvice": "Nghỉ ngơi, uống nhiều nước, tránh đồ lạnh..."
    }
  }
  ```

### 3. Tạo 3 scenarios chuẩn

- [ ] **3.1** Scenario 01: **Viêm họng cấp** (Easy)
  - 1 bệnh, triệu chứng rõ ràng
  - 1 mã ICD-10: J02.9
  - Phác đồ đơn giản: kháng sinh + giảm đau
  - Transcript ngắn (~6-8 lượt hội thoại)

- [ ] **3.2** Scenario 02: **Đau dạ dày - Viêm loét** (Medium)
  - Triệu chứng đa dạng (đau bụng, ợ nóng, buồn nôn)
  - 2 mã ICD-10: K29.7, K25.9
  - Phác đồ phức tạp hơn: PPI + kháng H.pylori
  - Transcript trung bình (~10-12 lượt hội thoại)

- [ ] **3.3** Scenario 03: **Tăng huyết áp + Đái tháo đường** (Hard)
  - Đa bệnh lý, nhiều thuốc
  - 3+ mã ICD-10: I10, E11.9, E78.0
  - Phác đồ phức tạp: hạ áp + hạ đường + statin
  - Transcript dài (~15-20 lượt hội thoại)
  - Cần xét nghiệm bổ sung

### 4. Tạo dữ liệu cho Medical Text Fixer

- [x] **4.1** Tạo `benchmarks/test-data/medical-fixer-cases.json` (25 cases) ✅
  - 20-30 cặp (input → expected output)
  - Bao gồm các lỗi phổ biến:
    - Lỗi chính tả y khoa: "viên họng" → "viêm họng"
    - Tên thuốc sai: "amoxicilin" → "amoxicillin"
    - Viết tắt cần giữ nguyên: "THA" (tăng huyết áp)
    - Số liệu sinh hiệu: "38 đô" → "38°C"
    - Thuật ngữ chuyên môn: "em bi xơ gan" → "em bị xơ gan"

### 5. Tạo dữ liệu cho Role Detection

- [x] **5.1** Tích hợp Ground Truth vào Scenarios JSON ✅
  - Mix các trường hợp:
    - Rõ ràng: "Bác sĩ hỏi gì?" (Bệnh nhân nói)
    - Mơ hồ: "Uống thuốc đều đặn nhé" (Bác sĩ nói)
    - Ngắn: "Dạ", "Vâng ạ" (context-dependent)

### 6. Tạo Audio files (nếu có thể)

- [ ] **6.1** Tùy chọn: Dùng TTS (Google/Edge) để tạo audio giả từ transcripts
  - Hoặc: ghi âm trực tiếp (chất lượng tốt hơn cho benchmark)
  - Hoặc: skip phần audio, dùng text-only cho LLM benchmarks, chỉ benchmark Whisper model size riêng

---

## Files to Create

| File | Purpose |
|------|---------|
| `benchmarks/test-data/scenarios/01-viem-hong-cap.json` | Scenario dễ |
| `benchmarks/test-data/scenarios/02-dau-da-day.json` | Scenario trung bình |
| `benchmarks/test-data/scenarios/03-tang-huyet-ap.json` | Scenario khó |
| `benchmarks/test-data/scenarios/schema.md` | Schema documentation |
| `benchmarks/test-data/medical-fixer-cases.json` | Medical text fixer test pairs |
| `benchmarks/test-data/README.md` | Test data overview |

---

## Test Criteria

- [x] Mỗi scenario JSON valid, parse không lỗi ✅
- [x] Ground truth SOAP notes có đủ S, O, A, P ✅
- [x] ICD codes trong ground truth là codes hợp lệ ✅
- [x] Medical fixer cases cover edge cases ✅
- [x] Role detection có mix trường hợp dễ + khó ✅

---

## Notes

- Ground truth là **baseline tương đối**, mục đích chính là so sánh **các model với nhau**
- Nếu có bác sĩ review ground truth → sẽ nâng chất lượng benchmark đáng kể
- Scenarios nên cover ít nhất 3 chuyên khoa khác nhau
- Có thể thêm scenarios sau (bộ test mở rộng)

---

**Next Phase**: [Phase 03 - STT Model Benchmarking](./phase-03-stt-benchmarking.md)
