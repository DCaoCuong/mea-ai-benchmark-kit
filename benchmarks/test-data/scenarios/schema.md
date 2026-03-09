# Scenario JSON Schema

Mỗi scenario file tuân theo cấu trúc sau:

```json
{
  "id": "scenario-XXX",
  "name": "Tên scenario",
  "difficulty": "easy | medium | hard",
  "specialty": "ENT | GI | Cardio | Endo | General",
  "metadata": {
    "patientAge": 35,
    "patientGender": "Nam | Nữ",
    "chiefComplaint": "Mô tả ngắn lý do khám",
    "estimatedAudioLengthSeconds": 120,
    "numberOfTurns": 8,
    "medicalTermCount": 5
  },

  "transcript": "Full transcript dạng text (Bác sĩ: ... Bệnh nhân: ...)",

  "segments": [
    {
      "index": 0,
      "text": "Nội dung đoạn hội thoại",
      "role": "Bác sĩ | Bệnh nhân",
      "type": "greeting | symptom_inquiry | symptom_report | examination | diagnosis | prescription | acknowledgment"
    }
  ],

  "groundTruth": {
    "roleDetection": {
      "roles": ["Bác sĩ", "Bệnh nhân", ...],
      "description": "Mảng role tương ứng với mảng segments"
    },

    "medicalFix": [
      {
        "input": "text có lỗi chính tả y khoa",
        "expected": "text đã sửa đúng",
        "errorType": "spelling | drug_name | abbreviation | unit | terminology"
      }
    ],

    "soap": {
      "subjective": "Triệu chứng cơ năng, bệnh sử...",
      "objective": "Triệu chứng thực thể, dấu hiệu sinh tồn...",
      "assessment": "Chẩn đoán sơ bộ",
      "plan": "Kế hoạch điều trị..."
    },

    "icdCodes": ["J02.9", "..."],
    "icdCodesDetail": [
      { "code": "J02.9", "description": "Viêm họng cấp, không đặc hiệu" }
    ],

    "medicalAdvice": "Lời khuyên y khoa tham khảo cho Expert Agent",

    "medicalTerms": ["amoxicillin", "viêm họng", "..."]
  }
}
```

## Fields Explanation

| Field | Dùng cho Task | Mô tả |
|-------|---------------|-------|
| `transcript` | SOAP, ICD, Expert | Full text của cuộc hội thoại |
| `segments` | Role Detection | Từng đoạn hội thoại riêng lẻ |
| `groundTruth.roleDetection` | Role Detection | Đáp án phân vai |
| `groundTruth.medicalFix` | Medical Fixer | Cặp input/expected |
| `groundTruth.soap` | SOAP Generation | SOAP notes chuẩn |
| `groundTruth.icdCodes` | ICD Coding | Mã ICD-10 chuẩn |
| `groundTruth.medicalAdvice` | Expert Agent | Lời khuyên tham khảo |
| `groundTruth.medicalTerms` | STT (medical accuracy) | Thuật ngữ y khoa cần nhận dạng |
