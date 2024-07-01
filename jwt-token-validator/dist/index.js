"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./auth"); // Assuming auth.ts handles JWT validation
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const authConfig = {
    jwksUri: process.env.JWKS_URI || "https://your-auth-domain/.well-known/jwks.json",
    cacheEnabled: process.env.CACHE_ENABLED === "true",
    cacheMaxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || "5", 10),
    cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || "3600", 10),
    algorithms: [process.env.ALGORITHMS || "RS256"],
    issuer: process.env.ISSUER || "https://your-auth-domain/",
    audience: process.env.AUDIENCE || "your_audience",
    tokenHeaderName: process.env.TOKEN_HEADER_NAME || "x-gw-token",
};
const auth = new auth_1.Auth(authConfig);
// Endpoint to validate JWT token
app.get("/api/validate-token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = auth.getTokenFromHeader(req);
    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }
    try {
        const decodedToken = yield auth.validateToken(token);
        console.log(decodedToken);
        res.status(200).json({ valid: true, decodedToken });
    }
    catch (error) {
        console.log("Error", error);
        res.status(401).json({ valid: false, error: error });
    }
}));
app.get("/api/health", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json("OK");
}));
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
