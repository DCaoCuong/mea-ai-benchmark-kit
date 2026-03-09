/**
 * MEA STT Benchmark Runner (Phase 03)
 * Runs STT engines on medical scenarios and calculates WER/MTA
 * 
 * Usage:
 *   npx ts-node --project benchmarks/tsconfig.json benchmarks/run-stt-benchmark.ts --engine=whisperx --variant=small
 *   npx ts-node --project benchmarks/tsconfig.json benchmarks/run-stt-benchmark.ts --engine=all --runs=3
 */

import * as path from 'path';
import { WhisperXEngine, MoonshineEngine, ParakeetEngine, WhisperLiveEngine, MockSttEngine, SttEngine } from './utils/stt-engines';
import { calculateWer, calculateMedicalAccuracy } from './utils/metrics-stt';
import { loadAllScenarios, Scenario } from './utils/scenario-loader';
import { saveReport, printSttSummaryTable, computeStats } from './utils/reporter';
import { STT_CANDIDATES } from './config/models';
import { SttBenchmarkResult, SttCallMetrics } from './types';

// ─── CLI Argument Parser ───

interface CliArgs {
    engine: string;   // engine ID or 'all'
    variant: string;  // variant name or 'all'
    runs: number;     // number of runs per scenario
    mock: boolean;    // use mock engine for pipeline testing
    help: boolean;
}

function parseArgs(): CliArgs {
    const args = { engine: 'all', variant: 'all', runs: 3, mock: false, help: false };
    for (const arg of process.argv.slice(2)) {
        if (arg === '--help' || arg === '-h') args.help = true;
        else if (arg === '--mock') args.mock = true;
        else if (arg.startsWith('--engine=')) args.engine = arg.split('=')[1]!;
        else if (arg.startsWith('--variant=')) args.variant = arg.split('=')[1]!;
        else if (arg.startsWith('--runs=')) args.runs = parseInt(arg.split('=')[1]!, 10) || 3;
    }
    return args;
}

// ─── Main Logic ───

async function runBenchmarkForEngine(
    engine: SttEngine,
    scenario: Scenario,
    numRuns: number
): Promise<SttBenchmarkResult> {
    const runs: Array<{ runIndex: number; timestamp: string; metrics: SttCallMetrics }> = [];
    const werScores: number[] = [];
    const mtaScores: number[] = [];
    const latencies: number[] = [];

    console.log(`\n  🎯 Testing ${engine.name}/${engine.variant} on ${scenario.id}...`);

    for (let i = 0; i < numRuns; i++) {
        process.stdout.write(`    (${i + 1}/${numRuns}) Transcribing... `);

        // Auto-detect audio file extension (.mp3, .wav, etc.)
        const audioDir = path.join(__dirname, 'test-data', 'audio');
        const possibleExts = ['.mp3', '.wav', '.m4a', '.ogg'];
        let audioPath = '';
        for (const ext of possibleExts) {
            const candidate = path.join(audioDir, `${scenario.id}${ext}`);
            if (require('fs').existsSync(candidate)) {
                audioPath = candidate;
                break;
            }
        }
        if (!audioPath) {
            console.log(`❌ No audio file found for ${scenario.id} in ${audioDir}`);
            continue;
        }
        console.log(`      📂 Path: ${audioPath}`);
        
        const metrics = await engine.transcribe({
            audioPath,
            language: 'vi'
        });

        // If text is returned, calculate scores
        if (!metrics.error && metrics.transcribedText) {
            const wer = calculateWer(scenario.transcript, metrics.transcribedText);
            const mta = calculateMedicalAccuracy(metrics.transcribedText, scenario.groundTruth.medicalTerms);

            werScores.push(wer);
            mtaScores.push(mta.score);
            latencies.push(metrics.latencyMs);

            console.log(`✅ WER=${(wer * 100).toFixed(1)}%, MTA=${mta.score}%, Latency=${metrics.latencyMs}ms`);
        } else {
            console.log(`❌ Error: ${metrics.error || 'No text output'}`);
        }

        runs.push({
            runIndex: i,
            timestamp: new Date().toISOString(),
            metrics: {
                ...metrics,
                wer: !metrics.error && metrics.transcribedText ? calculateWer(scenario.transcript, metrics.transcribedText) : undefined,
                medicalTermAccuracy: !metrics.error && metrics.transcribedText ? calculateMedicalAccuracy(metrics.transcribedText, scenario.groundTruth.medicalTerms).score : undefined
            }
        });
    }

    const avgWer = werScores.length > 0 ? werScores.reduce((a, b) => a + b, 0) / werScores.length : 1;
    const avgMta = mtaScores.length > 0 ? mtaScores.reduce((a, b) => a + b, 0) / mtaScores.length : 0;
    const latencyStats = computeStats(latencies);

    return {
        engine: engine.name,
        variant: engine.variant,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        runs,
        summary: {
            avgLatencyMs: latencyStats.avg,
            avgRtf: latencyStats.avg / (scenario.metadata.estimatedAudioLengthSeconds * 1000 || 1),
            avgWer,
            avgMedicalTermAccuracy: avgMta,
            errorRate: Math.round(((numRuns - werScores.length) / numRuns) * 100)
        }
    };
}

async function main() {
    const args = parseArgs();
    if (args.help) {
        console.log("STT Benchmark CLI usage: --engine=<engine|all> --variant=<variant|all> --runs=<N> --mock");
        return;
    }

    const scenarios = loadAllScenarios();
    const engines: SttEngine[] = [];

    if (args.mock) {
        engines.push(new MockSttEngine());
    } else if (args.engine === 'all') {
        engines.push(new WhisperXEngine('small'));
        engines.push(new WhisperXEngine('medium'));
        // engines.push(new MoonshineEngine('moonshine-base')); // Disabled if server not up
    } else {
        // Single engine selection
        if (args.engine === 'whisperx') engines.push(new WhisperXEngine(args.variant === 'all' ? 'small' : args.variant));
        if (args.engine === 'moonshine') engines.push(new MoonshineEngine(args.variant === 'all' ? 'moonshine-base' : args.variant));
        if (args.engine === 'parakeet') engines.push(new ParakeetEngine(args.variant === 'all' ? 'parakeet-ctc-0.6b-vi' : args.variant));
        if (args.engine === 'whisperlive' || args.engine === 'whisper-live') engines.push(new WhisperLiveEngine(args.variant === 'all' ? 'small' : args.variant));
    }

    console.log(`\n🚀 Starting STT Benchmark with ${engines.length} engines on ${scenarios.length} scenarios...`);

    const allResults: SttBenchmarkResult[] = [];
    for (const engine of engines) {
        for (const scenario of scenarios) {
            const result = await runBenchmarkForEngine(engine, scenario, args.runs);
            allResults.push(result);
        }
    }

    printSttSummaryTable(allResults);
    const reportPath = saveReport('stt-benchmark', 'stt', allResults);
    console.log(`\n📄 Report saved to: ${reportPath}`);
}

main().catch(err => {
    console.error("STT Benchmark Error:", err);
    process.exit(1);
});
