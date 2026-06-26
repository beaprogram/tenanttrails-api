// tests/api.test.js - automated API tests with supertest.
// Run with: npm test   (requires the tenanttrails database to be reachable)
import request from "supertest";
import app from "../app.js";
import { pool } from "../db.js";

afterAll(async () => {
  await pool.end(); // close the pool so the test process can exit cleanly
});

describe("apartments API", () => {
  it("lists apartments", async () => {
    const res = await request(app).get("/api/apartments");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("blocks an unauthenticated review", async () => {
    const res = await request(app)
      .post("/api/apartments/1/reviews")
      .send({ rating: 5, body: "Nice" });
    expect(res.status).toBe(401);
  });
});
