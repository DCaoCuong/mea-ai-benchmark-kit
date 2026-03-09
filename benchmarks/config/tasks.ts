/**
 * Task Definitions
 * Defines all benchmark tasks with their prompts and scoring criteria
 */

export interface TaskConfig {
    id: string;
    name: string;
    description: string;
    expectedOutputFormat: 'json' | 'text';
    defaultModel: string;
    /** Function to build the prompt from scenario data */
    buildPrompt: (scenarioData: Record<string, any>) => string;
}

// ─── LLM Task Definitions ───

export const TASK_ROLE_DETECTION: TaskConfig = {
    id: 'role-detection',
    name: 'Role Detection',
    description: 'Phân biệt Bác sĩ / Bệnh nhân từ transcript segments',
    expectedOutputFormat: 'json',
    defaultModel: 'gemma2:2b',
    buildPrompt: (data) => {
        const segments = (data.segments || []) as Array<{ text: string }>;
        const conversationText = segments
            .map((seg: { text: string }, i: number) => `[${i}] "${seg.text.trim()}"`)
            .join('\n');

        return `/no_think
Phân loại vai trò cho mỗi đoạn hội thoại y khoa:
${conversationText}

Quy tắc: Bác sĩ = hỏi/chẩn đoán/kê thuốc. Bệnh nhân = mô tả triệu chứng/trả lời.
Trả về JSON: {"roles": ["Bác sĩ", "Bệnh nhân", ...]}`;
    },
};

export const TASK_MEDICAL_FIXER: TaskConfig = {
    id: 'medical-fixer',
    name: 'Medical Text Fixer',
    description: 'Sửa lỗi chính tả thuật ngữ y khoa',
    expectedOutputFormat: 'text',
    defaultModel: 'gemma2:2b',
    buildPrompt: (data) => {
        return `/no_think
Sửa lỗi chính tả y khoa trong câu sau (chỉ trả về câu đã sửa, không giải thích):
"${data.input}"`;
    },
};

export const TASK_SOAP_GENERATION: TaskConfig = {
    id: 'soap-generation',
    name: 'SOAP Generation (Scribe Agent)',
    description: 'Chuyển transcript thành SOAP notes JSON',
    expectedOutputFormat: 'json',
    defaultModel: 'gemma2:2b',
    buildPrompt: (data) => {
        return `Bạn là thư ký y khoa chuyên nghiệp.
Nhiệm vụ: Chuyển transcript hội thoại thành bệnh án chuẩn SOAP tiếng Việt.

Transcript:
"${data.transcript}"

Yêu cầu output JSON format:
{
    "subjective": "Tóm tắt triệu chứng cơ năng, bệnh sử...",
    "objective": "Tóm tắt triệu chứng thực thể, dấu hiệu sinh tồn (nếu có)...",
    "assessment": "Chẩn đoán sơ bộ...",
    "plan": "Kế hoạch điều trị, thuốc, dặn dò..."
}
Chỉ trả về JSON hợp lệ, không có text khác.`;
    },
};

export const TASK_ICD_CODING: TaskConfig = {
    id: 'icd-coding',
    name: 'ICD-10 Coding',
    description: 'Gợi ý mã ICD-10 từ chẩn đoán',
    expectedOutputFormat: 'json',
    defaultModel: 'gemma2:2b',
    buildPrompt: (data) => {
        return `Bạn là chuyên gia về mã hóa bệnh lý ICD-10.
Chẩn đoán: "${data.assessment}"
Triệu chứng: "${data.subjective}"

Nhiệm vụ: Tìm mã ICD-10 phù hợp nhất (ưu tiên mã chi tiết).
Trả về kết quả dưới dạng JSON Object với key "codes" là danh sách các mã.
Ví dụ:
{
    "codes": ["K29.7 - Viêm dạ dày", "R10.1 - Đau vùng thượng vị"]
}`;
    },
};

export const TASK_EXPERT_ADVICE: TaskConfig = {
    id: 'expert-advice',
    name: 'Expert Medical Advice (RAG)',
    description: 'Tư vấn y khoa dựa trên SOAP + y văn',
    expectedOutputFormat: 'text',
    defaultModel: 'llama3.2',
    buildPrompt: (data) => {
        const context = data.ragContext || '(Không có y văn tham khảo)';
        return `Bạn là chuyên gia y tế cố vấn. TẤT CẢ PHẢN HỒI PHẢI BẰNG TIẾNG VIỆT.
Dựa vào Y VĂN ĐƯỢC CUNG CẤP dưới đây, hãy đưa ra nhận xét và gợi ý điều trị.

Y VĂN (Context):
${context}

BỆNH ÁN (SOAP):
S: ${data.subjective}
O: ${data.objective}
A: ${data.assessment}
P (hiện tại): ${data.plan}

YÊU CẦU (PHẢI TRẢ LỜI BẰNG TIẾNG VIỆT):
- Đưa ra lời khuyên ngắn gọn cho bác sĩ điều trị.
- Gợi ý xét nghiệm/chẩn đoán hình ảnh cần làm thêm (nếu cần).
- TRÍCH DẪN từ y văn (nếu có).

LƯU Ý QUAN TRỌNG: KHÔNG dùng tiếng Anh. Tất cả phải bằng TIẾNG VIỆT.`;
    },
};

// ─── All Tasks ───

export const ALL_LLM_TASKS: TaskConfig[] = [
    TASK_ROLE_DETECTION,
    TASK_MEDICAL_FIXER,
    TASK_SOAP_GENERATION,
    TASK_ICD_CODING,
    TASK_EXPERT_ADVICE,
];

/**
 * Get a task by ID
 */
export function getTaskById(id: string): TaskConfig | undefined {
    return ALL_LLM_TASKS.find((t) => t.id === id);
}
