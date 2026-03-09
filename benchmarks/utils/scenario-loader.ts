/**
 * Scenario Loader
 * Loads test scenarios and medical fixer cases from JSON files
 */
import * as fs from 'fs';
import * as path from 'path';

const TEST_DATA_DIR = path.resolve(__dirname, '..', 'test-data');
const SCENARIOS_DIR = path.join(TEST_DATA_DIR, 'scenarios');

export interface Scenario {
    id: string;
    name: string;
    difficulty: 'easy' | 'medium' | 'hard';
    specialty: string;
    metadata: {
        patientAge: number;
        patientGender: string;
        chiefComplaint: string;
        estimatedAudioLengthSeconds: number;
        numberOfTurns: number;
        medicalTermCount: number;
    };
    transcript: string;
    segments: Array<{
        index: number;
        text: string;
        role: string;
        type: string;
    }>;
    groundTruth: {
        roleDetection: {
            roles: string[];
            description: string;
        };
        medicalFix: Array<{
            input: string;
            expected: string;
            errorType: string;
        }>;
        soap: {
            subjective: string;
            objective: string;
            assessment: string;
            plan: string;
        };
        icdCodes: string[];
        icdCodesDetail: Array<{
            code: string;
            description: string;
        }>;
        medicalAdvice: string;
        medicalTerms: string[];
    };
}

export interface MedicalFixerCase {
    id: number;
    input: string;
    expected: string;
    errorType: string;
    difficulty: string;
    note?: string;
}

/**
 * Load all scenarios from test-data/scenarios/
 */
export function loadAllScenarios(): Scenario[] {
    const files = fs.readdirSync(SCENARIOS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort();

    const scenarios: Scenario[] = [];
    for (const file of files) {
        const filepath = path.join(SCENARIOS_DIR, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        scenarios.push(JSON.parse(content));
    }

    console.log(`📂 Loaded ${scenarios.length} scenarios:`);
    for (const s of scenarios) {
        console.log(`   [${s.difficulty.toUpperCase().padEnd(6)}] ${s.name} (${s.segments.length} segments, ${s.groundTruth.icdCodes.length} ICD codes)`);
    }

    return scenarios;
}

/**
 * Load a specific scenario by ID or difficulty
 */
export function loadScenario(idOrDifficulty: string): Scenario | undefined {
    const all = loadAllScenarios();
    return all.find(s => s.id === idOrDifficulty || s.difficulty === idOrDifficulty);
}

/**
 * Load medical fixer test cases
 */
export function loadMedicalFixerCases(): MedicalFixerCase[] {
    const filepath = path.join(TEST_DATA_DIR, 'medical-fixer-cases.json');
    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    console.log(`📂 Loaded ${data.cases.length} medical fixer test cases`);
    return data.cases;
}

/**
 * Build benchmark input data from a scenario for a specific task
 */
export function buildTaskInput(scenario: Scenario, taskId: string): Record<string, any> {
    switch (taskId) {
        case 'role-detection':
            return {
                segments: scenario.segments.map(s => ({ text: s.text })),
            };

        case 'medical-fixer':
            // Use first medical fix case from the scenario
            const fixCase = scenario.groundTruth.medicalFix[0];
            return {
                input: fixCase?.input || '',
            };

        case 'soap-generation':
            return {
                transcript: scenario.transcript,
            };

        case 'icd-coding':
            return {
                assessment: scenario.groundTruth.soap.assessment,
                subjective: scenario.groundTruth.soap.subjective,
            };

        case 'expert-advice':
            return {
                subjective: scenario.groundTruth.soap.subjective,
                objective: scenario.groundTruth.soap.objective,
                assessment: scenario.groundTruth.soap.assessment,
                plan: scenario.groundTruth.soap.plan,
                ragContext: '(Không có y văn tham khảo trong benchmark mode)',
            };

        default:
            return { transcript: scenario.transcript };
    }
}

/**
 * Get ground truth for a specific task from a scenario
 */
export function getGroundTruth(scenario: Scenario, taskId: string): Record<string, any> {
    switch (taskId) {
        case 'role-detection':
            return {
                roles: scenario.groundTruth.roleDetection.roles,
            };

        case 'medical-fixer':
            const fixCase = scenario.groundTruth.medicalFix[0];
            return {
                medicalFixExpected: fixCase?.expected || '',
            };

        case 'soap-generation':
            return {
                soap: scenario.groundTruth.soap,
            };

        case 'icd-coding':
            return {
                icdCodes: scenario.groundTruth.icdCodes,
            };

        case 'expert-advice':
            return {
                medicalAdvice: scenario.groundTruth.medicalAdvice,
            };

        default:
            return {};
    }
}
