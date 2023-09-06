const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** sqlForPartialUpdate(dataToUpdate, jsToSql)
 * dataToUpdate: JavaScript object with the data to be updated
 * jsToSql: object with the JavaScript name of the database columns as keys
 *          and the SQL column names as values
 * 
 * RETURNS:{setCols: "<SQL request string>"
 *          values: [<values to be inserted>]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");


  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  //finish converting the columns to one long string
  //and provide the actual data to be inserted into the columns
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
