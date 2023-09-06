const {sqlForPartialUpdate} = require("./sql.js");
const { BadRequestError } = require("../expressError");

test("returns expected object", async function () {
    let testData = {
        username:"test",
        favNum:8
    };
    let colRename = {favNum:"fav_num"};
    const res = sqlForPartialUpdate(testData, colRename);
    expect(res.setCols).toEqual("\"username\"=$1, \"fav_num\"=$2");
    expect(res.values).toEqual(["test", 8]);
});

test("throws an error without data", async function () {
  try{
    let testError = sqlForPartialUpdate({},{});
  } catch(error){
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.message).toBe('No data');
  }
});
