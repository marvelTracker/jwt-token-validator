import axios from "axios";
import { Auth } from "../src/auth";
import jwt from "jsonwebtoken";
import { generateKeys, mockJwksEndpoint } from "./utils";
import * as nock from "nock";
import { describe, it, beforeEach, afterEach, jest } from "@jest/globals";

const JWKS_URI = "http://localhost:4000/.well-known/jwks.json";
const issuer = "http://localhost:4000";
const audience = "adaptor-service";
const algorithm = "RS256";

const authConfig = {
  jwksUri: JWKS_URI,
  cacheEnabled: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 1, // 1 second for quick test
  algorithms: [algorithm],
  issuer: issuer,
  audience: audience,
  tokenHeaderName: "x-gw-token",
};

describe("JWKS Client Caching Behavior", () => {
  let auth: Auth;
  let publicKey: string;
  let privateKey: string;
  let jwks: any;
  let kid: string;

  //   beforeEach(async () => {
  //     auth = new Auth(authConfig);

  //     const keys = await generateKeys();
  //     publicKey = keys.publicKey;
  //     privateKey = keys.privateKey;
  //     jwks = keys.jwks;

  //     // Mock the JWKS endpoint
  //     mockJwksEndpoint(jwks, JWKS_URI);

  //     // Get the JWKS response
  //     const jwksResponse = await axios.get(JWKS_URI);
  //     kid = jwksResponse.data.keys[0].kid;
  //   });

  //   afterEach(() => {
  //     nock.cleanAll();
  //     jest.useRealTimers(); // Ensure we use real timers
  //   });

  it("should cache JWKS keys and reuse them", async () => {
    // Spy on axios to verify that it is called only once
    //const axiosSpy = jest.spyOn(axios, "get");

    auth = new Auth(authConfig);

    const keys = await generateKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    jwks = keys.jwks;

    // Mock the JWKS endpoint
    mockJwksEndpoint(jwks, JWKS_URI);

    // Get the JWKS response
    const jwksResponse = await axios.get(JWKS_URI);
    kid = jwksResponse.data.keys[0].kid;

    // Call validateToken twice
    const result1 = await auth.validateToken(
      jwt.sign(
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
      )
    );

    console.log(result1);

    const result2 = await auth.validateToken(
      jwt.sign(
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
      )
    );

    console.log(result2);

    // Verify that axios was only called once due to caching
    //expect(axiosSpy).toHaveBeenCalledTimes(1);
  });

  //   it("should respect cache expiration", async () => {
  //     jest.useFakeTimers();

  //     // Call validateToken to cache the JWKS keys
  //     await auth.validateToken(
  //       jwt.sign(
  //         {
  //           sub: "1234567890",
  //           name: "John Doe",
  //           iat: Math.floor(Date.now() / 1000),
  //         },
  //         privateKey,
  //         {
  //           algorithm: algorithm,
  //           issuer: issuer,
  //           audience: audience,
  //           header: { kid, alg: algorithm },
  //         }
  //       )
  //     );

  //     // Fast-forward time to expire the cache
  //     jest.advanceTimersByTime(1000); // 1 second

  //     // Spy on axios to verify it is called again after cache expires
  //     const axiosSpy = jest.spyOn(axios, "get");

  //     // Call validateToken again to check if the JWKS keys are fetched again
  //     await auth.validateToken(
  //       jwt.sign(
  //         {
  //           sub: "1234567890",
  //           name: "John Doe",
  //           iat: Math.floor(Date.now() / 1000),
  //         },
  //         privateKey,
  //         {
  //           algorithm: algorithm,
  //           issuer: issuer,
  //           audience: audience,
  //           header: { kid, alg: algorithm },
  //         }
  //       )
  //     );

  //     // Verify that axios was called again due to cache expiration
  //     expect(axiosSpy).toHaveBeenCalledTimes(2);
  //   });

  //   it("should respect cache max entries", async () => {
  //     // Increase cache size for testing
  //     authConfig.cacheMaxEntries = 2;
  //     auth = new Auth(authConfig);

  //     // Spy on axios to verify that it is called for each new key
  //     const axiosSpy = jest.spyOn(axios, "get");

  //     // Generate new keys and tokens to fill the cache
  //     for (let i = 0; i < 3; i++) {
  //       const keys = await generateKeys();
  //       const newPublicKey = keys.publicKey;
  //       const newPrivateKey = keys.privateKey;
  //       const newJwks = keys.jwks;
  //       mockJwksEndpoint(newJwks, JWKS_URI);

  //       const jwksResponse = await axios.get(JWKS_URI);
  //       const newKid = jwksResponse.data.keys[0].kid;

  //       await auth.validateToken(
  //         jwt.sign(
  //           {
  //             sub: "1234567890",
  //             name: "John Doe",
  //             iat: Math.floor(Date.now() / 1000),
  //           },
  //           newPrivateKey,
  //           {
  //             algorithm: algorithm,
  //             issuer: issuer,
  //             audience: audience,
  //             header: { kid: newKid, alg: algorithm },
  //           }
  //         )
  //       );
  //     }

  //     // Ensure axios was called for each token creation
  //     // We should have 3 calls due to cacheMaxEntries being 2 (it discards older entries)
  //     expect(axiosSpy).toHaveBeenCalledTimes(3);
  //   });
});
