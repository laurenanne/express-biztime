process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice1;
let testInvoice2;

beforeEach(async () => {
  const compResult = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('faker','Faker', 'A made up company doing made up things')`
  );
  testCompany = compResult.rows[0];

  const invResult1 = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date ) VALUES ('faker', 200, false, '2023-03-26', null ) RETURNING id`
  );
  testInvoice1 = invResult1.rows[0];
  const invResult2 = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date ) VALUES ('faker', 300, false, '2023-03-26', null ) RETURNING id`
  );
  testInvoice2 = invResult2.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
  await db.end();
});

describe("GET/invoices", () => {
  test("Get a list of invoicess", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        {
          id: testInvoice1.id,
          comp_code: "faker",
          amt: 200,
          paid: false,
          add_date: "2023-03-26T04:00:00.000Z",
          paid_date: null,
        },
        {
          id: testInvoice2.id,
          comp_code: "faker",
          amt: 300,
          paid: false,
          add_date: "2023-03-26T04:00:00.000Z",
          paid_date: null,
        },
      ],
    });
  });
});

describe("GET/invoices/:id", () => {
  test("Get a single invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice1.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice1.id,
        amt: 200,
        paid: false,
        add_date: "2023-03-26T04:00:00.000Z",
        paid_date: null,
        company: {
          code: "faker",
          name: "Faker",
          description: "A made up company doing made up things",
        },
      },
    });
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).get(`/invoices/790`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST/invoices", () => {
  test("Creates a new invoice", async () => {
    const res = await request(app)
      .post(`/invoices`)
      .send({ comp_code: "faker", amt: 650 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "faker",
        amt: 650,
        paid: false,
        add_date: "2023-03-27T04:00:00.000Z",
        paid_date: null,
      },
    });
  });
});

describe("PATCH/invoices/:id", () => {
  test("Updates an invoice", async () => {
    const res = await request(app).patch(`/invoices/${testInvoice2.id}`).send({
      amt: 250,
      paid: false,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice2.id,
        comp_code: "faker",
        amt: 250,
        paid: false,
        add_date: "2023-03-26T04:00:00.000Z",
        paid_date: null,
      },
    });
  });
  test("Updates an invoice and changes the paid date", async () => {
    const res = await request(app).patch(`/invoices/${testInvoice1.id}`).send({
      amt: 200,
      paid: true,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice1.id,
        comp_code: "faker",
        amt: 200,
        paid: true,
        add_date: "2023-03-26T04:00:00.000Z",
        paid_date: "2023-03-27T04:00:00.000Z",
      },
    });
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).patch(`/invoices/2500`).send({
      amt: 250,
      paid: false,
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE/invoices/:id", () => {
  test("Deletes a company", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice2.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });
});
