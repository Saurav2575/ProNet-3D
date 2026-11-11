import { jest, beforeAll, afterAll, afterEach, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Connection from '../models/Connection.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import { invalidateFeed, closeCache } from '../services/cache.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import { uploadImage } from '../services/cloudinary.js';
import { sendNotificationEmail, networkingEmail } from '../services/email.js';
let mongo, alice, bob, charlie;
const signup = async (name = 'alice') => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ firstName: name, lastName: 'Tester', email: `${name}@example.com`, password: 'password123' }).expect(201);
  return { agent, user: res.body, cookies: res.headers['set-cookie'] };
};
const post = async (account = alice, content = 'A professional update') => (await account.agent.post('/api/posts').send({ content }).expect(201)).body;
const job = async () => (await alice.agent.post('/api/jobs').send({ title: 'React developer', company: 'Example company', location: 'Pune', type: 'internship', description: 'Build accessible React interfaces.' }).expect(201)).body;
const application = { coverLetter: 'I have experience building React applications.', resumeUrl: 'https://example.com/resume.pdf' };
beforeAll(async () => { mongo = await MongoMemoryServer.create({ instance: { args: ['--nounixsocket', '--setParameter', 'diagnosticDataCollectionEnabled=false'] } }); await mongoose.connect(mongo.getUri()); await Promise.all([User, Post, Connection, Job, Application, Notification].map(m => m.init())); });
beforeEach(async () => { alice = await signup('alice'); bob = await signup('bob'); charlie = await signup('charlie'); });
afterEach(async () => { jest.restoreAllMocks(); if(mongoose.connection.readyState!==1) return; await Promise.all(Object.values(mongoose.connection.collections).map(c => c.deleteMany({}))); await invalidateFeed(); });
afterAll(async () => { await closeCache(); await mongoose.disconnect(); if(mongo) await mongo.stop(); });
test('registration hashes passwords, sets HTTP-only cookies, and omits credentials from JSON', async () => {
  expect(alice.cookies.every(c => c.includes('HttpOnly') && c.includes('SameSite=Lax'))).toBe(true);
  expect(alice.user.token).toBeUndefined(); expect(alice.user.password).toBeUndefined();
  const record = await User.findById(alice.user._id).select('+password'); expect(record.password).not.toBe('password123'); expect(await record.matchPassword('password123')).toBe(true);
  const me = await alice.agent.get('/api/auth/me').expect(200); expect(me.body.refreshSessions).toBeUndefined();
});
test('duplicate emails normalize case and return a helpful conflict', async () => { await request(app).post('/api/auth/register').send({ firstName: 'Another', lastName: 'Tester', email: 'ALICE@EXAMPLE.COM', password: 'password123' }).expect(409); });
test('bad login and malformed registration return 401/400 without crashing', async () => {
  await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrong' }).expect(401);
  await request(app).post('/api/auth/register').send({ firstName: ' ', email: 'invalid', password: 'a' }).expect(400);
  await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: 'password123' }).expect(400);
});
test('expired access tokens refresh and refresh cookies cannot be replayed', async () => {
  const cookies = alice.cookies.map(c => c.split(';')[0]);
  const access = cookies.find(c => c.startsWith('accessToken=')).split('=')[1];
  const claims = jwt.verify(decodeURIComponent(access), process.env.JWT_SECRET);
  const expired = jwt.sign({ id: claims.id, type: 'access', sessionId: claims.sessionId }, process.env.JWT_SECRET, { expiresIn: -1 });
  await request(app).get('/api/auth/me').set('Cookie', `accessToken=${expired}`).expect(401);
  const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
  const renewed = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie).expect(200);
  const newAccess = renewed.headers['set-cookie'].find(c => c.startsWith('accessToken=')).split(';')[0];
  await request(app).get('/api/auth/me').set('Cookie', newAccess).expect(200);
  await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie).expect(401);
});
test('logout revokes the session including previously copied access cookies', async () => {
  await alice.agent.post('/api/auth/logout').expect(200);
  await alice.agent.get('/api/auth/me').expect(401);
  await request(app).get('/api/auth/me').set('Cookie', alice.cookies.map(c => c.split(';')[0])).expect(401);
});
test('security headers and cross-origin write protection are active', async () => {
  const res = await request(app).get('/api/health').expect(200); expect(res.headers['x-content-type-options']).toBe('nosniff'); expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  await alice.agent.post('/api/posts').set('Origin', 'https://other.example').send({ content: 'Blocked write' }).expect(403);
  await alice.agent.post('/api/posts').set('Origin', process.env.CLIENT_URL).send({ content: 'Allowed write' }).expect(201);
});
test('profile edits validate values, prevent protected-field changes, and invalidate cached author data', async () => {
  const p = await post(); await bob.agent.get('/api/posts/feed').expect(200);
  const res = await alice.agent.put('/api/users/profile').send({ headline: 'Frontend engineer', skills: ['React', 'Node.js'], password: 'attacker', connections: [bob.user._id], email: 'different@example.com' }).expect(200);
  expect(res.body.skills).toEqual(['React', 'Node.js']); expect(res.body.email).toBe('alice@example.com'); expect(res.body.connectionCount).toBe(0);
  const feed = await bob.agent.get('/api/posts/feed').expect(200); expect(feed.body.posts.find(x => x._id === p._id).author.headline).toBe('Frontend engineer');
  await alice.agent.put('/api/users/profile').send({ skills: 'invalid' }).expect(400);
  await alice.agent.put('/api/users/profile').send({ bio: 'x'.repeat(2001) }).expect(400);
});
test('image upload stores actual files and rejects forged and oversized uploads', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a32sAAAAASUVORK5CYII=', 'base64');
  const res = await alice.agent.post('/api/uploads').field('folder', 'profiles').attach('image', png, { filename: 'avatar.png', contentType: 'image/png' }).expect(201);
  expect(res.body.url).toMatch(/^\/uploads\/.*\.png$/); await request(app).get(res.body.url).expect(200);
  await alice.agent.put('/api/users/profile').send({ avatar: res.body.url }).expect(200);
  await alice.agent.post('/api/uploads').attach('image', Buffer.from('not an image'), { filename: 'fake.png', contentType: 'image/png' }).expect(400);
  await alice.agent.post('/api/uploads').attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'big.png', contentType: 'image/png' }).expect(400);
  await request(app).post('/api/uploads').attach('image', png, 'avatar.png').expect(401);
});
test('feed pagination is chronological, bounded, and supports the connections scope', async () => {
  await post(alice, 'First'); await post(bob, 'Second'); await post(charlie, 'Third');
  const first = await alice.agent.get('/api/posts/feed?page=1&limit=2').expect(200);
  const second = await alice.agent.get('/api/posts/feed?page=2&limit=2').expect(200);
  expect(first.body.total).toBe(3); expect(first.body.pages).toBe(2); expect(first.body.posts[0].content).toBe('Third'); expect(second.body.posts[0].content).toBe('First');
  const own = await alice.agent.get('/api/posts/feed?scope=network').expect(200); expect(own.body.posts.map(p => p.content)).toEqual(['First']);
  await alice.agent.get('/api/posts/feed?page=-1').expect(400); await alice.agent.get('/api/posts/feed?limit=999').expect(400);
});
test('post content validation, media attachments, and deletion ownership work', async () => {
  await alice.agent.post('/api/posts').send({ content: ' ' }).expect(400);
  await alice.agent.post('/api/posts').send({ content: 'x'.repeat(3001) }).expect(400);
  const p = (await alice.agent.post('/api/posts').send({ content: 'Media post', image: 'https://example.com/photo.png' }).expect(201)).body;
  await bob.agent.delete(`/api/posts/${p._id}`).expect(403); await alice.agent.delete(`/api/posts/${p._id}`).expect(200);
  expect((await bob.agent.get('/api/posts/feed')).body.total).toBe(0);
});
test('concurrent likes from different users retain every like and toggle atomically', async () => {
  const p = await post();
  await Promise.all([bob.agent.put(`/api/posts/${p._id}/like`).expect(200), charlie.agent.put(`/api/posts/${p._id}/like`).expect(200)]);
  const updated = await Post.findById(p._id); expect(updated.likes).toHaveLength(2);
  const toggled = await bob.agent.put(`/api/posts/${p._id}/like`).expect(200); expect(toggled.body.liked).toBe(false); expect(toggled.body.likeIds).toHaveLength(1);
  expect((await alice.agent.get('/api/posts/feed')).body.posts[0].likes).toHaveLength(1);
});
test('concurrent comments persist, authors populate, and invalid comments are rejected', async () => {
  const p = await post();
  await Promise.all([bob.agent.post(`/api/posts/${p._id}/comments`).send({ text: 'Great work' }).expect(201), charlie.agent.post(`/api/posts/${p._id}/comments`).send({ text: 'Useful update' }).expect(201)]);
  const feed = await alice.agent.get('/api/posts/feed'); expect(feed.body.posts[0].comments).toHaveLength(2); expect(feed.body.posts[0].comments.every(c => c.author.firstName)).toBe(true);
  await bob.agent.post(`/api/posts/${p._id}/comments`).send({ text: ' ' }).expect(400);
  await bob.agent.post(`/api/posts/${p._id}/comments`).send({ text: 'x'.repeat(1001) }).expect(400);
});
test('connection requests validate IDs, prevent self/duplicate requests, and enforce recipient ownership', async () => {
  await alice.agent.post('/api/connections/request/not-an-id').expect(400);
  await alice.agent.post(`/api/connections/request/${alice.user._id}`).expect(400);
  await alice.agent.post('/api/connections/request/000000000000000000000000').expect(404);
  const c = (await alice.agent.post(`/api/connections/request/${bob.user._id}`).expect(201)).body;
  await alice.agent.post(`/api/connections/request/${bob.user._id}`).expect(409);
  await charlie.agent.put(`/api/connections/${c._id}/respond`).send({ action: 'accept' }).expect(403);
  await bob.agent.put(`/api/connections/${c._id}/respond`).send({ action: 'wrong' }).expect(400);
  await bob.agent.put(`/api/connections/${c._id}/respond`).send({ action: 'accept' }).expect(200);
  expect((await alice.agent.get('/api/connections')).body[0]._id).toBe(bob.user._id);
  expect((await bob.agent.get('/api/connections')).body[0]._id).toBe(alice.user._id);
  await bob.agent.put(`/api/connections/${c._id}/respond`).send({ action: 'accept' }).expect(409);
});
test('opposite concurrent invitations cannot create duplicate relationships', async () => {
  const results = await Promise.all([alice.agent.post(`/api/connections/request/${bob.user._id}`), bob.agent.post(`/api/connections/request/${alice.user._id}`)]);
  expect(results.map(r => r.status).sort()).toEqual([201, 409]); expect(await Connection.countDocuments()).toBe(1);
});
test('rejected invitations can be sent again and pending people are excluded from suggestions', async () => {
  const c = (await alice.agent.post(`/api/connections/request/${bob.user._id}`)).body;
  expect((await alice.agent.get('/api/users/suggestions')).body.some(x => x._id === bob.user._id)).toBe(false);
  await bob.agent.put(`/api/connections/${c._id}/respond`).send({ action: 'reject' }).expect(200);
  await alice.agent.post(`/api/connections/request/${bob.user._id}`).expect(201);
});
test('user search supports partial names and treats regex characters literally', async () => {
  expect((await alice.agent.get('/api/users/search?q=bo')).body[0]._id).toBe(bob.user._id);
  expect((await alice.agent.get('/api/users/search?q=.*')).body).toEqual([]);
  await alice.agent.get('/api/users/search?q=' + 'x'.repeat(151)).expect(400);
});
test('job search combines partial title, location, and type filters', async () => {
  await job();
  expect((await bob.agent.get('/api/jobs?q=Reac&location=pun&type=internship')).body).toHaveLength(1);
  expect((await bob.agent.get('/api/jobs?location=Delhi')).body).toHaveLength(0);
  expect((await bob.agent.get('/api/jobs?q=.*')).body).toHaveLength(0);
  await alice.agent.post('/api/jobs').send({ title: '', company: 'Test' }).expect(400);
});
test('recruiter edits are allowlisted, authorized, and closed jobs reject applications', async () => {
  const j = await job(); await bob.agent.put(`/api/jobs/${j._id}`).send({ title: 'Stolen' }).expect(403);
  await alice.agent.put(`/api/jobs/${j._id}`).send({ title: 'Senior React developer', postedBy: bob.user._id }).expect(200);
  expect(String((await Job.findById(j._id)).postedBy)).toBe(alice.user._id);
  await alice.agent.put(`/api/jobs/${j._id}`).send({ isActive: false }).expect(200);
  await bob.agent.post(`/api/jobs/${j._id}/apply`).send(application).expect(400);
  expect((await bob.agent.get('/api/jobs')).body).toEqual([]);
  await alice.agent.put(`/api/jobs/${j._id}`).send({ isActive: true }).expect(200);
  await alice.agent.post(`/api/jobs/${j._id}/apply`).send(application).expect(400);
});
test('application data rejects empty, malformed, excessively long, and duplicate submissions', async () => {
  const j = await job();
  for (const invalid of [{}, { ...application, coverLetter: ' ' }, { ...application, resumeUrl: 'javascript:alert(1)' }, { ...application, coverLetter: 'x'.repeat(3001) }]) await bob.agent.post(`/api/jobs/${j._id}/apply`).send(invalid).expect(400);
  await bob.agent.post(`/api/jobs/${j._id}/apply`).send(application).expect(201);
  await bob.agent.post(`/api/jobs/${j._id}/apply`).send(application).expect(409);
  expect(await Application.countDocuments()).toBe(1);
});
test('concurrent duplicate applications create only one record', async () => {
  const j = await job(); const results = await Promise.all([bob.agent.post(`/api/jobs/${j._id}/apply`).send(application), bob.agent.post(`/api/jobs/${j._id}/apply`).send(application)]);
  expect(results.map(r => r.status).sort()).toEqual([201,409]); expect(await Application.countDocuments()).toBe(1); expect((await Job.findById(j._id)).applicants).toHaveLength(1);
});
test('application history, recruiter tracking, and status ownership work end to end', async () => {
  const j = await job(); const a = (await bob.agent.post(`/api/jobs/${j._id}/apply`).send(application)).body;
  const history = await bob.agent.get('/api/jobs/applications/mine').expect(200); expect(history.body[0].job.title).toBe(j.title);
  await charlie.agent.get(`/api/jobs/${j._id}/applicants`).expect(403);
  const tracked = await alice.agent.get(`/api/jobs/${j._id}/applicants`).expect(200); expect(tracked.body[0].applicant.email).toBe('bob@example.com');
  await bob.agent.put(`/api/jobs/applications/${a._id}/status`).send({ status: 'hired' }).expect(403);
  await alice.agent.put(`/api/jobs/applications/${a._id}/status`).send({ status: 'invalid' }).expect(400);
  await alice.agent.put(`/api/jobs/applications/${a._id}/status`).send({ status: 'shortlisted' }).expect(200);
  expect((await bob.agent.get('/api/jobs/applications/mine')).body[0].status).toBe('shortlisted');
});
test('notifications are persisted and only the recipient can mark them read', async () => {
  await alice.agent.post(`/api/connections/request/${bob.user._id}`);
  const notifications = (await bob.agent.get('/api/notifications').expect(200)).body; expect(notifications.unread).toBe(1);
  await alice.agent.put(`/api/notifications/${notifications.items[0]._id}/read`).expect(404);
  await bob.agent.put(`/api/notifications/${notifications.items[0]._id}/read`).expect(200);
  expect((await bob.agent.get('/api/notifications')).body.unread).toBe(0);
  await bob.agent.put('/api/notifications/read-all').expect(200);
});
test('database exceptions become structured errors and the server continues responding', async () => {
  jest.spyOn(Post, 'create').mockRejectedValueOnce(new Error('Simulated database failure'));
  const result = await alice.agent.post('/api/posts').send({ content: 'Trigger' }).expect(500); expect(result.body.code).toBe(500); expect(result.body.stack).toBeUndefined();
  await alice.agent.get('/api/auth/me').expect(200);
});
test('malformed IDs across modules return 400 and unknown API routes return JSON 404', async () => {
  for (const path of ['/api/users/bad', '/api/jobs/bad', '/api/connections/status/bad']) await alice.agent.get(path).expect(400);
  await alice.agent.put('/api/posts/bad/like').expect(400); await alice.agent.get('/api/unknown').expect(404);
});
test('rate limiter tolerates the configured burst, then returns 429 with retry headers', async () => {
  const limited = express(); limited.use(createLimiter({ max: 3, windowMs: 60000, message: 'Slow down' })); limited.get('/', (req,res) => res.json({ ok: true }));
  for (let i=0;i<3;i++) await request(limited).get('/').expect(200);
  const res = await request(limited).get('/').expect(429); expect(res.headers['retry-after']).toBeDefined(); expect(res.body.message).toBe('Slow down');
});
test('email templates escape user content and include plain text', () => {
  const email = networkingEmail({ name: '<script>', message: '<b>hello</b>', link: 'https://example.com/network' });
  expect(email.html).toContain('&lt;script&gt;'); expect(email.html).not.toContain('<b>hello</b>'); expect(email.text).toContain('https://example.com/network');
});

test('popular posts use real MongoDB aggregation and cached results invalidate after likes', async () => {
  const older = await post(alice, 'An older useful post'); await post(bob, 'A newer update');
  await charlie.agent.get('/api/posts/popular').expect(200);
  await bob.agent.put(`/api/posts/${older._id}/like`).expect(200);
  const ranked = await charlie.agent.get('/api/posts/popular').expect(200);
  expect(ranked.body[0].content).toBe('An older useful post'); expect(ranked.body[0].likeCount).toBe(1); expect(ranked.body[0].author.firstName).toBe('alice');
});
test('Cloudinary credentials route images through the SDK and return its secure URL', async () => {
  process.env.CLOUDINARY_CLOUD_NAME='test-cloud';process.env.CLOUDINARY_API_KEY='test-key';process.env.CLOUDINARY_API_SECRET='test-secret';
  const uploaded=jest.spyOn(cloudinary.uploader,'upload_stream').mockImplementation((options,callback)=>({end:()=>callback(null,{secure_url:'https://res.cloudinary.com/test-cloud/image/upload/test.png',public_id:'test'})}));
  try {
    const result=await uploadImage(Buffer.from([137,80,78,71,13,10,26,10]),'profiles');
    expect(result.storage).toBe('cloudinary');expect(result.url).toContain('https://res.cloudinary.com');expect(uploaded).toHaveBeenCalled();
  } finally {delete process.env.CLOUDINARY_CLOUD_NAME;delete process.env.CLOUDINARY_API_KEY;delete process.env.CLOUDINARY_API_SECRET;}
});
test('Nodemailer uses the configured SMTP transport without sending a real test email', async () => {
  process.env.SMTP_HOST='smtp.test.invalid';process.env.SMTP_FROM='ProNet <no-reply@example.com>';
  const sendMail=jest.fn().mockResolvedValue({accepted:['alice@example.com']});jest.spyOn(nodemailer,'createTransport').mockReturnValue({sendMail});
  try {
    await sendNotificationEmail({firstName:'Alice',email:'alice@example.com'},{message:'Your invitation was accepted',link:'/network'});
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({to:'alice@example.com',subject:expect.stringContaining('accepted')}));
  }finally{delete process.env.SMTP_HOST;delete process.env.SMTP_FROM;}
});
