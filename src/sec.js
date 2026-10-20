const c=require('crypto'),E=process.env;
if(E.NODE_ENV==='production'&&(!/^[0-9a-f]{64}$/.test(E.DATA_KEY||'')||(E.JWT_SECRET||'').length<32))throw new Error('Set DATA_KEY (64 hex) and JWT_SECRET (32+ chars)');
const K=Buffer.from(E.DATA_KEY||'0'.repeat(64),'hex');
exports.enc=t=>{const iv=c.randomBytes(12),x=c.createCipheriv('aes-256-gcm',K,iv),b=Buffer.concat([x.update(t,'utf8'),x.final()]);return Buffer.concat([iv,x.getAuthTag(),b]).toString('base64')};
exports.dec=s=>{const b=Buffer.from(s,'base64'),d=c.createDecipheriv('aes-256-gcm',K,b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8')};
exports.hid=t=>c.createHmac('sha256',K).update(t.trim().toLowerCase()).digest('hex');
exports.mask=(s,k=2)=>s.slice(0,k)+'•'.repeat(Math.max(s.length-k-2,3))+s.slice(-2);
