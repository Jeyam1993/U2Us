// 10 demo profiles for testing.  npm run seed:demo      (safe to re-run; refuses to run in production)
require('dotenv').config();if(process.env.NODE_ENV==='production'){console.error('Refusing to seed demo users in production.');process.exit(1)}
const bcrypt=require('bcryptjs'),db=require('../src/db'),{enc,hid}=require('../src/sec');
const P=[['Aarav Nair',29,'marriage'],['Meera Iyer',27,'marriage'],['Karthik Raja',31,'long_term'],['Divya Menon',26,'long_term'],['Rohan Sharma',33,'marriage'],
 ['Ananya Reddy',28,'friendship_first'],['Vikram Singh',35,'long_term'],['Priya Das',30,'marriage'],['Arjun Pillai',25,'friendship_first'],['Sneha Kulkarni',32,'long_term']];
(async()=>{const h=await bcrypt.hash('Demo#Pass2026',11);let n=0;
 for(const[i,[name,age,intent]]of P.entries()){const e=`demo${String(i+1).padStart(2,'0')}@u2us.test`,ph=`+9190000000${String(i+1).padStart(2,'0')}`;
  const[r]=await db.query('INSERT IGNORE INTO users(email_hash,email_enc,phone_enc,name,age,intent,pass_hash) VALUES(?,?,?,?,?,?,?)',[hid(e),enc(e),enc(ph),name,age,intent,h]);n+=r.affectedRows}
 console.log(`${n} new demo profiles added (${P.length-n} already existed). Login: demo01@u2us.test ... demo10@u2us.test  password: Demo#Pass2026`);process.exit(0)})().catch(e=>{console.error(e.message);process.exit(1)});
