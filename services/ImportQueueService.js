// [[ARABIC_HEADER]] نظام قائمة انتظار الاستيراد الجماعي - ImportQueueService
// يعالج مئات السيارات بالتوازي مع تتبع الحالة والإشعارات اللحظية

'use strict';

const { EventEmitter } = require('events');

/**
 * حالات المهمة
 */
const JOB_STATUS = {
    PENDING:    'pending',
    PROCESSING: 'processing',
    DONE:       'done',
    FAILED:     'failed',
    SKIPPED:    'skipped',
};

/**
 * مهمة استيراد واحدة
 */
class ImportJob {
    constructor(id, data, processor) {
        this.id        = id;
        this.data      = data;
        this.processor = processor;
        this.status    = JOB_STATUS.PENDING;
        this.attempts  = 0;
        this.maxRetries = 3;
        this.result    = null;
        this.error     = null;
        this.startedAt = null;
        this.endedAt   = null;
    }
}

/**
 * محرك قائمة الانتظار الرئيسي
 */
class ImportQueueService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.concurrency = options.concurrency || 3;   // عدد المهام المتوازية
        this.retryDelay  = options.retryDelay  || 2000; // تأخير بين المحاولات (ms)
        this.queue       = [];
        this.active      = [];
        this.completed   = [];
        this.failed      = [];
        this.isPaused    = false;
        this._jobIdCounter = 0;
    }

    // ─── إضافة مهمة فردية ────────────────────────────────────────────────────
    addJob(data, processor) {
        const job = new ImportJob(++this._jobIdCounter, data, processor);
        this.queue.push(job);
        this.emit('job:added', job);
        this._tick();
        return job;
    }

    // ─── إضافة دفعة مهام ─────────────────────────────────────────────────────
    addBatch(items, processor) {
        const jobs = items.map(data => {
            const job = new ImportJob(++this._jobIdCounter, data, processor);
            this.queue.push(job);
            return job;
        });
        this.emit('batch:added', { count: jobs.length });
        this._tick();
        return jobs;
    }

    // ─── إيقاف مؤقت ──────────────────────────────────────────────────────────
    pause() {
        this.isPaused = true;
        this.emit('paused');
        console.log('⏸️ [ImportQueue] Queue paused');
    }

    // ─── استئناف ─────────────────────────────────────────────────────────────
    resume() {
        this.isPaused = false;
        this.emit('resumed');
        console.log('▶️ [ImportQueue] Queue resumed');
        this._tick();
    }

    // ─── الحالة الكاملة ───────────────────────────────────────────────────────
    getStatus() {
        const total = this._jobIdCounter;
        const done  = this.completed.length;
        const fail  = this.failed.length;
        const active = this.active.length;
        const pending = this.queue.filter(j => j.status === JOB_STATUS.PENDING).length;
        const percent = total > 0 ? Math.round((done + fail) / total * 100) : 0;

        return {
            total,
            pending,
            active,
            completed: done,
            failed: fail,
            percent,
            isPaused: this.isPaused,
            isIdle: active === 0 && pending === 0,
            recentCompleted: this.completed.slice(-5).map(j => ({
                id: j.id,
                result: j.result,
                duration: j.endedAt && j.startedAt
                    ? Math.round((j.endedAt - j.startedAt) / 1000) + 's'
                    : '?',
            })),
            recentFailed: this.failed.slice(-5).map(j => ({
                id: j.id,
                error: j.error,
                attempts: j.attempts,
            })),
        };
    }

    // ─── إعادة تعيين كاملة ────────────────────────────────────────────────────
    reset() {
        this.queue    = [];
        this.active   = [];
        this.completed = [];
        this.failed    = [];
        this._jobIdCounter = 0;
        this.isPaused  = false;
        this.emit('reset');
    }

    // ─── المحرك الداخلي ───────────────────────────────────────────────────────
    _tick() {
        if (this.isPaused) return;

        while (this.active.length < this.concurrency && this.queue.length > 0) {
            const job = this.queue.shift();
            if (!job || job.status !== JOB_STATUS.PENDING) continue;
            this._runJob(job);
        }
    }

    async _runJob(job) {
        job.status    = JOB_STATUS.PROCESSING;
        job.startedAt = Date.now();
        job.attempts++;
        this.active.push(job);

        this.emit('job:start', job);

        try {
            const result = await job.processor(job.data, job);
            job.result  = result;
            job.status  = JOB_STATUS.DONE;
            job.endedAt = Date.now();

            this._removeFromActive(job);
            this.completed.push(job);
            this.emit('job:done', job);
            this.emit('progress', this.getStatus());

        } catch (err) {
            job.error = err.message || String(err);

            if (job.attempts < job.maxRetries) {
                // إعادة المحاولة بعد تأخير
                job.status = JOB_STATUS.PENDING;
                this._removeFromActive(job);
                this.emit('job:retry', { job, attempt: job.attempts });

                await new Promise(r => setTimeout(r, this.retryDelay * job.attempts));
                this.queue.unshift(job); // أعد للقائمة في المقدمة
                this.emit('progress', this.getStatus());

            } else {
                job.status  = JOB_STATUS.FAILED;
                job.endedAt = Date.now();
                this._removeFromActive(job);
                this.failed.push(job);
                this.emit('job:failed', job);
                this.emit('progress', this.getStatus());
            }
        }

        // تشغيل المهمة التالية
        this._tick();

        // إشعار بالاكتمال
        if (this.active.length === 0 && this.queue.length === 0) {
            this.emit('queue:done', this.getStatus());
        }
    }

    _removeFromActive(job) {
        const idx = this.active.indexOf(job);
        if (idx !== -1) this.active.splice(idx, 1);
    }
}

// ─── مثيل مشترك عام لكل نظام الاستيراد ──────────────────────────────────────
const globalQueue = new ImportQueueService({ concurrency: 3, retryDelay: 2000 });

// طباعة إحصائيات عند الاكتمال
globalQueue.on('queue:done', (status) => {
    console.log(`\n🏁 [ImportQueue] DONE — ✅ ${status.completed} succeeded | ❌ ${status.failed} failed`);
});

globalQueue.on('job:retry', ({ job, attempt }) => {
    console.log(`🔄 [ImportQueue] Job #${job.id} retry #${attempt}: ${job.error}`);
});

module.exports = { ImportQueueService, globalQueue, JOB_STATUS };
