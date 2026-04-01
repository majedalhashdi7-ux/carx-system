/**
 * API Response Helper
 * توحيد صيغة الاستجابات في جميع APIs
 */

/**
 * Success Response
 * @param {*} data - البيانات المراد إرجاعها
 * @param {string} message - رسالة النجاح
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {object} Response object
 */
function successResponse(data = null, message = 'تمت العملية بنجاح', statusCode = 200) {
    return {
        success: true,
        message,
        data,
        statusCode
    };
}

/**
 * Error Response
 * @param {string} message - رسالة الخطأ
 * @param {string} code - كود الخطأ
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {object} errors - تفاصيل الأخطاء (اختياري)
 * @returns {object} Response object
 */
function errorResponse(message = 'حدث خطأ', code = 'ERROR', statusCode = 400, errors = null) {
    const response = {
        success: false,
        message,
        code,
        statusCode
    };
    
    if (errors) {
        response.errors = errors;
    }
    
    return response;
}

/**
 * Validation Error Response
 * @param {object} errors - أخطاء التحقق
 * @param {string} message - رسالة الخطأ
 * @returns {object} Response object
 */
function validationErrorResponse(errors, message = 'خطأ في البيانات المدخلة') {
    return errorResponse(message, 'VALIDATION_ERROR', 400, errors);
}

/**
 * Not Found Response
 * @param {string} resource - المورد غير الموجود
 * @returns {object} Response object
 */
function notFoundResponse(resource = 'المورد') {
    return errorResponse(`${resource} غير موجود`, 'NOT_FOUND', 404);
}

/**
 * Unauthorized Response
 * @param {string} message - رسالة الخطأ
 * @returns {object} Response object
 */
function unauthorizedResponse(message = 'يجب تسجيل الدخول') {
    return errorResponse(message, 'UNAUTHORIZED', 401);
}

/**
 * Forbidden Response
 * @param {string} message - رسالة الخطأ
 * @returns {object} Response object
 */
function forbiddenResponse(message = 'ليس لديك صلاحية للوصول') {
    return errorResponse(message, 'FORBIDDEN', 403);
}

/**
 * Conflict Response
 * @param {string} message - رسالة الخطأ
 * @returns {object} Response object
 */
function conflictResponse(message = 'البيانات موجودة مسبقاً') {
    return errorResponse(message, 'CONFLICT', 409);
}

/**
 * Server Error Response
 * @param {string} message - رسالة الخطأ
 * @param {Error} error - الخطأ الأصلي (للتطوير فقط)
 * @returns {object} Response object
 */
function serverErrorResponse(message = 'خطأ في الخادم', error = null) {
    const response = errorResponse(message, 'SERVER_ERROR', 500);
    
    // إضافة تفاصيل الخطأ في بيئة التطوير فقط
    if (process.env.NODE_ENV === 'development' && error) {
        response.error = error.message;
        response.stack = error.stack;
    }
    
    return response;
}

/**
 * Send Response
 * يرسل الاستجابة مع status code المناسب
 * @param {object} res - Express response object
 * @param {object} responseData - Response data from helper functions
 */
function sendResponse(res, responseData) {
    const { statusCode, ...data } = responseData;
    return res.status(statusCode).json(data);
}

module.exports = {
    successResponse,
    errorResponse,
    validationErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse,
    conflictResponse,
    serverErrorResponse,
    sendResponse
};
