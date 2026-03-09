# 🚀 MEA AI Benchmarking Kit

Bộ công cụ đánh giá hiệu năng và chất lượng cho các mô hình AI (STT, LLM) dành riêng cho dự án **Medical Examination Assistant (MEA)**.

## 🎯 Mục đích dự án
Repo này được tách ra để tập trung vào việc:
1.  **Cấu hình & Triển khai Local**: Thiết lập các server STT (WhisperX, Parakeet, Moonshine) và LLM tại môi trường local.
2.  **Đánh giá định lượng (Benchmarking)**: Chạy các kịch bản audio y tế thực tế để đo lường WER, RTF, Latency và độ chính xác thuật ngữ y khoa.
3.  **Tối ưu hóa pipeline**: Thử nghiệm các kỹ thuật tiền xử lý audio, prompt engineering và fine-turning trước khi đưa vào hệ thống MEA chính thức.

## 📁 Cấu trúc dự án
- `engines/`: Chứa mã nguồn các STT server (FastAPI) và các model tải về.
- `benchmarks/`: Công cụ chạy benchmark tự động bằng TypeScript.
- `data/`: Dữ liệu audio mẫu (`test-data`) và kết quả đo lường (`results`).
- `scripts/`: Các script Python hỗ trợ xử lý dữ liệu và tổng hợp báo cáo.
- `docs/`: Chứa các báo cáo benchmark chi tiết (Markdown) và biểu đồ phân tích.

## 🛠️ Trạng thái hiện tại
- ✅ Đã triển khai và benchmark 4 kỹ thuật STT: **WhisperX**, **Moonshine**, **Parakeet**, **WhisperLiveKit**.
- ⏳ Kế hoạch tiếp theo: Triển khai benchmark cho các mô hình LLM (Summarization, ICD-10 Extraction).

## 🏃‍♂️ Bắt đầu nhanh
Để biết chi tiết cách cài đặt môi trường và vận hành công cụ benchmark, vui lòng xem tài liệu:
👉 **[BENCHMARK.md](./BENCHMARK.md)**

---
*Dự án thuộc hệ sinh thái Senlyzer AI.*