import * as jwt from "jsonwebtoken";
import { VerifyOptions } from "jsonwebtoken";

import jwksClient, { JwksClient } from "jwks-rsa";
import dotenv from "dotenv";
dotenv.config();

const jwksUri =
  process.env.JWKS_URI || "https://your-auth-domain/.well-known/jwks.json";
const cacheEnabled = process.env.CACHE_ENABLED === "true";
const cacheMaxEntries = parseInt(process.env.CACHE_MAX_ENTRIES || "5", 10);
const cacheMaxAge = parseInt(process.env.CACHE_MAX_AGE || "3600", 10); // Default 3600 seconds (1 hour)
const algorithms = [process.env.ALGORITHMS || "RS256"];
const issuer = process.env.ISSUER || "https://your-auth-domain/";
const audience = process.env.AUDIENCE || "your_audience";

interface AuthConfig {
  jwksUri: string;
  cacheEnabled: boolean;
  cacheMaxEntries: number;
  cacheMaxAge: number;
  algorithms: string[];
  issuer: string;
  audience: string;
}

const client: JwksClient = jwksClient({
  jwksUri: jwksUri,
  cache: cacheEnabled,
  cacheMaxEntries: cacheMaxEntries,
  cacheMaxAge: cacheMaxAge * 1000, // Convert seconds to milliseconds
});

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

  console.log(`JWKS URI: ${jwksUri}`);
  console.log(`Cache enabled: ${cacheEnabled}`);
  console.log(`Cache max entries: ${cacheMaxEntries}`);
  console.log(`Cache max age: ${cacheMaxAge}`);
  console.log(`Algorithms: ${algorithms}`);
  console.log(`Issuer: ${issuer}`);
  console.log(`Audience: ${audience}`);

  try {
    // Decode the JWT to get the kid from the header
    decodedToken = jwt.decode(token, { complete: true });
    console.log("decodedToken_before_validate", decodedToken);
    kid = decodedToken?.header?.kid;
  } catch (error) {
    throw new Error("Invalid token");
  }

  if (!kid) {
    throw new Error("Key ID (kid) not found in token");
  }

  const options: VerifyOptions = {
    algorithms: ["RS256"],
    issuer: issuer,
    audience: audience,
  };

  try {
    // Get the signing key based on the kid
    const publicKeyOrSecret = await getSigningKey(kid);
    console.log("publicKeyOrSecret", publicKeyOrSecret);

    // Verify the token using the retrieved key
    const decoded = jwt.verify(token, publicKeyOrSecret, options);
    return decoded;
  } catch (error) {
    throw error;
  }
}
