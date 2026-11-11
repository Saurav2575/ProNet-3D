import autocannon from 'autocannon';
const url=process.argv[2]||'http://localhost:5000/api/health';
if(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) throw new Error('This load test is restricted to your local development server.');
const result=await autocannon({url,connections:10,duration:5});
console.log(JSON.stringify({url,requests:result.requests.total,averageLatencyMs:result.latency.average,non2xx:result.non2xx,statusCodes:result.statusCodeStats},null,2));
