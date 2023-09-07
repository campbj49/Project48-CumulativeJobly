//Modified from provided companies.test.js
"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

/**Returns current ID for the J1 test job in the database */
async function getTestID(){
    let jobRes = await db.query(`SELECT id FROM jobs WHERE title = 'J1'`);
    return jobRes.rows[0].id;
}

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
} = require("./_testCommon");
const { get } = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "J1",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "J2",
                salary: 2,
                equity: "0.2",
                companyHandle: "c2"
            },
            {
                id: expect.any(Number),
                title: "J3",
                salary: 3,
                equity: "0.3",
                companyHandle: "c3"
            },
          ],
    });
  });

  test("filtering via all queries works", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=3&hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "J3",
                salary: 3,
                equity: "0.3",
                companyHandle: "c3",
            },
          ],
    });
  });

  test("filtering via one query works", async function () {
    const resp = await request(app).get("/jobs?title=j3");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "J3",
                salary: 3,
                equity: "0.3",
                companyHandle: "c3",
            },
          ],
    });
  });

  test("filtering with non-numbers throws an error", async function () {
    const resp = await request(app).get("/jobs?minSalary=notANumber");
    expect(resp.body).toEqual({
      "error":{
          "message": "minSalary must be a number",
          "status": 500,
      }
    });
  });

  test("fails: test next() idr", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-idr works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let testID = await getTestID();
    const resp = await request(app).get(`/jobs/${testID}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newjob = {
    title: "New Title",
    salary: "10",
    equity: "0.5",
    companyHandle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newjob)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New Title",
        salary: 10,
        equity: "0.5",
        companyHandle: "c1",
      }
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newjob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newjob,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {

    const resp = await request(app)
        .patch(`/jobs/${await getTestID()}`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J1-new",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${await getTestID()}`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${await getTestID()}`)
        .send({
          title: "J1-new",
        })
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${await getTestID()}`)
        .send({
          id: "c1-new",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${await getTestID()}`)
        .send({
          equity: 5,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    let testID = await getTestID();
    const resp = await request(app)
        .delete(`/jobs/${testID}`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({ deleted: `${testID}` });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${await getTestID()}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${await getTestID()}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

