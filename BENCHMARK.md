# 📊 MEA STT Benchmark Kit

Bộ công cụ này được thiết kế để cấu hình và đánh giá các kỹ thuật Speech-to-Text (STT) tại môi trường local cho dự án **Medical Examination Assistant (MEA)**.

## 📁 Cấu trúc thư mục

```text
.
├── benchmarks/         # Mã nguồn công cụ chạy benchmark (TS)
├── engines/            # Chứa các file server STT (Python/FastAPI)
│   └── models/         # Chứa các model lớn (.nemo, .onnx, ...) [GIT IGNORED]
├── data/
│   └── results/        # Kết quả benchmark dưới dạng JSON [GIT IGNORED]
├── logs/               # Log output của các phiên chạy [GIT IGNORED]
├── scripts/            # Các script hỗ trợ (aggregate, test, ...)
└── docs/               # Báo cáo và tài liệu phân tích
```

## 🚀 Hướng dẫn sử dụng

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
Công cụ benchmark sẽ gửi yêu cầu đến các server đang chạy và tính toán chỉ số (WER, RTF, Latency).

```bash
# Chạy benchmark cho WhisperX dùng model small
npx ts-node --project benchmarks/tsconfig.json benchmarks/run-stt-benchmark.ts --engine=whisperx --variant=small

# Chạy cho tất cả các engine đã cấu hình
npx ts-node --project benchmarks/tsconfig.json benchmarks/run-stt-benchmark.ts --engine=all
```

## 📐 Các chỉ số quan trọng
- **WER (Word Error Rate):** Tỷ lệ lỗi từ (càng thấp càng tốt).
- **RTF (Real-time Factor):** Tỷ lệ thời gian xử lý / thời gian audio (RTF < 1 là nhanh hơn thực tế).
- **Latency:** Độ trễ từ khi bắt đầu đến khi có kết quả.
- **MTA (Medical Term Accuracy):** Độ chính xác khi nhận diện các thuật ngữ chuyên môn y tế.

## 📝 Chú ý
- Các model lớn trong `engines/models/` được bỏ qua bởi `.gitignore` để tránh tăng dung lượng repo.
- Các file log trong `logs/` sẽ được ghi đè hoặc tạo mới sau mỗi lần chạy.
