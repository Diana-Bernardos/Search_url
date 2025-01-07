// src/utils/helpers.js
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const formatResponse = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data
    };
};