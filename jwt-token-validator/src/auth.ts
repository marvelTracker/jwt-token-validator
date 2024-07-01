import * as jwt from "jsonwebtoken";
import { VerifyOptions } from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";
import { Request } from "express";

interface AuthConfig {
  jwksUri: string;
  cacheEnabled: boolean;
  cacheMaxEntries: number;
  cacheMaxAge: number;
  algorithms: string[];
  issuer: string;
  audience: string;
  tokenHeaderName: string;
}

export class Auth {
  private static client: JwksClient;
  private algorithms: string[];
  private issuer: string;
  private audience: string;
  private tokenHeaderName: string;
  private authConfig: AuthConfig;

  constructor(config: AuthConfig) {
    this.authConfig = config;

    // Initialize JwksClient only once if it hasn't been initialized
    if (!Auth.client) {
      Auth.client = jwksClient({
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

  private async getSigningKey(kid: string): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
      Auth.client.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else if (key && key.getPublicKey) {
          resolve(key.getPublicKey());
        } else {
          reject(new Error("Key or getPublicKey method not available"));
        }
      });
    });
  }

  public async validateToken(token: string): Promise<any> {
    let decodedToken: any;
    let kid: string | undefined;

    try {
      // Decode the JWT to get the kid from the header
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
      issuer: this.issuer,
      audience: this.audience,
    };

    try {
      // Get the signing key based on the kid
      const publicKeyOrSecret = await this.getSigningKey(kid);

      // Verify the token using the retrieved key
      const decoded = jwt.verify(token, publicKeyOrSecret, options);
      return decoded;
    } catch (error) {
      throw error;
    }
  }

  public getTokenFromHeader(req: Request): string | undefined {
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
