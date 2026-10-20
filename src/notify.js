// Background worker: registration never waits on SMS/WhatsApp/email providers.
const db=require('./db'),{dec}=require('./sec'),E=process.env;
const mail=E.SMTP_HOST?require('nodemailer').createTransport({host:E.SMTP_HOST,port:+E.SMTP_PORT||587,auth:{user:E.SMTP_USER,pass:E.SMTP_PASS}}):null;
const txt=n=>`Welcome to Sathi, ${n}. Your registration is complete. Slow, honest connection starts here.`;
async function twilio(to,body){const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${E.TWILIO_SID}/Messages.json`,{method:'POST',
 headers:{Authorization:'Basic '+Buffer.from(E.TWILIO_SID+':'+E.TWILIO_TOKEN).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({To:to,From:to.startsWith('whatsapp:')?E.TWILIO_WA_FROM:E.TWILIO_SMS_FROM,Body:body})});
 if(!r.ok)throw new Error('provider '+r.status)}
async function send(n){const email=dec(n.email_enc),phone=dec(n.phone_enc),t=txt(n.name);
 if(n.channel==='email'){if(!mail)return console.log('[demo] email ->',email.slice(0,2)+'****');return mail.sendMail({from:E.MAIL_FROM,to:email,subject:'Welcome to Sathi',text:t})}
 if(!E.TWILIO_SID)return console.log('[demo]',n.channel,'->',phone.slice(0,4)+'****');
 return twilio(n.channel==='whatsapp'?'whatsapp:'+phone:phone,t)}
async function tick(){const[rows]=await db.query(`SELECT n.id,n.channel,n.attempts,u.name,u.email_enc,u.phone_enc FROM notifications n JOIN users u ON u.id=n.user_id WHERE n.status='pending' AND n.attempts<3 LIMIT 20`);
 for(const n of rows){try{await send(n);await db.query("UPDATE notifications SET status='sent',attempts=attempts+1 WHERE id=?",[n.id])}
 catch(e){await db.query("UPDATE notifications SET attempts=attempts+1,status=IF(attempts+1>=3,'failed','pending'),error=? WHERE id=?",[String(e.message).slice(0,190),n.id])}}}
exports.worker=()=>setInterval(()=>tick().catch(e=>console.error('worker',e.message)),5000);
