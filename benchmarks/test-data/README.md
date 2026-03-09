# Benchmark Test Data

Bộ test data chuẩn cho MEA (Medical Examination Assistant) benchmark.

## Cấu trúc

```
test-data/
├── scenarios/            # 3 scenarios y khoa (Easy/Medium/Hard)
│   ├── 01-viem-hong-cap.json
│   ├── 02-dau-da-day.json
│   ├── 03-tang-huyet-ap.json
│   └── schema.md
├── medical-fixer-cases.json  # 25 cặp input→expected cho Medical Text Fixer
├── audio/                     # Audio files (thêm sau)
│   └── .gitkeep
└── README.md
```

## Scenarios

| # | Tên | Độ khó | Chuyên khoa | ICD-10 | Turns |
|---|-----|--------|-------------|--------|-------|
| 01 | Viêm họng cấp | Easy | Tai Mũi Họng | J02.9 | 8 |
| 02 | Đau dạ dày - Viêm loét | Medium | Tiêu hóa | K29.7, K25.9 | 12 |
| 03 | Tăng huyết áp + ĐTĐ | Hard | Tim mạch + Nội tiết | I10, E11.9, E78.0 | 18 |

## Ground Truth

Mỗi scenario chứa ground truth cho tất cả 5 tasks:
- **roleDetection**: Mảng [{text, role}] cho từng đoạn hội thoại
- **medicalFix**: Mảng [{input, expected}] các lỗi chính tả y khoa
- **soap**: Object {subjective, objective, assessment, plan}
- **icdCodes**: Mảng mã ICD-10
- **medicalAdvice**: Lời khuyên y khoa tham khảo

> ⚠️ Ground truth là baseline tương đối, mục đích chính là so sánh các models với nhau.
