import fs from "fs";
import path from "path";
import { Router } from "../../router/Router";
import { sendJSON, sendError } from "../../utils/request-handler";

export function registerAdminImageBrowser(router: Router) {
  router.get("/api/admin/image-browser", async (_req, res) => {
    try {
      const dir = path.join(process.cwd(), "public/images");
      const files = fs.readdirSync(dir);
      const images = files.map(f => `/images/${f}`);
      sendJSON(res, 200, { images });
    } catch (err: any) {
      sendError(res, 500, err.message || "Failed to load images");
    }
  });
}
