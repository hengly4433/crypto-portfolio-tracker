"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const http_error_1 = require("../errors/http-error");
const errorMiddleware = (err, req, res, next) => {
    console.error('[ErrorMiddleware]', err);
    if (err instanceof http_error_1.HttpError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return; // Ensure void return
    }
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
};
exports.errorMiddleware = errorMiddleware;
