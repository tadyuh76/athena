"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBody = parseBody;
exports.setCorsHeaders = setCorsHeaders;
exports.sendJSON = sendJSON;
exports.sendError = sendError;
exports.parseUrl = parseUrl;
exports.matchRoute = matchRoute;
const url_1 = require("url");
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch (error) {
                reject(error);
            }
        });
        req.on("error", reject);
    });
}
function setCorsHeaders(res) {
    const origin = process.env.FRONTEND_URL || "http://localhost:3000";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
}
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}
function sendError(res, statusCode, message) {
    sendJSON(res, statusCode, { error: message });
}
function parseUrl(req) {
    const baseURL = `http://${req.headers.host}`;
    const url = new url_1.URL(req.url || "", baseURL);
    return {
        pathname: url.pathname,
        query: url.searchParams,
    };
}
function matchRoute(pathname, pattern) {
    const patternParts = pattern.split("/");
    const pathParts = pathname.split("/");
    if (patternParts.length !== pathParts.length) {
        return null;
    }
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];
        if (patternPart.startsWith(":")) {
            const paramName = patternPart.slice(1);
            params[paramName] = pathPart;
        }
        else if (patternPart !== pathPart) {
            return null;
        }
    }
    return params;
}
//# sourceMappingURL=request-handler.js.map