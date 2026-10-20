require('dotenv').config();
const express=require('express'),helmet=require('helmet'),rate=require('express-rate-limit'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),{z}=require('zod'),
prom=require('prom-client'),pino=require('pino-http'),db=require('./db'),{enc,dec,hid,mask}=require('./sec'),{worker}=require('./notify'),E=process.env;
const SECRET=E.JWT_SECRET||'dev-only-secret-change-me-dev-only-secret',app=express();
app.set('trust proxy',1);app.disable('x-powered-by');
app.use(helmet(),express.json({limit:'10kb'}),pino({enabled:process.env.NODE_ENV!=='test',quietReqLogger:true,redact:['req.headers.authorization','req.body']}));
prom.collectDefaultMetrics();
const lat=new prom.Histogram({name:'http_request_seconds',help:'latency',labelNames:['method','route','status'],buckets:[.025,.05,.1,.25,.5,1,2,5]});
app.use((q,s,n)=>{const e=lat.startTimer();s.on('finish',()=>e({method:q.method,route:q.route?.path||'static',status:s.statusCode}));n()});
app.use(rate({windowMs:60000,limit:+E.GLOBAL_LIMIT||300}));
const auth_rl=rate({windowMs:15*60000,limit:+E.AUTH_LIMIT||10,message:{error:'Too many attempts. Try again later.'}});
const sign=id=>jwt.sign({id},SECRET,{expiresIn:'2h'});
const audit=(id,a,ip)=>db.query('INSERT INTO audit_log(user_id,action,ip) VALUES(?,?,?)',[id,a,ip]).catch(()=>{});
const need=(q,s,n)=>{try{q.uid=jwt.verify((q.headers.authorization||'').replace('Bearer ',''),SECRET).id;n()}catch{s.status(401).json({error:'Please sign in again.'})}};
const Reg=z.object({name:z.string().trim().min(2).max(80),email:z.string().trim().email().max(120),phone:z.string().regex(/^\+[1-9]\d{9,14}$/,'Use international format, e.g. +919876543210'),
 password:z.string().min(10).max(72),age:z.number({invalid_type_error:'Enter your age'}).int().min(18,'You must be 18 or older').max(99),intent:z.enum(['marriage','long_term','friendship_first']),consent:z.literal(true,{errorMap:()=>({message:'Consent is required'})})});
app.post('/api/register',auth_rl,async(q,s)=>{
 const p=Reg.safeParse(q.body);if(!p.success)return s.status(400).json({error:p.error.issues[0].message});const d=p.data;
 const conn=await db.getConnection();
 try{await conn.beginTransaction();
  const[r]=await conn.query('INSERT INTO users(email_hash,email_enc,phone_enc,name,age,intent,pass_hash) VALUES(?,?,?,?,?,?,?)',
   [hid(d.email),enc(d.email),enc(d.phone),d.name,d.age,d.intent,await bcrypt.hash(d.password,11)]);
  await conn.query("INSERT INTO notifications(user_id,channel) VALUES(?,'sms'),(?,'whatsapp'),(?,'email')",[r.insertId,r.insertId,r.insertId]);
  await conn.commit();audit(r.insertId,'register',q.ip);s.status(201).json({token:sign(r.insertId)});
 }catch(e){await conn.rollback();if(e.code==='ER_DUP_ENTRY')return s.status(409).json({error:'Could not register with these details.'});
  q.log.error(e.message);s.status(500).json({error:'Something went wrong. Please try again.'})}finally{conn.release()}});
app.post('/api/login',auth_rl,async(q,s)=>{
 const p=z.object({email:z.string().email(),password:z.string().max(72)}).safeParse(q.body);if(!p.success)return s.status(400).json({error:'Invalid details.'});
 const[[u]]=await db.query('SELECT id,pass_hash FROM users WHERE email_hash=?',[hid(p.data.email)]);
 if(!u||!await bcrypt.compare(p.data.password,u.pass_hash)){audit(null,'login_fail',q.ip);return s.status(401).json({error:'Email or password is incorrect.'})}
 audit(u.id,'login',q.ip);s.json({token:sign(u.id)})});
app.get('/api/summary',need,async(q,s)=>{
 const[[u]]=await db.query('SELECT name,age,intent,email_enc,phone_enc,created_at FROM users WHERE id=?',[q.uid]);if(!u)return s.status(404).json({error:'Not found'});
 const[n]=await db.query('SELECT channel,status FROM notifications WHERE user_id=?',[q.uid]);
 s.json({name:u.name,age:u.age,intent:u.intent,email:mask(dec(u.email_enc)),phone:mask(dec(u.phone_enc),3),registeredAt:u.created_at,notifications:n})});
app.get('/health',async(_,s)=>{try{await db.query('SELECT 1');s.json({ok:true})}catch{s.status(503).json({ok:false})}});
const owner=(q,s,n)=>E.OWNER_TOKEN&&q.headers['x-owner-token']===E.OWNER_TOKEN?n():s.sendStatus(404);
app.get('/metrics',owner,async(_,s)=>s.type(prom.register.contentType).send(await prom.register.metrics()));
app.get('/owner/stats',owner,async(_,s)=>{const[[a]]=await db.query('SELECT COUNT(*) users,SUM(created_at>NOW()-INTERVAL 1 DAY) last24h FROM users');
 const[n]=await db.query('SELECT channel,status,COUNT(*) c FROM notifications GROUP BY 1,2');const[f]=await db.query("SELECT COUNT(*) c FROM audit_log WHERE action='login_fail' AND created_at>NOW()-INTERVAL 1 HOUR");
 s.json({...a,notifications:n,failedLoginsLastHour:f[0].c})});
app.use(express.static('public',{maxAge:'1h'}));
app.use((e,q,s,n)=>{q.log?.error(e.message);s.status(e.status||500).json({error:'Something went wrong.'})});
module.exports=app;
if(require.main===module){worker();app.listen(+E.PORT||3000,()=>console.log('EverUs up on',E.PORT||3000))}
