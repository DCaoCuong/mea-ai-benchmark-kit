/**
 * STT Metrics Utility
 * Calculates WER (Word Error Rate) and Medical Term Accuracy
 */

/**
 * Calculate Word Error Rate (WER)
 * Formula: (S + D + I) / N
 * S: Substitutions, D: Deletions, I: Insertions, N: Reference Word Count
 */
export function calculateWer(reference: string, hypothesis: string): number {
    const refStr = String(reference || '');
    const hypStr = String(hypothesis || '');
    const ref = refStr.toLowerCase().replace(/[.,!?;:\"\'`]/g, '').split(/\s+/).filter(Boolean);
    const hyp = hypStr.toLowerCase().replace(/[.,!?;:\"\'`]/g, '').split(/\s+/).filter(Boolean);

    if (ref.length === 0) return hyp.length > 0 ? 1 : 0;

    const m = ref.length;
    const n = hyp.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (ref[i - 1] === hyp[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                const substitution = dp[i - 1][j - 1] + 1;
                const insertion = dp[i][j - 1] + 1;
                const deletion = dp[i - 1][j] + 1;
                dp[i][j] = Math.min(substitution, insertion, deletion);
            }
        }
    }

    const edits = dp[m][n];
    const wer = edits / ref.length;
    return Number(wer.toFixed(4));
}

/**
 * Calculate Medical Term Accuracy (MTA)
 * Checks how many specific medical terms from a list appear in the result
 */
export function calculateMedicalAccuracy(
    transcription: string,
    requiredTerms: string[]
): { score: number; found: string[]; missing: string[] } {
    if (!requiredTerms || requiredTerms.length === 0) return { score: 100, found: [], missing: [] };

    const text = transcription.toLowerCase();
    const found: string[] = [];
    const missing: string[] = [];

    for (const term of requiredTerms) {
        const termLower = term.toLowerCase().trim();
        // Use word boundaries for better matching
        const regex = new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

        if (regex.test(text) || text.includes(termLower)) {
            found.push(term);
        } else {
            missing.push(term);
        }
    }

    const score = Math.round((found.length / requiredTerms.length) * 100);
    return { score, found, missing };
}

/**
 * Standardize transcription (remove filler words, normalize whitespace)
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[.,!?;:\"\'`]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\b(ạ|vâng|dạ|thì|là|mà|...)\b/g, '') // Remove Vietnamese fillers
        .trim();
}
