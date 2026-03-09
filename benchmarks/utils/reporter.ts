/**
 * Benchmark Reporter
 * Saves benchmark results as JSON files and prints summary tables
 */
import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkReport, TaskBenchmarkResult, SttBenchmarkResult } from '../types/index';
import { HARDWARE_INFO } from '../config/models';

// Reports directory: plan folder
const REPORTS_DIR = path.resolve(__dirname, '..', '..', '..', 'plan', '260302-0948-local-model-benchmarking', 'reports');

// Fallback: in benchmarks folder itself
const FALLBACK_REPORTS_DIR = path.resolve(__dirname, '..', 'reports');

function getReportsDir(): string {
    if (fs.existsSync(REPORTS_DIR)) {
        return REPORTS_DIR;
    }
    // Create fallback dir
    if (!fs.existsSync(FALLBACK_REPORTS_DIR)) {
        fs.mkdirSync(FALLBACK_REPORTS_DIR, { recursive: true });
    }
    return FALLBACK_REPORTS_DIR;
}

/**
 * Generate timestamped filename
 */
function generateFilename(prefix: string): string {
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    return `${prefix}-${ts}.json`;
}

/**
 * Save benchmark results to JSON file
 */
export function saveReport(
    name: string,
    type: 'llm' | 'stt' | 'embedding',
    results: TaskBenchmarkResult[] | SttBenchmarkResult[] | any[],
): string {
    const dir = getReportsDir();
    const filename = generateFilename(name);
    const filepath = path.join(dir, filename);

    const report: BenchmarkReport = {
        id: `${name}-${Date.now()}`,
        type,
        createdAt: new Date().toISOString(),
        hardware: HARDWARE_INFO,
        results,
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n📄 Report saved: ${filepath}`);
    return filepath;
}

/**
 * Print LLM benchmark summary table to console
 */
export function printLlmSummaryTable(results: TaskBenchmarkResult[]): void {
    console.log('\n' + '═'.repeat(100));
    console.log('📊 LLM BENCHMARK RESULTS');
    console.log('═'.repeat(100));

    // Group by task
    const byTask = new Map<string, TaskBenchmarkResult[]>();
    for (const r of results) {
        const existing = byTask.get(r.taskName) || [];
        existing.push(r);
        byTask.set(r.taskName, existing);
    }

    for (const [taskName, taskResults] of byTask) {
        console.log(`\n🎯 Task: ${taskName}`);
        console.log('─'.repeat(90));
        console.log(
            padRight('Model', 20) +
            padRight('Latency(ms)', 13) +
            padRight('Tokens', 10) +
            padRight('JSON OK', 10) +
            padRight('Errors', 10) +
            padRight('Score', 10)
        );
        console.log('─'.repeat(90));

        // Sort by accuracy score descending
        const sorted = [...taskResults].sort(
            (a, b) => (b.summary.accuracyScore ?? 0) - (a.summary.accuracyScore ?? 0)
        );

        for (const r of sorted) {
            const s = r.summary;
            console.log(
                padRight(r.model, 20) +
                padRight(`${s.avgLatencyMs}`, 13) +
                padRight(`${s.avgPromptTokens}+${s.avgCompletionTokens}`, 10) +
                padRight(`${s.jsonComplianceRate}%`, 10) +
                padRight(`${s.errorRate}%`, 10) +
                padRight(s.accuracyScore !== undefined ? `${s.accuracyScore}` : 'N/A', 10)
            );
        }
    }

    console.log('\n' + '═'.repeat(100));
}

/**
 * Print STT benchmark summary table to console
 */
export function printSttSummaryTable(results: SttBenchmarkResult[]): void {
    console.log('\n' + '═'.repeat(110));
    console.log('📊 STT BENCHMARK RESULTS');
    console.log('═'.repeat(110));
    console.log(
        padRight('Engine/Variant', 28) +
        padRight('WER(%)', 10) +
        padRight('RTF', 8) +
        padRight('Latency(ms)', 13) +
        padRight('Med.Term%', 12) +
        padRight('Errors', 10) +
        padRight('Diarize', 10)
    );
    console.log('─'.repeat(110));

    // Sort by WER ascending
    const sorted = [...results].sort((a, b) => a.summary.avgWer - b.summary.avgWer);

    for (const r of sorted) {
        const s = r.summary;
        const label = `${r.engine}/${r.variant}`;
        console.log(
            padRight(label, 28) +
            padRight(`${(s.avgWer * 100).toFixed(1)}`, 10) +
            padRight(`${s.avgRtf.toFixed(2)}`, 8) +
            padRight(`${s.avgLatencyMs}`, 13) +
            padRight(`${s.avgMedicalTermAccuracy.toFixed(0)}`, 12) +
            padRight(`${s.errorRate}%`, 10) +
            padRight(r.runs[0]?.metrics?.diarizationAvailable ? '✅' : '❌', 10)
        );
    }

    console.log('═'.repeat(110));
}

/**
 * Compute summary statistics from an array of numbers
 */
export function computeStats(values: number[]): { avg: number; min: number; max: number; std: number } {
    if (values.length === 0) return { avg: 0, min: 0, max: 0, std: 0 };
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    return {
        avg: Math.round(avg),
        min: Math.round(min),
        max: Math.round(max),
        std: Math.round(std),
    };
}

// ─── Helpers ───

function padRight(str: string, len: number): string {
    return str.substring(0, len).padEnd(len);
}
