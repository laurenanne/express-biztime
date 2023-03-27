const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = new express.Router();
const slugify = require("slugify");

// get all companies from company table
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

// get info on one company based on id
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const compResults = await db.query(
      `SELECT name, description FROM companies WHERE code =$1`,
      [code]
    );
    const invResults = await db.query(
      `SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE  comp_code=$1`,
      [code]
    );
    if (compResults.rows.length === 0) {
      throw new ExpressError(`There is no company with code of ${code}`, 404);
    }
    const company = compResults.rows[0];
    const invoices = invResults.rows;

    company.invoices = invoices.map((invoice) => invoice.id);

    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

// post a new company to the company table
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true, strict: true });

    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).send({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// edit an existing company in the table
router.patch("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code =$3 RETURNING code, name, description`,
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`There is no company with code of ${code}`, 404);
    }

    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// deletes an existing company in the table
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      `DELETE FROM companies WHERE code =$1 RETURNING code`,
      [code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`There is no company with code of ${code}`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
