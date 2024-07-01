import * as jose from "node-jose";
import nock from "nock";

export async function generateKeys() {
  const keystore = jose.JWK.createKeyStore();
  const key = await keystore.generate("RSA", 2048, {
    alg: "RS256",
    use: "sig",
  });
  const publicKey = key.toPEM();
  const privateKey = key.toPEM(true);
  const jwks = keystore.toJSON();

  return { publicKey, privateKey, jwks };
}

export function mockJwksEndpoint(jwks: any, endpoint: string) {
  nock(endpoint).persist().get("/.well-known/jwks.json").reply(200, jwks);
}
