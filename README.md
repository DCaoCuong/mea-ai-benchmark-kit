# 🚀 MEA AI Benchmarking Kit

Bộ công cụ đánh giá chuyên sâu dành cho các mô hình AI (STT, LLM) phục vụ dự án **Medical Examination Assistant (MEA)**. Đây là phiên bản đã được tách biệt hoàn toàn khỏi repo Backend cũ để tối ưu hóa việc đo lường và phát triển các kỹ thuật AI.

## 🎯 Mục đích dự án
Repo này là "đấu trường" để:
1.  **Chạy Local STT Servers**: Thử nghiệm WhisperX, Parakeet, Moonshine, WhisperLiveKit trên hạ tầng local.
2.  **Đo lường định lượng**: Tính toán WER, RTF, Latency và Medical Term Accuracy (MTA) trên tập dữ liệu y tế thực tế.
3.  **Báo cáo & Phân tích**: Lưu trữ các báo cáo so sánh chi tiết để đưa ra quyết định lựa chọn model tối ưu nhất.

## 📁 Cấu trúc thư mục (Updated)
```text
.
├── benchmarks/         # Mã nguồn công cụ chạy benchmark (TypeScript)
├── engines/            # Chứa các server STT (Python/FastAPI)
│   └── models/         # Chứa các model lớn (.nemo, .onnx, ...) [GIT IGNORED]
├── plan_report/        # Kết quả benchmark và các báo cáo định kỳ (Markdown, JSON)
├── logs/               # Output log của các phiên chạy server và benchmark [GIT IGNORED]
├── scripts/            # Các script Python hỗ trợ (aggregate_results, test_engines)
├── docs/               # Tài liệu thiết kế kỹ thuật và thông số (Specs)
└── src/                # (Legacy) Core backend logic
```

## 📊 Kết quả Benchmark STT (Giai đoạn 1)
Dưới đây là bảng so sánh hiệu năng của các engine STT được thực hiện trên tập dữ liệu hội thoại y tế tiếng Việt:

| Engine | Model Variant | WER (%) ⬇️ | RTF | Latency (ms) | Med.Term Acc. |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **WhisperX** | `small` | **91.1%** | 0.10 | 17,570 | **1.7%** |
| **Parakeet** | `0.6b-vi` | 100.0% | **0.02** | **2,603** | 0% |
| **Moonshine**| `base` | 100.0% | 0.15 | 29,521 | 0% |
| **WhisperLive**| `small` | 103.2% | 0.24 | 44,233 | 0% |

> **Nhận định nhanh:** WhisperX hiện là ứng cử viên sáng giá nhất về độ chính xác, trong khi Parakeet dẫn đầu về tốc độ xử lý thô.

## 🛠️ Trạng thái hiện tại
 (Giai đoạn 1)
- ✅ Hoàn tất benchmark 4 kỹ thuật STT.
- ✅ Cấu trúc dự án đã được modular hóa.
- ⏳ Kế hoạch tiếp theo: Triển khai bộ benchmark cho LLM (Summarization & ICD-10 Extraction).

## 🏃‍♂️ Bắt đầu nhanh
Để biết chi tiết cách cài đặt môi trường và vận hành công cụ benchmark, vui lòng xem tài liệu:
👉 **[BENCHMARK.md](./BENCHMARK.md)**

---
*Phát triển bởi Senlyzer Team*