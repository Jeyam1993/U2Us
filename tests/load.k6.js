import http from 'k6/http';import {check,sleep} from 'k6';
export const options={stages:[{duration:'1m',target:100},{duration:'3m',target:300},{duration:'1m',target:0}],thresholds:{http_req_duration:['p(95)<500'],http_req_failed:['rate<0.01']}};
export default()=>{const B=__ENV.BASE||'http://localhost:3000';check(http.get(B+'/health'),{ok:r=>r.status===200});check(http.get(B+'/'),{ok:r=>r.status===200});sleep(1)}
