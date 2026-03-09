# 🚀 BÁO CÁO TỔNG KẾT BENCHMARK STT (GIAI ĐOẠN 1)

**Ngày lập:** 09/03/2026
**Dự án:** Medical Examination Assistant (MEA)

---

## 1. MỤC TIÊU BENCHMARK
Đánh giá hiệu năng và độ chính xác của các công nghệ Chuyển đổi giọng nói thành văn bản (STT) mã nguồn mở phổ biến hiện nay trên tập dữ liệu hội thoại y khoa tiếng Việt.

---

## 2. THÔNG SỐ KỸ THUẬT & PHƯƠNG PHÁP
- **Phần cứng:** CPU i7-11800H | RAM 16GB | GPU RTX 3050 Ti (4GB VRAM).
- **Phần mềm:** Chạy trên môi trường Conda `mea_env`, backend FastAPI cho các server STT.
- **Dữ liệu:** 3 Scenario (Dễ, Trung bình, Khó) với thời lượng từ 15s - 60s, bao gồm thuật ngữ ICD-10 và tên thuốc.

---

## 3. BẢNG KẾT QUẢ TỔNG HỢP

| Engine | Model Variant | WER (%) ⬇️ | RTF (Real-time Factor) | Latency (ms) | Med.Term Accuracy |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **WhisperX** | `small` | **91.1%** | 0.10 | 17,570 | **1.7%** |
| **Parakeet** | `0.6b-vi` | 100.0% | **0.02** | **2,603** | 0% |
| **Moonshine**| `base` | 100.0% | 0.15 | 29,521 | 0% |
| **WhisperLive**| `small` | 103.2% | 0.24 | 44,233 | 0% |

---

## 4. PHÂN TÍCH CHUYÊN SÂU

### 4.1. WhisperX (Triển vọng nhất)
- **Đánh giá:** Đây là "ngôi sao" của đợt benchmark. Dù model `small` chỉ đạt độ chính xác thấp, nhưng nó là engine duy nhất thực sự hiểu và viết ra được tiếng Việt có nghĩa trong domain y tế.
- **Tiềm năng:** Khả năng tích hợp VAD (Voice Activity Detection) và Diarization rất mạnh mẽ.
- **Đề xuất:** Nâng cấp lên model `medium` hoặc `large-v3`. Với GPU 4GB, model `medium` là giới hạn an toàn.

### 4.2. Parakeet (Tối ưu về tốc độ)
- **Đánh giá:** Tốc độ xử lý cực ấn tượng (nhanh gấp 50 lần thời gian thực).
- **Vấn đề:** Độ chính xác cực thấp trên dữ liệu y tế thực tế. Model này có vẻ chỉ mạnh trên các tập dữ liệu sạch (clean speech).

### 4.3. Moonshine & WhisperLive
- **Hallucination:** Moonshine gặp lỗi nghiêm trọng khi liên tục lặp lại các câu tiếng Anh.
- **Latency:** WhisperLiveKit có độ trễ lớn, không phù hợp cho việc xử lý file audio tĩnh nhanh, chỉ nên cân nhắc nếu làm feature "Live Dictation" (vừa nói vừa hiện chữ).

---

## 5. KẾT LUẬN & HƯỚNG ĐI TIẾP THEO

### Kết luận:
Hiện tại chưa có engine nào đạt mức "Production-ready" với model kích thước nhỏ (`small`/`base`) trên domain y tế tiếng Việt.

### Hướng đi (Phase 2):
1. **Nâng cấp Model:** Thử nghiệm WhisperX với `medium` variant.
2. **Fine-tuning:** Nghiên cứu việc thêm "Prompting" (ví dụ: cung cấp danh sách tên thuốc trước khi transcribing) để giảm lỗi WER.
3. **Hybrid Approach:** Sử dụng Parakeet để nhận diện giọng nói và WhisperX để lấy nội dung chi tiết.

---
*Báo cáo được trích xuất tự động từ hệ thống Benchmark MEA.*
