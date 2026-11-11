import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { chromium } from 'playwright';
import autocannon from 'autocannon';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const verification=path.join(root,'verification');await mkdir(verification,{recursive:true});
process.env.NODE_ENV='test';process.env.JWT_SECRET='isolated-browser-test-secret-0123456789abcdef';process.env.CLIENT_URL='http://127.0.0.1:5000';process.env.EMAIL_NOTIFICATIONS='false';
const checks=[];const errors=[];
let mongo,server,browser;
const mark=name=>{checks.push(name);console.log('PASS:',name);};
const settleScreenshot=async page=>{
  await page.waitForFunction(()=>Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0),null,{timeout:15000});
  await page.evaluate(()=>{for(const animation of document.getAnimations()){if(Number.isFinite(animation.effect?.getTiming().iterations)){try{animation.finish();}catch{/* Some transition effects cannot be finished manually. */}}}});
  // Warm the offscreen image surface before Chromium captures a full page.
  const postImage=page.getByAltText('Post',{exact:true});
  if(await postImage.count()){await postImage.last().scrollIntoViewIfNeeded();await page.waitForTimeout(150);await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);}
};
try{
  mongo=await MongoMemoryServer.create({instance:{args:['--nounixsocket','--setParameter','diagnosticDataCollectionEnabled=false']}});
  await mongoose.connect(mongo.getUri());
  const {default:app}=await import('../app.js');
  await Promise.all(Object.values(mongoose.models).map(model=>model.init()));
  server=await new Promise(resolve=>{const listening=app.listen(5000,'127.0.0.1',()=>resolve(listening));});
  browser=await chromium.launch({headless:true});
  const recruiter=await browser.newContext({baseURL:process.env.CLIENT_URL,viewport:{width:1440,height:1000}});
  const candidate=await browser.newContext({baseURL:process.env.CLIENT_URL,viewport:{width:1440,height:1000}});
  const page=await candidate.newPage();const admin=await recruiter.newPage();
  for(const p of [page,admin])p.on('pageerror',err=>errors.push(err.message));
  const registered=await recruiter.request.post('/api/auth/register',{data:{firstName:'Recruiter',lastName:'Tester',email:'recruiter@example.com',password:'Password123!'}});assert.equal(registered.status(),201);
  const recruiterId=(await registered.json())._id;
  let jordanId;for(const person of [{firstName:'Jordan',lastName:'Lee',headline:'Product designer · building useful experiences'},{firstName:'Taylor',lastName:'Chen',headline:'Software engineer · curious about what comes next'}]){const discovery=await browser.newContext({baseURL:process.env.CLIENT_URL});const response=await discovery.request.post('/api/auth/register',{data:{firstName:person.firstName,lastName:person.lastName,email:person.firstName.toLowerCase()+'@example.com',password:'Password123!'}});assert.equal(response.status(),201);const profile=await response.json();if(person.firstName==='Jordan')jordanId=profile._id;await discovery.request.put('/api/users/profile',{data:{headline:person.headline}});await discovery.close();}
  await page.goto('/register');await page.screenshot({path:path.join(verification,'register-desktop.png'),animations:'disabled'});
  await page.getByLabel(/First Name/i).fill('Candidate');await page.getByLabel(/Last Name/i).fill('Tester');await page.getByLabel(/Email/i).fill('candidate@example.com');
  await page.locator('input[name="password"]').fill('Password123!');await page.locator('input[name="confirmPassword"]').fill('Password123!');
  await page.locator('button[type="submit"]').click();await page.waitForURL('**/feed');await page.getByRole('button',{name:/Start a post/}).waitFor();mark('Registration through the real website');
  const scene=page.getByTestId('career-constellation');await scene.locator('canvas').waitFor();await page.waitForFunction(()=>document.querySelector('[data-testid=career-constellation]')?.dataset.status==='ready');
  await page.waitForFunction(()=>Number(document.querySelector('.constellation-mount').dataset.sceneTime)>.05);
  await page.getByRole('button',{name:'Pause constellation motion',exact:true}).click();
  const pausedTime=await scene.locator('.constellation-mount').getAttribute('data-scene-time');await page.waitForTimeout(250);assert.equal(await scene.locator('.constellation-mount').getAttribute('data-scene-time'),pausedTime);
  const beforeTilt=await scene.locator('canvas').screenshot();await scene.focus();await page.keyboard.press('ArrowRight');const afterTilt=await scene.locator('canvas').screenshot();assert(!beforeTilt.equals(afterTilt),'Keyboard tilt should redraw the scene');
  for(const mode of ['Orbit','Density','Synapse']){await page.getByRole('button',{name:mode+' display',exact:true}).click();await page.waitForFunction(expected=>{const el=document.querySelector('[data-testid=career-constellation]');return el?.dataset.mode===expected&&el?.dataset.status==='ready'&&el.querySelectorAll('canvas').length===1;},mode);assert.equal(await scene.locator('canvas').count(),1);}
  await page.getByRole('button',{name:'Resume constellation motion',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('.constellation-mount').dataset.sceneTime)>.05);
  mark('Three.js renders, pauses, responds to keyboard tilt, and switches all three display modes');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[data-testid=career-constellation]')?.dataset.motion==='paused');const reducedTime=await scene.locator('.constellation-mount').getAttribute('data-scene-time');await page.waitForTimeout(250);assert.equal(await scene.locator('.constellation-mount').getAttribute('data-scene-time'),reducedTime);await page.emulateMedia({reducedMotion:'no-preference'});mark('System reduced-motion preference stops the 3D animation');
  const fallback=await candidate.newPage();fallback.on('pageerror',err=>errors.push(err.message));await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};});await fallback.goto('/feed');await fallback.waitForFunction(()=>document.querySelector('[data-testid=career-constellation]')?.dataset.status==='unavailable');await fallback.getByRole('button',{name:/Start a post/}).waitFor();await fallback.screenshot({path:path.join(verification,'webgl-fallback.png'),animations:'disabled'});await fallback.close();mark('Static constellation fallback keeps the website usable without WebGL');
  await page.getByRole('link',{name:'Post',exact:true}).click();await page.getByRole('dialog').getByLabel(/Post content/).waitFor();await page.getByRole('button',{name:'Close post',exact:true}).click();mark('Header Post shortcut opens the working composer');
  await page.getByRole('link',{name:'Jordan Lee',exact:true}).locator('..').getByRole('button',{name:'Connect',exact:true}).click();await page.getByRole('link',{name:'Jordan Lee',exact:true}).waitFor({state:'hidden'});assert.equal((await (await candidate.request.get('/api/connections/status/'+jordanId)).json()).status,'pending');mark('Feed sidebar suggestions send a real invitation and refresh after success');
  assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);assert.equal(await page.evaluate(()=>document.cookie.includes('accessToken')),false);mark('Session tokens are absent from browser storage and document.cookie');
  await page.goto('/profile');await page.getByRole('button',{name:'Edit Profile',exact:true}).click();await page.getByLabel('Headline',{exact:true}).fill('React developer in Pune');await page.getByLabel('Bio',{exact:true}).fill('I build accessible professional applications.');await page.getByRole('button',{name:'Save Changes',exact:true}).click();await page.getByText('React developer in Pune',{exact:true}).first().waitFor();mark('Profile edits persist and update the current user');
  const png=await readFile(path.join(root,'backend/tests/fixtures/avatar.png'));const postPng=await readFile(path.join(root,'backend/tests/fixtures/post.png'));
  await page.locator('input[type=file]').first().setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:png});
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('img')).some(img=>img.src.includes('/uploads/')&&img.complete&&img.naturalWidth>0));mark('Profile image upload renders an actual image');
  await page.goto('/feed');await page.getByRole('button',{name:/Start a post/}).click();await page.getByLabel(/Post content/).fill('Browser-tested post with a photo');await page.locator('input[type=file]').setInputFiles({name:'post.png',mimeType:'image/png',buffer:postPng});await page.getByAltText('Post attachment preview').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Post',exact:true}).click();await page.getByText('Browser-tested post with a photo',{exact:true}).first().waitFor();mark('Text and media post creation');
  await admin.goto('/feed');await admin.getByText('Browser-tested post with a photo',{exact:true}).first().waitFor();await admin.getByText('Like',{exact:true}).first().click();await admin.getByText('Comment',{exact:true}).first().click();await admin.getByPlaceholder('Add a comment...').fill('A useful update');await admin.locator('form').filter({has:admin.getByPlaceholder('Add a comment...')}).locator('button[type=submit]').click();await admin.getByText('A useful update',{exact:true}).waitFor();mark('Like and comment interactions from another account');
  await page.goto(`/profile/${recruiterId}`);await page.getByRole('button',{name:/Connect/}).click();await page.getByText('Pending',{exact:true}).waitFor();
  await admin.goto('/network');await admin.getByRole('tab',{name:/Invitations/}).click();await admin.getByRole('button',{name:'Accept',exact:true}).click();await admin.getByRole('tab',{name:/My Network \(1\)/}).waitFor();
  const connections=await (await candidate.request.get('/api/connections')).json();assert(connections.some(c=>c._id===recruiterId));mark('Send and accept connection invitations');
  await admin.goto('/jobs');await admin.getByRole('button',{name:'Post a job',exact:true}).click();const editor=admin.getByRole('dialog');await editor.getByLabel(/Job title/i).fill('React Internship');await editor.getByLabel(/Company/).fill('ProNet Labs');await editor.getByLabel(/Location/).fill('Pune');await editor.getByLabel(/Description/).fill('Help us build professional networking features.');await editor.getByRole('button',{name:'Publish job',exact:true}).click();await admin.getByText('Job published.',{exact:true}).waitFor();mark('Recruiter creates a job using the website');
  await page.goto('/jobs');await page.getByLabel('Job title or company',{exact:true}).fill('React');await page.getByLabel('Location',{exact:true}).fill('Pune');await page.getByRole('button',{name:'Search',exact:true}).click();await page.getByRole('button',{name:'Apply now',exact:true}).click();const apply=page.getByRole('dialog');await apply.getByLabel(/Cover letter/).fill('My React and Node.js experience fits this role.');await apply.getByLabel(/Resume URL/).fill('https://example.com/candidate-resume.pdf');await apply.getByRole('button',{name:'Submit application',exact:true}).click();await page.getByText(/Your application was submitted/).waitFor();
  await page.getByRole('tab',{name:'My applications',exact:true}).click();await page.getByText('submitted',{exact:true}).waitFor();mark('Filtered job search, application form, and persistent application history');
  await admin.getByRole('tab',{name:'Recruiter dashboard',exact:true}).click();await admin.getByRole('button',{name:'View applicants',exact:true}).click();const tracking=admin.getByRole('dialog');await tracking.getByText('Candidate Tester',{exact:true}).waitFor();await tracking.getByLabel('Application status',{exact:true}).click();await admin.getByRole('option',{name:'shortlisted',exact:true}).click();await admin.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
  await page.reload();await page.getByText('shortlisted',{exact:true}).waitFor();mark('Recruiter applicant tracking and candidate status updates survive reload');
  await admin.getByRole('button',{name:'Close listing',exact:true}).click();await admin.getByText('Closed',{exact:true}).waitFor();mark('Recruiter closes a listing');
  // Check notifications in both palettes and across mobile/tablet/desktop.
  await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByRole('menu').getByText(/application.*shortlisted/i).waitFor();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/Switch to dark mode/}).click();await page.getByRole('button',{name:'Notifications',exact:true}).click();
  const paper=page.getByRole('menu').locator('..');assert.notEqual(await paper.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');await page.keyboard.press('Escape');await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('theme')),'dark');mark('Persistent dark theme and real notification dropdown');await page.goto('/feed');await page.getByAltText('Post',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('[data-testid=career-constellation]')?.dataset.status==='ready');await page.getByRole('button',{name:'Pause constellation motion',exact:true}).click();await settleScreenshot(page);await page.screenshot({path:path.join(verification,'feed-dark-desktop.png'),fullPage:true,animations:'disabled'});
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const route of ['/feed','/profile','/network','/jobs?tab=recruiter','/jobs?tab=applications']){
      await page.goto(route);await page.locator('main').count();await page.getByRole('button',{name:'Notifications',exact:true}).waitFor();
      await page.locator('.MuiCircularProgress-root').first().waitFor({state:'hidden'}).catch(()=>{});
      const overflow=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));assert(overflow.content<=overflow.width+1,`Horizontal overflow at ${route}, width ${width}: ${overflow.content}`);
    }
    await page.goto('/feed');await page.getByText('Browser-tested post with a photo',{exact:true}).first().waitFor();const lightToggle=page.getByRole('button',{name:'Switch to light mode',exact:true});if(await lightToggle.count())await lightToggle.click();await page.getByRole('button',{name:'Pause constellation motion',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-testid=career-constellation]')?.dataset.status==='ready');await page.getByAltText('Post',{exact:true}).waitFor();await settleScreenshot(page);await page.screenshot({path:path.join(verification,`feed-${width}.png`),fullPage:true,animations:'disabled'});
  }
  mark('Five authenticated screens have no horizontal overflow at 390, 768, and 1440 px');
  await page.setViewportSize({width:1440,height:1000});
  for(const route of ['network','profile','jobs']){await page.goto('/'+route);await page.locator('.MuiCircularProgress-root').first().waitFor({state:'hidden'}).catch(()=>{});await page.getByRole('button',{name:'Notifications',exact:true}).waitFor();await page.screenshot({path:path.join(verification,route+'-desktop.png'),fullPage:true,animations:'disabled'});}
  await page.goto('/feed');await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('menuitem',{name:'Sign Out',exact:true}).click();await page.waitForURL('**/login');await page.screenshot({path:path.join(verification,'login-desktop.png'),fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});for(const route of ['/login','/register']){await page.goto(route);assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=390);await page.screenshot({path:path.join(verification,route.slice(1)+'-mobile.png'),fullPage:true,animations:'disabled'});}await page.goto('/login');await page.setViewportSize({width:1440,height:1000});
  mark('Login and registration layouts fit mobile and desktop');await page.getByLabel(/Email/i).fill('candidate@example.com');await page.locator('input[name=password]').fill('Password123!');await page.locator('button[type=submit]').click();await page.waitForURL('**/feed');mark('Sign out and sign in through the website');
  assert.deepEqual(errors,[]);mark('No uncaught browser JavaScript errors');
  const load=await autocannon({url:process.env.CLIENT_URL+'/api/health',connections:10,duration:3});
  assert(load.requests.total>300);assert(load.statusCodeStats['429']?.count>0);assert.equal(load.errors,0);mark('autocannon burst exercises rate limiting without connection errors');
  const report={checks,uncaughtErrors:errors,load:{requests:load.requests.total,averageLatencyMs:load.latency.average,statusCodes:load.statusCodeStats,connectionErrors:load.errors}};
  await writeFile(path.join(verification,'browser-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(err){if(browser){let n=0;for(const context of browser.contexts())for(const page of context.pages()){await page.screenshot({path:path.join(verification,`failure-${n}.png`),fullPage:true}).catch(()=>{});await writeFile(path.join(verification,`failure-${n}.html`),await page.content().catch(()=>''));n++;}}await writeFile(path.join(verification,'browser-failure.txt'),String(err.stack));console.error(err);process.exitCode=1;}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();if(mongo)await mongo.stop();}
