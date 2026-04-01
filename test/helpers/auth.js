// Authentication Test Helpers
const jwt = require('jsonwebtoken');

/**
 * Generate test JWT token
 */
function generateToken(userId, role = 'client') {
    const secret = process.env.JWT_SECRET || 'test-secret-key';
    
    return jwt.sign(
        { 
            userId, 
            role,
            iat: Math.floor(Date.now() / 1000),
        },
        secret,
        { expiresIn: '1h' }
    );
}

/**
 * Generate admin token
 */
function generateAdminToken(userId) {
    return generateToken(userId, 'admin');
}

/**
 * Create auth header for requests
 */
function createAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
}

/**
 * Login helper for tests
 */
async function loginUser(request, credentials) {
    const response = await request
        .post('/api/v2/auth/login')
        .send(credentials);
    
    return response.body.token;
}

/**
 * Create authenticated request
 */
function authenticatedRequest(request, token) {
    return {
        get: (url) => request.get(url).set('Authorization', `Bearer ${token}`),
        post: (url) => request.post(url).set('Authorization', `Bearer ${token}`),
        put: (url) => request.put(url).set('Authorization', `Bearer ${token}`),
        patch: (url) => request.patch(url).set('Authorization', `Bearer ${token}`),
        delete: (url) => request.delete(url).set('Authorization', `Bearer ${token}`),
    };
}

module.exports = {
    generateToken,
    generateAdminToken,
    createAuthHeader,
    loginUser,
    authenticatedRequest,
};
