// Unit Tests for Auth Middleware
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const {
    generateToken,
    verifyToken,
    authenticateJWT,
    requireRole,
    requireAuthAPI,
    requirePermissionAPI,
    requireAdmin
} = require('../../../middleware/auth');

describe('Auth Middleware - Unit Tests', () => {
    let req, res, next;
    const initialEnv = process.env.NODE_ENV;
    const initialSecret = process.env.JWT_SECRET;
    const initialExpiry = process.env.JWT_EXPIRES_IN;

    beforeEach(() => {
        process.env.NODE_ENV = 'test';
        req = {
            tenantModels: { User: { findOne: sinon.stub().resolves({ _id: '123', role: 'buyer', status: 'active', tokenVersion: 0 }) } },
            headers: {},
            session: {},
            user: null
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis(),
            redirect: sinon.stub().returnsThis(),
            send: sinon.stub().returnsThis()
        };
        next = sinon.stub();
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.JWT_EXPIRES_IN = '7d';
    });

    afterEach(() => {
        sinon.restore();
        if (initialEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = initialEnv;
        if (initialSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = initialSecret;
        if (initialExpiry === undefined) delete process.env.JWT_EXPIRES_IN; else process.env.JWT_EXPIRES_IN = initialExpiry;
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', async () => {
            const user = {
                _id: '123',
                email: 'test@example.com',
                phone: '+1234567890',
                role: 'buyer',
                permissions: ['view_cars']
            };

            const token = generateToken(user);

            expect(token).to.be.a('string');
            expect(token.split('.')).to.have.lengthOf(3); // JWT format
        });

        it('should include user data in token payload', async () => {
            const user = {
                _id: '123',
                email: 'test@example.com',
                role: 'admin',
                permissions: ['manage_users']
            };

            const token = generateToken(user);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            expect(decoded.id).to.equal('123');
            expect(decoded.email).to.equal('test@example.com');
            expect(decoded.role).to.equal('admin');
            expect(decoded.permissions).to.deep.equal(['manage_users']);
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', async () => {
            const user = { _id: '123', email: 'test@example.com', role: 'buyer' };
            const token = generateToken(user);

            const decoded = verifyToken(token);

            expect(decoded).to.not.be.null;
            expect(decoded.id).to.equal('123');
        });

        it('should return null for invalid token', async () => {
            const decoded = verifyToken('invalid-token');
            expect(decoded).to.be.null;
        });

        it('should return null for expired token', async () => {
            const expiredToken = jwt.sign(
                { id: '123' },
                process.env.JWT_SECRET,
                { expiresIn: '-1s' }
            );

            const decoded = verifyToken(expiredToken);
            expect(decoded).to.be.null;
        });
    });

    describe('authenticateJWT', () => {
        it('should authenticate with valid Bearer token', async () => {
            const user = { _id: '123', email: 'test@example.com', role: 'buyer' };
            const token = generateToken(user);
            req.headers.authorization = `Bearer ${token}`;

            await authenticateJWT(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(req.user).to.exist;
            expect(req.user.id).to.equal('123');
        });

        it('should reject request without authorization header', async () => {
            await authenticateJWT(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should reject request with invalid token format', async () => {
            req.headers.authorization = 'InvalidFormat token123';

            await authenticateJWT(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should reject request with invalid token', async () => {
            req.headers.authorization = 'Bearer invalid-token';

            await authenticateJWT(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });
    });

    describe('requireRole', () => {
        it('should allow user with correct role', async () => {
            req.user = { role: 'admin' };
            const middleware = requireRole('admin');

            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
        });

        it('should allow admin for any role', async () => {
            req.user = { role: 'admin' };
            const middleware = requireRole('buyer');

            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
        });

        it('should allow super_admin for any role', async () => {
            req.user = { role: 'super_admin' };
            const middleware = requireRole('buyer', 'seller');

            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
        });

        it('should reject user without correct role', async () => {
            req.user = { role: 'buyer' };
            const middleware = requireRole('admin');

            middleware(req, res, next);

            expect(res.status.calledWith(403)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should reject unauthenticated user', async () => {
            const middleware = requireRole('admin');

            middleware(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should handle multiple roles', async () => {
            req.user = { role: 'seller' };
            const middleware = requireRole('buyer', 'seller');

            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
        });
    });

    describe('requireAuthAPI', () => {
        it('should authenticate with JWT token', async () => {
            const user = { _id: '123', role: 'buyer' };
            const token = generateToken(user);
            req.headers.authorization = `Bearer ${token}`;

            await requireAuthAPI(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(req.user).to.exist;
        });

        it('should fallback to session if no JWT', async () => {
            req.session.user = { id: '123', role: 'buyer' };

            await requireAuthAPI(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(req.user).to.include({ id: '123', role: 'buyer' });
        });

        it('should reject without JWT or session', async () => {
            await requireAuthAPI(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });
    });

    describe('requirePermissionAPI', () => {
        it('should allow super_admin without specific permission', async () => {
            req.user = { role: 'super_admin', permissions: [] };
            const middleware = requirePermissionAPI('manage_users');

            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
        });

        it('should allow user with required permission', async () => {
            req.user = { role: 'admin', permissions: ['manage_users'] };
            const middleware = requirePermissionAPI('manage_users');

            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
        });

        it('should reject user without required permission', async () => {
            // Admin always has all permissions — use a non-admin role to test rejection
            req.user = { role: 'seller', permissions: ['view_analytics'] };
            const middleware = requirePermissionAPI('manage_users');

            middleware(req, res, next);

            expect(res.status.calledWith(403)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should reject unauthenticated user', async () => {
            const middleware = requirePermissionAPI('manage_users');

            middleware(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(next.called).to.be.false;
        });
    });

    describe('requireAdmin', () => {
        it('should allow admin user', async () => {
            req.user = { role: 'admin' };

            requireAdmin(req, res, next);

            expect(next.calledOnce).to.be.true;
        });

        it('should allow super_admin user', async () => {
            req.user = { role: 'super_admin' };

            requireAdmin(req, res, next);

            expect(next.calledOnce).to.be.true;
        });

        it('should reject non-admin user for API routes', async () => {
            req.user = { role: 'buyer' };
            req.originalUrl = '/api/admin/users';

            requireAdmin(req, res, next);

            expect(res.status.calledWith(403)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('should redirect unauthenticated user for web routes', async () => {
            req.originalUrl = '/admin/dashboard';

            requireAdmin(req, res, next);

            expect(res.redirect.calledWith('/auth/login')).to.be.true;
            expect(next.called).to.be.false;
        });
    });
});
