/**
 * BenchmarkTimer - High-precision timing utility
 * Uses performance.now() for sub-millisecond accuracy
 */

export class BenchmarkTimer {
    private startTime: number = 0;
    private endTime: number = 0;
    private running: boolean = false;

    /** Start the timer */
    begin(): void {
        this.startTime = performance.now();
        this.running = true;
    }

    /** Stop the timer and return elapsed milliseconds */
    end(): number {
        this.endTime = performance.now();
        this.running = false;
        return this.elapsedMs();
    }

    /** Get elapsed time in milliseconds (rounded) */
    elapsedMs(): number {
        const end = this.running ? performance.now() : this.endTime;
        return Math.round(end - this.startTime);
    }

    /** Get elapsed time in seconds (2 decimal places) */
    elapsedSeconds(): number {
        return Number((this.elapsedMs() / 1000).toFixed(2));
    }

    /** Static helper: time an async function */
    static async measure<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
        const start = performance.now();
        const result = await fn();
        const latencyMs = Math.round(performance.now() - start);
        return { result, latencyMs };
    }
}
