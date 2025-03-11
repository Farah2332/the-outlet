const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'oracle',
    database: 'the_outlet'
}).promise();

module.exports = pool;
