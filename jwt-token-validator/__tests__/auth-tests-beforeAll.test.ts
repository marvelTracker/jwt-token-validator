import jwt from "jsonwebtoken";
import axios from "axios";
import { generateKeys, mockJwksEndpoint } from "./utils";
import * as nock from "nock";
import { describe, it, beforeAll, afterEach } from "@jest/globals";
import { validateToken, initializeAuth } from "../src_back/auth";

const JWKS_URI = "http://localhost:4000/.well-known/jwks.json";
const issuer = "http://localhost:4000";
const audience = "adaptor-service";
const algorithm = "RS256";

const authConfig = {
  jwksUri: JWKS_URI,
  cacheEnabled: false,
  cacheMaxEntries: 5,
  cacheMaxAge: 3600,
  algorithms: ["RS256"],
  issuer: issuer,
  audience: audience,
  tokenHeaderName: "x-gw-token",
};

describe("JWT Validation", () => {
  let publicKey: string;
  let privateKey: string;
  let jwks: any;
  let kid: any;

  beforeAll(async () => {
    // Initialize the auth with the provided configuration
    initializeAuth(authConfig);

    // Generate keys and mock the JWKS endpoint
    const keys = await generateKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    jwks = keys.jwks;

    // Mock the JWKS endpoint
    mockJwksEndpoint(jwks, JWKS_URI);

    // Get the kid from the JWKS response
    const jwksResponse = await axios.get(JWKS_URI);
    kid = jwksResponse.data.keys[0].kid;
    console.log(kid);
  });

  afterEach(() => {
    // Clean all nock interceptors after each test
    nock.cleanAll();
  });

  describe("Valid token scenarios", () => {
    it("should validate a token with correct claims", async () => {
      const token = jwt.sign(
        {
          sub: "1234567890",
          name: "John Doe",
          iat: Math.floor(Date.now() / 1000),
        },
        privateKey,
        {
          algorithm: algorithm,
          issuer: issuer,
          audience: audience,
          header: { kid, alg: algorithm },
        }
      );

      const result = await validateToken(token);
      expect(result).toBeDefined();
      expect(result.name).toBe("John Doe");
    });
  });

  describe("Invalid token scenarios", () => {
    it("should reject a token with an invalid issuer", async () => {
      const token = jwt.sign(
        {
          sub: "1234567890",
          name: "John Doe",
          iat: Math.floor(Date.now() / 1000),
        },
        privateKey,
        {
          algorithm: algorithm,
          issuer: "http://wrong-issuer.com", // Incorrect issuer
          audience: audience,
          header: { kid, alg: algorithm },
        }
      );
      await expect(validateToken(token)).rejects.toThrow("jwt issuer invalid");
    });

    it("should reject an expired token", async () => {
      const token = jwt.sign(
        {
          sub: "1234567890",
          name: "John Doe",
          iat: Math.floor(Date.now() / 1000) - 7200, // Token issued 2 hours ago
        },
        privateKey,
        {
          algorithm: algorithm,
          issuer: issuer,
          audience: audience,
          header: { kid, alg: algorithm },
          expiresIn: "-1h", // Token expires 1 hour ago
        }
      );
      await expect(validateToken(token)).rejects.toThrow("jwt expired");
    });

    it("should reject a token with an invalid signature", async () => {
      const otherKeys = await generateKeys();
      const otherPrivateKey = otherKeys.privateKey;
      const token = jwt.sign(
        {
          sub: "1234567890",
          name: "John Doe",
          iat: Math.floor(Date.now() / 1000),
        },
        otherPrivateKey, // Use a different private key to sign the token
        {
          algorithm: algorithm,
          issuer: issuer,
          audience: audience,
          header: { kid, alg: algorithm },
        }
      );
      await expect(validateToken(token)).rejects.toThrow("invalid signature");
    });

    it("should reject a token without kid in header", async () => {
      const token = jwt.sign(
        {
          sub: "1234567890",
          name: "John Doe",
          iat: Math.floor(Date.now() / 1000),
        },
        privateKey,
        {
          algorithm: algorithm,
          issuer: issuer,
          audience: audience,
        }
      );
      await expect(validateToken(token)).rejects.toThrow(
        "Key ID (kid) not found in token"
      );
    });
  });
});
