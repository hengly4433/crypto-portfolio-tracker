"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const http_error_1 = require("../errors/http-error");
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const issues = error.issues;
            const message = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            next(new http_error_1.BadRequestError(message));
        }
        else {
            next(error);
        }
    }
};
exports.validate = validate;
