const $=s=>document.querySelector(s);let T=sessionStorage.getItem('t');
async function api(p,b){const r=await fetch('/api'+p,{method:b?'POST':'GET',headers:{'Content-Type':'application/json',...(T&&{Authorization:'Bearer '+T})},body:b&&JSON.stringify(b)});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Something went wrong.');return j}
$('#f').onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.target));b.age=+b.age;b.consent=e.target.consent.checked;
 $('#go').disabled=true;$('#err').textContent='';
 try{T=(await api('/register',b)).token;sessionStorage.setItem('t',T);show()}catch(x){$('#err').textContent=x.message;$('#go').disabled=false}};
const L={sms:'SMS',whatsapp:'WhatsApp',email:'Email'},S={pending:'Sending…',sent:'Sent',failed:'Could not send'};
async function show(){try{const d=await api('/summary');$('#reg').hidden=true;$('#sum').hidden=false;
 const dl=$('#sd');dl.replaceChildren();for(const[k,v]of[['Name',d.name],['Age',d.age],['Looking for',d.intent.replace('_',' ')],['Email',d.email],['Mobile',d.phone]]){const a=document.createElement('dt'),b=document.createElement('dd');a.textContent=k;b.textContent=v;dl.append(a,b)}
 const ul=$('#nl');ul.replaceChildren();d.notifications.forEach(n=>{const li=document.createElement('li');li.textContent=`${L[n.channel]}: ${S[n.status]}`;ul.append(li)});
 if(d.notifications.some(n=>n.status==='pending'))setTimeout(show,3000)}catch{sessionStorage.removeItem('t');T=null}}
if(T)show();
