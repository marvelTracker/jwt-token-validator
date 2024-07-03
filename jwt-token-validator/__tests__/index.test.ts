import request from "supertest";
import { app, server } from "../src/index";
import { Auth } from "../src/auth";
import nock from "nock";

jest.mock("../src/auth"); // Mock the Auth class

const authMock = Auth as jest.MockedClass<typeof Auth>;

describe("/api/validate-token", () => {
  const fakeToken = "fakeToken";
  const fakeDecodedToken = { sub: "12345" };
  const tokenHeaderName = process.env.TOKEN_HEADER_NAME || "x-gw-token";

  beforeEach(() => {
    nock.cleanAll();
    authMock.prototype.getTokenFromHeader.mockClear();
    authMock.prototype.validateToken.mockClear();
  });

  afterAll(() => {
    server.close(); // Close the server after all tests
  });

  it("should return 401 if token is not provided", async () => {
    const response = await request(app).get("/api/validate-token");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Token not provided" });
  });

  it("should return 200 if token is valid", async () => {
    // Mock the getTokenFromHeader and validateToken methods
    authMock.prototype.getTokenFromHeader.mockReturnValueOnce(fakeToken);
    authMock.prototype.validateToken.mockResolvedValueOnce(fakeDecodedToken);

    const response = await request(app)
      .get("/api/validate-token")
      .set(tokenHeaderName, `Bearer ${fakeToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: true,
      decodedToken: fakeDecodedToken,
    });
  });

  it("should return 401 if token is invalid", async () => {
    // Mock the getTokenFromHeader and validateToken methods
    authMock.prototype.getTokenFromHeader.mockReturnValueOnce(fakeToken);
    authMock.prototype.validateToken.mockRejectedValueOnce(
      new Error("Invalid token")
    );

    const response = await request(app)
      .get("/api/validate-token")
      .set(tokenHeaderName, `Bearer ${fakeToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ valid: false, error: "Invalid token" });
  });
});
