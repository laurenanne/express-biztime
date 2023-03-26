const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = new express.Router();

// get all invoices from invoices table
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

// get info on one invoice based on id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `SELECT * FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE id =$1 `,
      [id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id of ${id}`, 404);
    }
    const inv = results.rows[0];
    return res.json({
      invoice: {
        id: inv.id,
        amt: inv.amt,
        paid: inv.paid,
        add_date: inv.add_date,
        paid_date: inv.paid_date,
        company: {
          code: inv.code,
          name: inv.name,
          description: inv.description,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

// post a new invoice to the inovices table
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// updates an existing invoice in the table
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const results = await db.query(
      `UPDATE invoices SET amt=$1 WHERE id =$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id of ${id}`, 404);
    }

    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// deletes an existing invoice in the table
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `DELETE FROM invoices WHERE id =$1 RETURNING id`,
      [id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id of ${id}`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
