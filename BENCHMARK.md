# 📊 MEA STT Benchmark Kit

Bộ công cụ vận hành và đánh giá Speech-to-Text (STT) cho dự án **Medical Examination Assistant (MEA)**.

## 📁 Cấu trúc thư mục (Updated)

```text
.
├── benchmarks/         # Mã nguồn công cụ chạy benchmark (TS)
├── engines/            # Chứa các file server STT (Python/FastAPI)
│   └── models/         # Chứa model Parakeet (.nemo) [GIT IGNORED]
├── plan_report/        # Kết quả benchmark và báo cáo so sánh [GIT IGNORED]
│   └── right_report/   # Nơi chứa báo cáo JSON và Markdown tổng hợp
├── logs/               # Log chi tiết của từng engine và benchmark [GIT IGNORED]
├── scripts/            # Các script Python hỗ trợ gộp kết quả
└── docs/               # Báo cáo và tài liệu phân tích kỹ thuật
```

## 🚀 Hướng dẫn vận hành

### 1. Khởi chạy STT Server
Mỗi engine STT chạy trên một port riêng. Bạn cần chạy server trước khi thực hiện benchmark.

```bash
# Ví dụ chạy WhisperX (Port 8080)
conda activate mea_env
python engines/whisperx_server.py

# Ví dụ chạy Parakeet (Port 8082)
python engines/parakeet_server.py
```

### 2. Chạy Benchmark
Công cụ benchmark (TypeScript) sẽ gửi yêu cầu trực tiếp đến các server đang chạy.

```bash
# Chạy benchmark cho WhisperX dùng model small
npx ts-node --project benchmarks/tsconfig.json benchmarks/run-stt-benchmark.ts --engine=whisperx --variant=small

# Chạy cho tất cả các engine đang bật
npx ts-node --project benchmarks/tsconfig.json benchmarks/run-stt-benchmark.ts --engine=all
```

## 📐 Các chỉ số quan trọng
- **WER (Word Error Rate):** Tỷ lệ lỗi nhận diện (Càng thấp càng tốt).
- **RTF (Real-time Factor):** Tốc độ xử lý (RTF < 1 là nhanh hơn thời gian thực).
- **Latency:** Độ trễ từ khi bắt đầu đến khi có kết quả.
- **MTA (Medical Term Accuracy):** Khả năng nhận diện chính xác các từ chuyên môn y tế.

## 📝 Chú ý
- **Quản lý model**: Các model lớn trong `engines/models/` được bỏ qua bởi `.gitignore`.
- **Lưu trữ kết quả**: Mặc định các kết quả benchmark được lưu tại `plan_report/right_report/`.
- **Xử lý lỗi**: Kiểm tra `logs/` nếu server không phản hồi.

---
*Lưu ý: Luôn đảm bảo server STT đang chạy trên port tương ứng trước khi khởi lệnh benchmark.*
