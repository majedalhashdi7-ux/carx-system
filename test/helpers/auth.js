// Authentication Test Helpers
const jwt = require('jsonwebtoken');

/**
 * Generate test JWT token
 */
function generateToken(userId, role = 'client', permissions = null) {
    const secret = process.env.JWT_SECRET || 'test-secret-key';
    
    // Default permissions based on role if not provided
    let userPermissions = permissions;
    if (!userPermissions) {
        if (role === 'admin') {
            userPermissions = [
                'manage_users', 'manage_settings', 'manage_footer', 
                'manage_whatsapp', 'manage_cars', 'manage_parts', 
                'manage_auctions', 'manage_concierge', 'manage_orders', 
                'manage_brands', 'manage_messages', 'manage_notifications', 
                'view_analytics', 'manage_content'
            ];
        } else if (role === 'super_admin') {
            userPermissions = ['super_admin'];
        } else {
            userPermissions = [];
        }
    }

    return jwt.sign(
        { 
            id: userId,
            userId, 
            role,
            permissions: userPermissions,
            tenantId: 'default',
            iat: Math.floor(Date.now() / 1000),
        },
        secret,
        { expiresIn: '1h' }
    );
}

/**
 * Generate admin token
 */
function generateAdminToken(userId, permissions = null) {
    return generateToken(userId, 'admin', permissions);
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
