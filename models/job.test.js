"use strict";
//Modified from provided job.test.js
const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    id: expect.any(Number),
    title: "New Title",
    salary: 10,
    equity: "0.5",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New Title'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "New Title",
        salary: 10,
        equity: "0.5",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "J2",
        salary: 2,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "J3",
        salary: 3,
        equity: "0.3",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(await getTestID());
    expect(job).toEqual({
        id: expect.any(Number),
        title: "J1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Title",
    salary: 10,
    equity: "0.5",
  };

  test("works", async function () {
    let jobRes = await db.query(`SELECT id FROM jobs WHERE title = 'J1'`);
    
    let testID = await getTestID();
    let job = await Job.update(testID, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateData,
      companyHandle: "c1",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [testID]);
    expect(result.rows).toEqual([{
        id: expect.any(Number),
        title: "New Title",
        salary: 10,
        equity: "0.5",
        company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
        title: "New Title",
        salary: null,
        equity: null,
    };
    let testID = await getTestID();
    let job = await Job.update(testID, updateDataSetNulls);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateDataSetNulls,
      companyHandle: "c1",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testID}`);
    expect(result.rows).toEqual([{
        id: expect.any(Number),
        title: "New Title",
        salary: null,
        equity: null,
        company_handle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(1, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(await getTestID(), {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let testID = await getTestID();
    await Job.remove(testID);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${testID}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


/**Returns current ID for the J1 test job in the database */
async function getTestID(){
    let jobRes = await db.query(`SELECT id FROM jobs WHERE title = 'J1'`);
    return jobRes.rows[0].id;
}
