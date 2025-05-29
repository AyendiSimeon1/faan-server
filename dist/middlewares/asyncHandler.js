"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncHandler = (fn) => (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Request started: ${req.method} ${req.path}`);
    Promise.resolve(fn(req, res, next))
        .then(() => {
        console.log(`[${new Date().toISOString()}] Request completed: ${req.method} ${req.path}`);
    })
        .catch((error) => {
        console.error(`[${new Date().toISOString()}] Request error: ${req.method} ${req.path}`, error);
        next(error);
    });
};
exports.default = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map