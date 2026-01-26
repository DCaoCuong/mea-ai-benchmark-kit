import { Injectable } from '@nestjs/common';
import { AgentState } from '../graph/agent.state';
import { VectorStoreService } from '../../rag/vectorstore.service';
import { Document } from '@langchain/core/documents';
import { getGroqClient, GROQ_MODEL_STANDARD, GROQ_MODEL_EXPERT } from '../models/groq.models';

@Injectable()
export class AgentNodesService {
    constructor(private readonly vectorStoreService: VectorStoreService) { }

    // --- 1. SCRIBE AGENT ---
    async scribeNode(state: AgentState): Promise<Partial<AgentState>> {
        console.log('Scribe Agent working (Groq GPT-OSS-120B)...');

        const prompt = `Bạn là thư ký y khoa chuyên nghiệp.
Nhiệm vụ: Chuyển transcript hội thoại thành bệnh án chuẩn SOAP tiếng Việt.

Transcript:
"${state.transcript}"

Yêu cầu output JSON format:
{
    "subjective": "Tóm tắt triệu chứng cơ năng, bệnh sử...",
    "objective": "Tóm tắt triệu chứng thực thể, dấu hiệu sinh tồn (nếu có)...",
    "assessment": "Chẩn đoán sơ bộ...",
    "plan": "Kế hoạch điều trị, thuốc, dặn dò..."
}
Chỉ trả về JSON hợp lệ, không có text khác.`;

        try {
            const groq = getGroqClient();
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: GROQ_MODEL_STANDARD,
                temperature: 0.1,
                response_format: { type: 'json_object' },
            });

            const soap = JSON.parse(
                completion.choices[0]?.message?.content || '{}',
            );
            return { soap };
        } catch (e) {
            console.error('Scribe Agent Error:', e);
            return {
                soap: {
                    subjective: '',
                    objective: '',
                    assessment: '',
                    plan: 'Error generating SOAP note',
                },
            };
        }
    }

    // --- 2. ICD-10 AGENT ---
    async icdNode(state: AgentState): Promise<Partial<AgentState>> {
        console.log('ICD-10 Agent working (Groq GPT-OSS-120B)...');

        const prompt = `Bạn là chuyên gia về mã hóa bệnh lý ICD-10.
Chẩn đoán: "${state.soap.assessment}"
Triệu chứng: "${state.soap.subjective}"

Nhiệm vụ: Tìm mã ICD-10 phù hợp nhất (ưu tiên mã chi tiết).
Trả về kết quả dưới dạng JSON Object với key "codes" là danh sách các mã.
Ví dụ:
{
    "codes": ["K29.7 - Viêm dạ dày", "R10.1 - Đau vùng thượng vị"]
}`;

        try {
            const groq = getGroqClient();
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: GROQ_MODEL_STANDARD,
                temperature: 0.1,
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0]?.message?.content || '{}';
            console.log(' ICD-10 Raw Output:', content);

            const parsed = JSON.parse(content);
            // Normalize output
            const codes = Array.isArray(parsed)
                ? parsed
                : parsed.codes || parsed.icd_codes || [];
            const finalCodes = Array.isArray(codes)
                ? codes.map((c) => String(c))
                : [];

            return { icdCodes: finalCodes };
        } catch (e) {
            console.error('ICD-10 Agent Error:', e);
            return { icdCodes: ['Error retrieving ICD codes'] };
        }
    }

    // --- 3. MEDICAL EXPERT AGENT (RAG) ---
    async expertNode(state: AgentState): Promise<Partial<AgentState>> {
        console.log('🧑‍⚕️ Medical Expert Agent working (Groq GPT-OSS-20B)...');

        try {
            // 1. Retrieve relevant docs based on Subjective
            const retriever = this.vectorStoreService.getRetriever();
            const docs = await retriever.invoke(state.soap.subjective);

            const context = docs.map((d: Document) => d.pageContent).join('\n---\n');
            const references = docs.map((d: Document) =>
                (d.metadata.source || 'Unknown Source').replace('.md', ''),
            );

            // 2. Ask LLM with Context
            const prompt = `Bạn là chuyên gia y tế cố vấn. TẤT CẢ PHẢN HỒI PHẢI BẰNG TIẾNG VIỆT.
Dựa vào Y VĂN ĐƯỢC CUNG CẤP dưới đây, hãy đưa ra nhận xét và gợi ý điều trị.

Y VĂN (Context):
${context}

BỆNH ÁN (SOAP):
S: ${state.soap.subjective}
O: ${state.soap.objective}
A: ${state.soap.assessment}
P (hiện tại): ${state.soap.plan}

YÊU CẦU (PHẢI TRẢ LỜI BẰNG TIẾNG VIỆT):
- Đưa ra lời khuyên ngắn gọn cho bác sĩ điều trị.
- Cảnh báo nếu phác đồ hiện tại (Plan) có gì sai sót hoặc không phù hợp so với Y VĂN.
- Gợi ý xét nghiệm/chẩn đoán hình ảnh cần làm thêm (nếu cần).
- Gợi ý điều trị và quản lý bệnh nhân.
- Khi nào cần can thiệp chuyên khoa.
- TRÍCH DẪN từ y văn (nếu có).

LƯU Ý QUAN TRỌNG: 
- KHÔNG dùng tiếng Anh. 
- Tất cả tiêu đề, nội dung phải hoàn toàn bằng TIẾNG VIỆT.`;

            const groq = getGroqClient();
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: GROQ_MODEL_EXPERT,
                temperature: 0.2,
            });

            return {
                medicalAdvice: completion.choices[0]?.message?.content || '',
                references,
            };
        } catch (e) {
            console.error('Medical Expert Agent Error:', e);
            return {
                medicalAdvice: 'Error generating medical advice',
                references: [],
            };
        }
    }
}
