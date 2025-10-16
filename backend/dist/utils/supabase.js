"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const isDev = __dirname.includes('/src/');
const envPath = isDev
    ? path_1.default.resolve(__dirname, '../../../.env')
    : path_1.default.resolve(__dirname, '../../../../.env');
dotenv_1.default.config({ path: envPath });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}
let supabaseInstance = null;
let supabaseAdminInstance = null;
exports.supabase = (() => {
    if (!supabaseInstance) {
        supabaseInstance = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return supabaseInstance;
})();
exports.supabaseAdmin = (() => {
    if (!supabaseAdminInstance) {
        supabaseAdminInstance = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            }
        });
    }
    return supabaseAdminInstance;
})();
//# sourceMappingURL=supabase.js.map