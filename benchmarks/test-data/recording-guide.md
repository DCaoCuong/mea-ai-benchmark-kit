# Hướng dẫn Thu âm Dữ liệu Benchmark STT (MEA Project)

Bộ dữ liệu này dùng để đo chỉ số WER (Word Error Rate) và Medical Term Accuracy.

## 1. Yêu cầu kỹ thuật
- **Định dạng**: WAV (Uncompressed)
- **Sample Rate**: 16,000 Hz (Khuyến nghị cho STT)
- **Channels**: Mono (1 kênh)
- **Độ sâu bit**: 16-bit

## 2. Quy cách đặt tên
Lưu file vào thư viện `benchmarks/test-data/audio/`:
- `scenario-001.wav` (Tương ứng kịch bản Viêm họng cấp)
- `scenario-002.wav` (Tương ứng kịch bản Đau dạ dày)
- `scenario-003.wav` (Tương ứng kịch bản Tăng huyết áp)

## 3. Lưu ý khi diễn tập (Acting Tips)
- **Tốc độ**: Nói tốc độ trung bình, không cần quá chậm.
- **Biểu cảm**: Đóng vai Bác sĩ chuyên nghiệp và Bệnh nhân đang có triệu chứng (có thể hơi mệt mỏi).
- **Thuật ngữ**: Đọc rõ các tên thuốc (Amoxicillin, Omeprazole, Amlodipine, Metformin) và các chỉ số (mmHg, mg/dL).
- **Tiếng ồn**: Có thể để tiếng quạt nhẹ hoặc tiếng gõ phím ở nền để giả lập môi trường phòng khám thực tế.

## 4. Kịch bản tóm tắt
- **Scenario 1**: 6 lượt nói (~45 giây) - Viêm họng cấp (Dễ)

Bác sĩ: Chào anh, hôm nay anh đến khám có vấn đề gì?

Bệnh nhân: Dạ thưa bác sĩ, em bị đau họng 3 ngày nay, nuốt thấy đau lắm, với lại có sốt nhẹ nữa.

Bác sĩ: Anh có ho nhiều không? Có bị sổ mũi hay nghẹt mũi gì không?

Bệnh nhân: Dạ có ho khan bác sĩ ạ, nhưng không có sổ mũi.

Bác sĩ: Để tôi khám họng cho anh nhé... Họng hơi đỏ, amidan sưng nhẹ hai bên. Nhiệt độ đo được là 37.8 độ. Đây là tình trạng viêm họng cấp nhé.

Bác sĩ: Tôi sẽ kê cho anh thuốc Amoxicillin 500mg, mỗi ngày uống 3 lần, duy trì trong vòng 7 ngày. Nếu có sốt trên 38.5 độ thì anh uống thêm Paracetamol.

Bệnh nhân: Dạ vâng, em rõ rồi. Cảm ơn bác sĩ nhiều ạ.

- **Scenario 2**: 8 lượt nói (~1 phút) - Đau dạ dày (Trung bình)

Bác sĩ: Chào chị, chị bị đau bụng vùng nào và đau từ bao giờ?

Bệnh nhân: Tôi bị đau âm ỉ ở vùng thượng vị bác sĩ ạ. Cứ đói cũng đau mà ăn no vào nó cũng tức. Đã bị hơn một tuần rồi.

Bác sĩ: Chị có thấy ợ chua hay buồn nôn không? Trong nhà có ai từng bị đau dạ dày tương tự chưa?

Bệnh nhân: Có ợ chua nhiều bác sĩ ơi. Mẹ tôi trước đây cũng bị viêm loét dạ dày mãn tính.

Bác sĩ: Chị có đang dùng thuốc giảm đau hay thực phẩm chức năng gì thường xuyên không?

Bệnh nhân: Tôi hay uống Ibuprofen vì thi thoảng hay bị đau khớp gối.

Bác sĩ: À, Ibuprofen có thể là nguyên nhân làm nặng thêm tình trạng đau dạ dày đấy. Tôi nghi ngờ chị bị viêm loét dạ dày tá tràng. Cần làm thêm test HP nữa.

Bác sĩ: Trước mắt chị dùng Omeprazole 20mg mỗi sáng trước ăn 30 phút. Và tạm ngưng thuốc giảm đau kia nhé.

- **Scenario 3**: 10 lượt nói (~1 phút 30 giây) - Tăng huyết áp + Đái tháo đường type 2 + Rối loạn lipid máu (Khó)

Bác sĩ: Chào bác, hôm nay bác đi tái khám định kỳ đúng không ạ? Bác thấy trong người thế nào?

Bệnh nhân: Chào bác sĩ. Tôi thấy dạo này hay chóng mặt buổi sáng, chân tay thì cứ tê bì như kim châm ấy.

Bác sĩ: Để cháu kiểm tra huyết áp... Chỉ số hôm nay khá cao, tận 165 trên 100 mmHg. Kết quả xét nghiệm máu cho thấy đường huyết đói là 180 mg/dL và chỉ số HbA1c lên tới 9.2%.

Bác sĩ: Như vậy là tình trạng Tăng huyết áp và Đái tháo đường type 2 của bác đang chưa được kiểm soát tốt. Cái tê bì chân tay có thể là biến chứng thần kinh ngoại biên do tiểu đường.

Bác sĩ: Cháu sẽ điều chỉnh đơn thuốc: Thêm Amlodipine 5mg vào buổi sáng để hạ áp, và tăng liều Metformin lên 1000mg mỗi ngày. Bác cần tuyệt đối hạn chế tinh bột và đi bộ nhẹ nhàng nhé.

Bệnh nhân: Sao thuốc nhiều thế bác sĩ? Tôi còn đang uống cả thuốc mỡ máu nữa.

Bác sĩ: Bác cứ yên tâm, cháu đã cân đối để tránh tương tác thuốc rồi. Bác cần tuân thủ đúng liều lượng này.


