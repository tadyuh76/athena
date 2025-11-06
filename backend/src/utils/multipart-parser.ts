import { IncomingMessage } from 'http';

export interface ParsedFile {
  filename: string;
  mimeType: string;
  data: Buffer;
}

export interface MultipartFormData {
  fields: Record<string, string>;
  files: ParsedFile[];
}

/**
 * Parse multipart/form-data from HTTP request
 * Lightweight parser without external dependencies
 */
export class MultipartParser {
  /**
   * Parse multipart form data from request
   * @param req - Incoming HTTP request
   * @returns Parsed form data with fields and files
   */
  static async parse(req: IncomingMessage): Promise<MultipartFormData> {
    return new Promise((resolve, reject) => {
      const contentType = req.headers['content-type'];

      if (!contentType || !contentType.includes('multipart/form-data')) {
        reject(new Error('Content-Type must be multipart/form-data'));
        return;
      }

      // Extract boundary from content-type header
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (!boundaryMatch) {
        reject(new Error('No boundary found in Content-Type'));
        return;
      }

      const boundary = `--${boundaryMatch[1]}`;
      const chunks: Buffer[] = [];

      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const result = this.parseBuffer(buffer, boundary);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse buffer containing multipart form data
   */
  private static parseBuffer(
    buffer: Buffer,
    boundary: string
  ): MultipartFormData {
    const fields: Record<string, string> = {};
    const files: ParsedFile[] = [];

    // Split buffer by boundary
    const parts = this.splitBuffer(buffer, boundary);

    for (const part of parts) {
      if (part.length === 0) continue;

      // Find the double CRLF that separates headers from body
      const headerEndIndex = part.indexOf('\r\n\r\n');
      if (headerEndIndex === -1) continue;

      const headerSection = part.slice(0, headerEndIndex).toString('utf-8');
      const bodyStart = headerEndIndex + 4; // Skip \r\n\r\n
      const body = part.slice(bodyStart);

      // Parse headers
      const headers = this.parseHeaders(headerSection);
      const contentDisposition = headers['content-disposition'];

      if (!contentDisposition) continue;

      // Extract field name
      const nameMatch = contentDisposition.match(/name="([^"]+)"/);
      if (!nameMatch) continue;

      const fieldName = nameMatch[1];

      // Check if this is a file upload
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);

      if (filenameMatch) {
        // This is a file
        const filename = filenameMatch[1];
        const mimeType = headers['content-type'] || 'application/octet-stream';

        // Remove trailing CRLF from file data
        let fileData = body;
        if (
          fileData.length >= 2 &&
          fileData[fileData.length - 2] === 0x0d &&
          fileData[fileData.length - 1] === 0x0a
        ) {
          fileData = fileData.slice(0, -2);
        }

        files.push({
          filename,
          mimeType,
          data: fileData,
        });
      } else {
        // This is a regular field
        let value = body.toString('utf-8');

        // Remove trailing CRLF
        if (value.endsWith('\r\n')) {
          value = value.slice(0, -2);
        }

        fields[fieldName] = value;
      }
    }

    return { fields, files };
  }

  /**
   * Split buffer by boundary
   */
  private static splitBuffer(buffer: Buffer, boundary: string): Buffer[] {
    const parts: Buffer[] = [];
    const boundaryBuffer = Buffer.from(boundary);
    let start = 0;

    while (start < buffer.length) {
      const boundaryIndex = buffer.indexOf(boundaryBuffer, start);

      if (boundaryIndex === -1) {
        break;
      }

      if (start !== boundaryIndex) {
        parts.push(buffer.slice(start, boundaryIndex));
      }

      start = boundaryIndex + boundaryBuffer.length;

      // Skip the CRLF after boundary
      if (
        start < buffer.length &&
        buffer[start] === 0x0d &&
        buffer[start + 1] === 0x0a
      ) {
        start += 2;
      }
    }

    return parts;
  }

  /**
   * Parse headers from header section
   */
  private static parseHeaders(headerSection: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const lines = headerSection.split('\r\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();

      headers[key] = value;
    }

    return headers;
  }

  /**
   * Get content length from request headers
   */
  static getContentLength(req: IncomingMessage): number {
    const contentLength = req.headers['content-length'];
    return contentLength ? parseInt(contentLength, 10) : 0;
  }
}
