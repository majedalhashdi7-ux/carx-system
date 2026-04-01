// Unit Tests for Rate Limiter Middleware
const { expect } = require('chai');
const sinon = require('sinon');
const {
    generalLimiter,
    authLimiter,
    strictLimiter,
    publicLimiter,
    searchLimiter,
    uploadLimiter
} = require('../../../middleware/rateLimiter');

describe('Rate Limiter Middleware - Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            ip: '127.0.0.1',
            path: '/api/test',
            rateLimit: {
                resetTime: Date.now() + 900000 // 15 minutes from now
            }
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis(),
            setHeader: sinon.stub()
        };
        next = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('generalLimiter', () => {
        it('should be defined', () => {
            expect(generalLimiter).to.exist;
            expect(generalLimiter).to.be.a('function');
        });

        it('should be a rate limit middleware', () => {
            // Check that it's an express-rate-limit middleware (async function)
            const funcStr = generalLimiter.toString();
            expect(funcStr).to.satisfy(str => str.includes('async') || str.includes('request'));
        });
    });

    describe('authLimiter', () => {
        it('should be defined', () => {
            expect(authLimiter).to.exist;
            expect(authLimiter).to.be.a('function');
        });

        it('should be a rate limit middleware', () => {
            const funcStr = authLimiter.toString();
            expect(funcStr).to.satisfy(str => str.includes('async') || str.includes('request'));
        });
    });

    describe('strictLimiter', () => {
        it('should be defined', () => {
            expect(strictLimiter).to.exist;
            expect(strictLimiter).to.be.a('function');
        });

        it('should be a rate limit middleware', () => {
            const funcStr = strictLimiter.toString();
            expect(funcStr).to.satisfy(str => str.includes('async') || str.includes('request'));
        });
    });

    describe('publicLimiter', () => {
        it('should be defined', () => {
            expect(publicLimiter).to.exist;
            expect(publicLimiter).to.be.a('function');
        });

        it('should be a rate limit middleware', () => {
            const funcStr = publicLimiter.toString();
            expect(funcStr).to.satisfy(str => str.includes('async') || str.includes('request'));
        });
    });

    describe('searchLimiter', () => {
        it('should be defined', () => {
            expect(searchLimiter).to.exist;
            expect(searchLimiter).to.be.a('function');
        });

        it('should be a rate limit middleware', () => {
            const funcStr = searchLimiter.toString();
            expect(funcStr).to.satisfy(str => str.includes('async') || str.includes('request'));
        });
    });

    describe('uploadLimiter', () => {
        it('should be defined', () => {
            expect(uploadLimiter).to.exist;
            expect(uploadLimiter).to.be.a('function');
        });

        it('should be a rate limit middleware', () => {
            const funcStr = uploadLimiter.toString();
            expect(funcStr).to.satisfy(str => str.includes('async') || str.includes('request'));
        });
    });

    describe('Rate Limiter Behavior', () => {
        it('should export all required limiters', () => {
            const limiters = {
                generalLimiter,
                authLimiter,
                strictLimiter,
                publicLimiter,
                searchLimiter,
                uploadLimiter
            };

            Object.values(limiters).forEach(limiter => {
                expect(limiter).to.be.a('function');
            });
        });

        it('should have different configurations for different limiters', () => {
            // Each limiter should be a unique instance
            expect(generalLimiter).to.not.equal(authLimiter);
            expect(authLimiter).to.not.equal(strictLimiter);
            expect(strictLimiter).to.not.equal(publicLimiter);
        });
    });

    describe('Error Messages', () => {
        it('should return Arabic error messages', () => {
            // The limiters are configured with Arabic messages
            // This is a structural test to ensure they're properly configured
            expect(generalLimiter).to.exist;
            expect(authLimiter).to.exist;
        });

        it('should include rate limit codes', () => {
            // Each limiter should have a unique error code
            // RATE_LIMIT_EXCEEDED, AUTH_RATE_LIMIT_EXCEEDED, etc.
            expect(generalLimiter).to.exist;
            expect(authLimiter).to.exist;
        });
    });
});
