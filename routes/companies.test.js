process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
beforeEach(async () => {
  const compResult = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('faker','Faker', 'A made up company doing made up things')`
  );
  testCompany = compResult.rows[0];

  const invResult = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date ) VALUES ('faker', 200, false, '2023-03-26', null ) RETURNING id`
  );
  testInvoice = invResult.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
  await db.end();
});

describe("GET/companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [
        {
          code: "faker",
          name: "Faker",
          description: "A made up company doing made up things",
        },
      ],
    });
  });
});

describe("GET/companies/:code", () => {
  test("Get a single company", async () => {
    const res = await request(app).get(`/companies/faker`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        name: "Faker",
        description: "A made up company doing made up things",
        invoices: [testInvoice.id],
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/happy`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST/companies", () => {
  test("Creates a new company", async () => {
    const res = await request(app)
      .post(`/companies`)
      .send({ name: "NewCompany", description: "This is a new company" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "newcompany",
        name: "NewCompany",
        description: "This is a new company",
      },
    });
  });
});

describe("PATCH/companies/:code", () => {
  test("Updates a company", async () => {
    const res = await request(app).patch(`/companies/faker`).send({
      name: "Faker Fake",
      description: "This is an updated description",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "faker",
        name: "Faker Fake",
        description: "This is an updated description",
      },
    });
  });
  test("Resonds with 404 for invalid code", async () => {
    const res = await request(app).patch(`/companies/grreat`).send({
      name: "Faker Fake",
      description: "This is an updated description",
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE/companies/:code", () => {
  test("Deletes a company", async () => {
    const res = await request(app).delete("/companies/faker");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });
});
