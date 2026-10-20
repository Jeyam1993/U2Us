// Try a real send without registering a user:  npm run notify:test -- email you@gmail.com
//                                              npm run notify:test -- whatsapp +919876543210
require('dotenv').config();const{deliver}=require('../src/notify');const[,,ch,to]=process.argv;
if(!['email','whatsapp','sms'].includes(ch)||!to){console.log('Usage: npm run notify:test -- email|whatsapp|sms <address-or-number>');process.exit(1)}
deliver(ch,'Test User',ch==='email'?to:'test@example.com',ch==='email'?'+10000000000':to)
 .then(ok=>{console.log(ok?`OK: provider accepted the ${ch} message. Check your inbox/phone.`:`DEMO MODE: no ${ch} keys in .env, nothing was sent.`);process.exit(0)})
 .catch(e=>{console.error('FAILED:',e.message);process.exit(1)});
