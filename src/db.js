require('dotenv').config();
const m=require('mysql2/promise'),E=process.env;
module.exports=m.createPool({host:E.DB_HOST||'127.0.0.1',user:E.DB_USER,password:E.DB_PASS,database:E.DB_NAME,
 connectionLimit:+E.DB_POOL||20,queueLimit:200,waitForConnections:true,connectTimeout:5000});
