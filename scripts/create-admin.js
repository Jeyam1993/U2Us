// Make yourself admin:  npm run admin:create -- you@example.com "YourLongPassword#1" +919876543210
require('dotenv').config();const[,,email,pw,phone='+910000000000']=process.argv;
if(!email||!pw||pw.length<10){console.log('Usage: npm run admin:create -- <email> <password 10+ chars> [phone]');process.exit(1)}
const bcrypt=require('bcryptjs'),db=require('../src/db'),{enc,hid}=require('../src/sec');
(async()=>{await db.query("INSERT INTO users(email_hash,email_enc,phone_enc,name,age,intent,pass_hash,role) VALUES(?,?,?,?,?,?,?,'admin') ON DUPLICATE KEY UPDATE role='admin',status='active'",
 [hid(email),enc(email),enc(phone),'Admin',30,'long_term',await bcrypt.hash(pw,11)]);console.log('Admin ready:',email);process.exit(0)})().catch(e=>{console.error(e.message);process.exit(1)});
