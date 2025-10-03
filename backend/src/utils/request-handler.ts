import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

export interface ParsedRequest extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: URLSearchParams;
}

export async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export function setCorsHeaders(res: ServerResponse): void {
  const origin = process.env.FRONTEND_URL || "http://localhost:3000";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

export function sendJSON(
  res: ServerResponse,
  statusCode: number,
  data: any
): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function sendError(
  res: ServerResponse,
  statusCode: number,
  message: string
): void {
  sendJSON(res, statusCode, { error: message });
}

export function parseUrl(req: IncomingMessage): {
  pathname: string;
  query: URLSearchParams;
} {
  const baseURL = `http://${req.headers.host}`;
  const url = new URL(req.url || "", baseURL);
  return {
    pathname: url.pathname,
    query: url.searchParams,
  };
}

export function matchRoute(
  pathname: string,
  pattern: string
): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(":")) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}
