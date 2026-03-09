/**
 * MEA Benchmark CLI Runner
 * 
 * Usage:
 *   npx ts-node --project benchmarks/tsconfig.json benchmarks/run-benchmark.ts --help
 *   npx ts-node --project benchmarks/tsconfig.json benchmarks/run-benchmark.ts --task=role-detection --model=qwen3:4b
 *   npx ts-node --project benchmarks/tsconfig.json benchmarks/run-benchmark.ts --task=soap-generation --models=all --runs=3
 *   npx ts-node --project benchmarks/tsconfig.json benchmarks/run-benchmark.ts --task=all --model=gemma2:2b
 */

import { benchmarkOllamaCall, checkOllamaHealth, listOllamaModels, warmUpModel, extractJSON } from './utils/ollama-client';
import { saveReport, printLlmSummaryTable, computeStats } from './utils/reporter';
import { LLM_CANDIDATES } from './config/models';
import { ALL_LLM_TASKS, getTaskById, TaskConfig } from './config/tasks';
import { TaskBenchmarkResult, BenchmarkRunResult, LlmCallMetrics } from './types/index';
import { loadAllScenarios, loadScenario, buildTaskInput, getGroundTruth, Scenario } from './utils/scenario-loader';

// ─── CLI Argument Parser ───

interface CliArgs {
    task: string;      // task ID or 'all'
    model: string;     // model name or 'all'
    runs: number;      // number of runs per scenario
    scenario: string;  // scenario ID or difficulty or 'all'
    help: boolean;
}

function parseArgs(): CliArgs {
    const args: CliArgs = {
        task: 'all',
        model: 'all',
        runs: 3,
        scenario: 'all',
        help: false,
    };

    for (const arg of process.argv.slice(2)) {
        if (arg === '--help' || arg === '-h') {
            args.help = true;
        } else if (arg.startsWith('--task=')) {
            args.task = arg.split('=')[1]!;
        } else if (arg.startsWith('--model=')) {
            args.model = arg.split('=')[1]!;
        } else if (arg.startsWith('--models=')) {
            args.model = arg.split('=')[1]!;
        } else if (arg.startsWith('--runs=')) {
            args.runs = parseInt(arg.split('=')[1]!, 10) || 3;
        } else if (arg.startsWith('--scenario=')) {
            args.scenario = arg.split('=')[1]!;
        }
    }

    return args;
}

function printHelp(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           MEA Benchmark CLI - Local Model Testing           ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  npx ts-node --project benchmarks/tsconfig.json benchmarks/run-benchmark.ts [options]

Options:
  --task=<id|all>      Task to benchmark (default: all)
                       Available: role-detection, medical-fixer, soap-generation,
                                  icd-coding, expert-advice, all
  --model=<name|all>   Model to test (default: all)
                       Examples: gemma2:2b, qwen3:4b, all
  --runs=<N>           Number of runs per scenario (default: 3)
  --scenario=<id|diff> Scenario to use (default: all)
                       Use scenario ID (scenario-001) or difficulty (easy, medium, hard)
  --help, -h           Show this help

Examples:
  # Quick test: 1 model, 1 task, 1 scenario (easy)
  npx ts-node --project benchmarks/tsconfig.json benchmarks/run-benchmark.ts \\
    --task=role-detection --model=gemma2:2b --runs=1 --scenario=easy

  # Full benchmark: all models, all tasks, all scenarios
  npx ts-node --project benchmarks/tsconfig.json benchmarks/run-benchmark.ts \\
    --task=all --model=all --runs=3 --scenario=all
  `);
}

// ─── Scoring Functions ───

function scoreRoleDetection(predicted: string[], groundTruth: string[]): number {
    if (!predicted || !predicted.length || !groundTruth || !groundTruth.length) return 0;
    const minLen = Math.min(predicted.length, groundTruth.length);
    let correct = 0;
    for (let i = 0; i < minLen; i++) {
        const p = String(predicted[i] || '').trim().toLowerCase();
        const g = String(groundTruth[i] || '').trim().toLowerCase();
        if (p.includes(g) || g.includes(p)) correct++;
    }
    return Math.round((correct / groundTruth.length) * 100);
}

function scoreMedicalFixer(predicted: string, expected: string): number {
    const a = predicted.trim().toLowerCase().replace(/[.,!?;:\"\'`]/g, '');
    const b = expected.trim().toLowerCase().replace(/[.,!?;:\"\'`]/g, '');
    if (a === b) return 100;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 100;
    const dist = levenshtein(a, b);
    return Math.round(((maxLen - dist) / maxLen) * 100);
}

function scoreIcdCoding(predicted: string[], groundTruth: string[]): number {
    if (!groundTruth || !groundTruth.length) return predicted.length === 0 ? 100 : 0;

    const cleanCode = (c: string) => c.split('-')[0]!.split(' ')[0]!.trim().toUpperCase().replace(/[.]/g, '');
    const predCodes = predicted.map(cleanCode);
    const gtCodes = groundTruth.map(cleanCode);

    let found = 0;
    for (const gt of gtCodes) {
        if (predCodes.some(p => p === gt || p.startsWith(gt) || gt.startsWith(p))) {
            found++;
        }
    }
    return Math.round((found / gtCodes.length) * 100);
}

function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// ─── Core Benchmark Logic ───

async function runSingleBenchmark(
    task: TaskConfig,
    model: string,
    scenario: Scenario
): Promise<{ metrics: LlmCallMetrics; accuracyScore: number }> {
    const taskInput = buildTaskInput(scenario, task.id);
    const groundTruth = getGroundTruth(scenario, task.id);

    const prompt = task.buildPrompt(taskInput);
    const isJson = task.expectedOutputFormat === 'json';

    const metrics = await benchmarkOllamaCall({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        jsonMode: isJson,
    });

    let accuracyScore = 0;
    if (!metrics.error) {
        switch (task.id) {
            case 'role-detection': {
                try {
                    const content = extractJSON(metrics.content);
                    const parsed = JSON.parse(content);
                    const roles = parsed.roles || [];
                    accuracyScore = scoreRoleDetection(roles, groundTruth.roles || []);
                } catch (e) {
                    accuracyScore = 0;
                }
                break;
            }
            case 'medical-fixer': {
                accuracyScore = scoreMedicalFixer(metrics.content, groundTruth.medicalFixExpected || '');
                break;
            }
            case 'icd-coding': {
                try {
                    const content = extractJSON(metrics.content);
                    const parsed = JSON.parse(content);
                    const codes = Array.isArray(parsed) ? parsed : (parsed.codes || []);
                    accuracyScore = scoreIcdCoding(codes.map(String), groundTruth.icdCodes || []);
                } catch (e) {
                    accuracyScore = 0;
                }
                break;
            }
            case 'soap-generation': {
                try {
                    const content = extractJSON(metrics.content);
                    const parsed = JSON.parse(content);
                    let score = 0;
                    if (parsed.subjective && parsed.subjective.length > 20) score += 25;
                    if (parsed.objective && parsed.objective.length > 10) score += 25;
                    if (parsed.assessment && parsed.assessment.length > 5) score += 25;
                    if (parsed.plan && parsed.plan.length > 20) score += 25;
                    accuracyScore = score;
                } catch (e) {
                    accuracyScore = 0;
                }
                break;
            }
            case 'expert-advice': {
                const text = metrics.content;
                let score = 0;
                if (text.length > 100) score += 40;
                if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệ]/i.test(text)) score += 30;
                if (text.includes('\n') || text.includes('-') || text.includes('•')) score += 30;
                accuracyScore = Math.min(100, score);
                break;
            }
        }
    }

    return { metrics, accuracyScore };
}

async function benchmarkTaskModel(
    task: TaskConfig,
    model: string,
    scenario: Scenario,
    numRuns: number,
): Promise<TaskBenchmarkResult> {
    const runs: BenchmarkRunResult[] = [];

    console.log(`\n    🎯 ${task.name} × ${model} (Scenario: ${scenario.name})`);

    const accuracyScores: number[] = [];

    for (let i = 0; i < numRuns; i++) {
        process.stdout.write(`      Run ${i + 1}/${numRuns}... `);
        const { metrics, accuracyScore } = await runSingleBenchmark(
            task,
            model,
            scenario
        );

        runs.push({
            runIndex: i,
            timestamp: new Date().toISOString(),
            metrics: { ...metrics, jsonCompliant: metrics.jsonCompliant },
        });

        if (!metrics.error) accuracyScores.push(accuracyScore);

        const status = metrics.error ? `❌ ${metrics.error.substring(0, 30)}` : `✅ ${metrics.latencyMs}ms, score=${accuracyScore}`;
        console.log(status);
    }

    const validRuns = runs.filter((r) => !r.metrics.error);
    const latencies = validRuns.map((r) => r.metrics.latencyMs);
    const latencyStats = computeStats(latencies);

    const avgAccuracy = accuracyScores.length > 0
        ? Math.round(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length)
        : 0;

    return {
        taskName: task.name,
        model,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        runs,
        summary: {
            avgLatencyMs: latencyStats.avg,
            minLatencyMs: latencyStats.min,
            maxLatencyMs: latencyStats.max,
            avgPromptTokens: Math.round(
                validRuns.reduce((s, r) => s + r.metrics.promptTokens, 0) / Math.max(validRuns.length, 1)
            ),
            avgCompletionTokens: Math.round(
                validRuns.reduce((s, r) => s + r.metrics.completionTokens, 0) / Math.max(validRuns.length, 1)
            ),
            jsonComplianceRate: Math.round(
                (validRuns.filter((r) => r.metrics.jsonCompliant).length / Math.max(runs.length, 1)) * 100
            ),
            errorRate: Math.round(
                (runs.filter((r) => r.metrics.error).length / Math.max(runs.length, 1)) * 100
            ),
            accuracyScore: avgAccuracy
        },
    };
}

// ─── Main ───

async function main() {
    const args = parseArgs();

    if (args.help) {
        printHelp();
        process.exit(0);
    }

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           MEA Benchmark Runner v1.1                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`  Task:     ${args.task}`);
    console.log(`  Model:    ${args.model}`);
    console.log(`  Scenario: ${args.scenario}`);
    console.log(`  Runs:     ${args.runs}`);
    console.log('');

    const healthy = await checkOllamaHealth();
    if (!healthy) {
        console.error('❌ Ollama server is not running! Start with: ollama serve');
        process.exit(1);
    }
    console.log('✅ Ollama server is running');

    const availableModels = await listOllamaModels();
    console.log(`📦 Available models: ${availableModels.length}`);

    const tasks: TaskConfig[] = args.task === 'all'
        ? ALL_LLM_TASKS
        : [getTaskById(args.task)].filter(Boolean) as TaskConfig[];

    if (tasks.length === 0) {
        console.error(`❌ Unknown task: ${args.task}`);
        process.exit(1);
    }

    let models: string[];
    if (args.model === 'all') {
        models = LLM_CANDIDATES
            .map((m) => m.name)
            .filter((m) => availableModels.some((a) => a.startsWith(m.split(':')[0])));

        if (models.length === 0) {
            console.error('❌ No benchmark models found in Ollama!');
            process.exit(1);
        }
    } else {
        models = [args.model];
    }

    // Determine scenarios to run
    let scenarios: Scenario[];
    if (args.scenario === 'all') {
        scenarios = loadAllScenarios();
    } else {
        const sc = loadScenario(args.scenario);
        if (!sc) {
            console.error(`❌ Unknown scenario: ${args.scenario}`);
            process.exit(1);
        }
        scenarios = [sc];
    }

    console.log('\n🚀 Starting benchmarks...');
    console.log(`   ${tasks.length} tasks × ${models.length} models × ${scenarios.length} scenarios × ${args.runs} runs\n`);

    const allResults: TaskBenchmarkResult[] = [];

    for (const task of tasks) {
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`📋 Task: ${task.name}`);
        console.log('═'.repeat(60));

        for (const model of models) {
            for (const scenario of scenarios) {
                try {
                    const result = await benchmarkTaskModel(task, model, scenario, args.runs);
                    allResults.push(result);
                } catch (err) {
                    console.error(`  ❌ Failed: ${model} × ${scenario.id} - ${err}`);
                }
            }
        }
    }

    printLlmSummaryTable(allResults);
    const reportPath = saveReport(`llm-benchmark`, 'llm', allResults);

    console.log('\n✅ Benchmark complete!');
    console.log(`📄 Report: ${reportPath}`);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
