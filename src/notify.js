// Background worker: signup never waits on SMS/WhatsApp/email providers.
const db=require('./db'),{dec}=require('./sec'),E=process.env;
const mail=E.SMTP_HOST?require('nodemailer').createTransport({host:E.SMTP_HOST,port:+E.SMTP_PORT||587,auth:{user:E.SMTP_USER,pass:E.SMTP_PASS}}):null;
const txt=n=>`Welcome to U2Us, ${n}. Your registration is complete. Slow, honest connection starts here.`;
async function post(url,opt){const r=await fetch(url,opt);if(!r.ok)throw new Error('provider '+r.status+' '+(await r.text()).replace(/\+?\d{8,}/g,'***').slice(0,120))}
const twilio=(to,body)=>post(`https://api.twilio.com/2010-04-01/Accounts/${E.TWILIO_SID}/Messages.json`,{method:'POST',
 headers:{Authorization:'Basic '+Buffer.from(E.TWILIO_SID+':'+E.TWILIO_TOKEN).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({To:to,From:to.startsWith('whatsapp:')?E.TWILIO_WA_FROM:E.TWILIO_SMS_FROM,Body:body})});
// WhatsApp Cloud API (Meta). Free test number works with template "hello_world" for up to 5 allow-listed recipients.
const whatsapp=(phone,name)=>post(`https://graph.facebook.com/${E.WA_API_VERSION||'v23.0'}/${E.WA_PHONE_ID}/messages`,{method:'POST',
 headers:{Authorization:'Bearer '+E.WA_TOKEN,'Content-Type':'application/json'},
 body:JSON.stringify({messaging_product:'whatsapp',to:phone.replace(/\D/g,''),type:'template',template:{name:E.WA_TEMPLATE||'hello_world',language:{code:E.WA_LANG||'en_US'},
  ...(E.WA_TEMPLATE_VARS==='1'&&{components:[{type:'body',parameters:[{type:'text',text:name}]}]})}})});
// Returns true if a real provider accepted it, false in demo mode (nothing sent).
async function deliver(channel,name,email,phone){const t=txt(name);
 if(channel==='email'){if(!mail){console.log('[demo] email ->',email.slice(0,2)+'****');return false}await mail.sendMail({from:E.MAIL_FROM,to:email,subject:'Welcome to U2Us',text:t});return true}
 if(channel==='whatsapp'&&E.WA_TOKEN&&E.WA_PHONE_ID){await whatsapp(phone,name);return true}
 if(E.TWILIO_SID){await twilio(channel==='whatsapp'?'whatsapp:'+phone:phone,t);return true}
 console.log('[demo]',channel,'->',phone.slice(0,4)+'****');return false}
async function tick(){const[rows]=await db.query(`SELECT n.id,n.channel,u.name,u.email_enc,u.phone_enc FROM notifications n JOIN users u ON u.id=n.user_id WHERE n.status='pending' AND n.attempts<3 LIMIT 20`);
 for(const n of rows){try{await deliver(n.channel,n.name,dec(n.email_enc),dec(n.phone_enc));await db.query("UPDATE notifications SET status='sent',attempts=attempts+1 WHERE id=?",[n.id])}
 catch(e){await db.query("UPDATE notifications SET attempts=attempts+1,status=IF(attempts+1>=3,'failed','pending'),error=? WHERE id=?",[String(e.message).slice(0,190),n.id])}}}
exports.deliver=deliver;exports.worker=()=>setInterval(()=>tick().catch(e=>console.error('worker',e.message)),5000);
