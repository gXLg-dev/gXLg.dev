const { BadArray } = require("badb");

const array = new BadArray("./db/income.badb", { "values": [
  { "name": "value", "type": "int32" },
  { "name": "text",  "maxLength": 50 },
  { "name": "date",  "maxLength": 10 }
] });

module.exports = { array };
