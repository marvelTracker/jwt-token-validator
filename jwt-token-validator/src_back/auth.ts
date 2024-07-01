import * as jwt from "jsonwebtoken";
import { VerifyOptions } from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";
import dotenv from "dotenv";
dotenv.config();

interface AuthConfig {
  jwksUri: string;
  cacheEnabled: boolean;
  cacheMaxEntries: number;
  cacheMaxAge: number;
  algorithms: string[];
  issuer: string;
  audience: string;
}

const defaultAuthConfig: AuthConfig = {
  jwksUri:
    process.env.JWKS_URI || "https://your-auth-domain/.well-known/jwks.json",
  cacheEnabled: process.env.CACHE_ENABLED === "true",
  cacheMaxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || "5", 10),
  cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || "3600", 10),
  algorithms: [process.env.ALGORITHMS || "RS256"],
  issuer: process.env.ISSUER || "https://your-auth-domain/",
  audience: process.env.AUDIENCE || "your_audience",
};

let client: JwksClient;

export function initializeAuth(config: AuthConfig = defaultAuthConfig) {
  client = jwksClient({
    jwksUri: config.jwksUri,
    cache: config.cacheEnabled,
    cacheMaxEntries: config.cacheMaxEntries,
    cacheMaxAge: config.cacheMaxAge * 1000, // Convert seconds to milliseconds
  });
}

async function getSigningKey(kid: string): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else if (key && key.getPublicKey) {
        console.log("key from getSigning Key", key);
        resolve(key.getPublicKey());
      } else {
        reject(new Error("Key or getPublicKey method not available"));
      }
    });
  });
}

export async function validateToken(token: string): Promise<any> {
  let decodedToken: any;
  let kid: string | undefined;

  try {
    decodedToken = jwt.decode(token, { complete: true });
    kid = decodedToken?.header?.kid;
  } catch (error) {
    throw new Error("Invalid token");
  }

  if (!kid) {
    throw new Error("Key ID (kid) not found in token");
  }

  const options: VerifyOptions = {
    algorithms: ["RS256"],
    issuer: defaultAuthConfig.issuer,
    audience: defaultAuthConfig.audience,
  };

  try {
    const publicKeyOrSecret = await getSigningKey(kid);
    const decoded = jwt.verify(token, publicKeyOrSecret, options);
    return decoded;
  } catch (error) {
    throw error;
  }
}

// Initialize with default config on module load
//initializeAuth();
