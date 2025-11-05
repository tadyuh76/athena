import fs from "fs";
import path from "path";
import { Router } from "../../router/Router";
import { sendJSON, sendError } from "../../utils/request-handler";

export function registerAdminImageBrowser(router: Router) {
  router.get("/api/admin/image-browser", async (_req, res) => {
    try {
      // Use environment variable for images path, with fallback
      const imagesPath = process.env.IMAGES_PATH || path.join(process.cwd(), "public", "images");

      if (!fs.existsSync(imagesPath)) {
        console.warn(`Images directory not found at: ${imagesPath}`);
        return sendJSON(res, 200, { images: [] }); // Return empty array instead of error
      }

      const files = fs.readdirSync(imagesPath);
      const images = files
        .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
        .map(f => `/images/${f}`);
      sendJSON(res, 200, { images });
    } catch (err: any) {
      console.error("Error loading images:", err);
      sendError(res, 500, err.message || "Failed to load images");
    }
  }, [Router.requireRole(['admin', 'staff'])]);
}
