"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Auth = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
class Auth {
    constructor(config) {
        this.authConfig = config;
        // Initialize JwksClient only once if it hasn't been initialized
        if (!Auth.client) {
            Auth.client = (0, jwks_rsa_1.default)({
                jwksUri: config.jwksUri,
                cache: config.cacheEnabled,
                cacheMaxEntries: config.cacheMaxEntries,
                cacheMaxAge: config.cacheMaxAge * 1000, // Convert seconds to milliseconds
            });
        }
        this.algorithms = config.algorithms;
        this.issuer = config.issuer;
        this.audience = config.audience;
        this.tokenHeaderName = config.tokenHeaderName;
    }
    getSigningKey(kid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                Auth.client.getSigningKey(kid, (err, key) => {
                    if (err) {
                        reject(err);
                    }
                    else if (key && key.getPublicKey) {
                        resolve(key.getPublicKey());
                    }
                    else {
                        reject(new Error("Key or getPublicKey method not available"));
                    }
                });
            });
        });
    }
    validateToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let decodedToken;
            let kid;
            try {
                // Decode the JWT to get the kid from the header
                decodedToken = jwt.decode(token, { complete: true });
                kid = (_a = decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.header) === null || _a === void 0 ? void 0 : _a.kid;
            }
            catch (error) {
                throw new Error("Invalid token");
            }
            if (!kid) {
                throw new Error("Key ID (kid) not found in token");
            }
            const options = {
                algorithms: ["RS256"],
                issuer: this.issuer,
                audience: this.audience,
            };
            try {
                // Get the signing key based on the kid
                const publicKeyOrSecret = yield this.getSigningKey(kid);
                // Verify the token using the retrieved key
                const decoded = jwt.verify(token, publicKeyOrSecret, options);
                return decoded;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getTokenFromHeader(req) {
        const authHeader = req.header(this.tokenHeaderName);
        if (!authHeader) {
            return undefined;
        }
        const match = authHeader.match(/Bearer\s+(.+)/);
        if (match && match.length > 1) {
            return match[1];
        }
        return undefined;
    }
}
exports.Auth = Auth;
