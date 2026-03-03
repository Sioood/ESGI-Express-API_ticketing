const request = require('supertest');
const { createTestApp } = require('./test-utils');

let app;
let support1Token;
let support2Token;
let aliceToken;
let alexToken;
let ticketId;
let support1Id;

beforeAll(async () => {
  app = await createTestApp();

  // Create supports
  const support1Res = await request(app).post('/users').send({
    name: 'Sophie Support',
    email: 'sophie@example.com',
    password: 'password',
    role: 'support',
  });

  const support2Res = await request(app).post('/users').send({
    name: 'Sam Support',
    email: 'sam@example.com',
    password: 'password',
    role: 'support',
  });

  support1Id = support1Res.body.id;

  // Create collaborators
  await request(app).post('/users').send({
    name: 'Alice Collaborator',
    email: 'alice@example.com',
    password: 'password',
    role: 'collaborator',
  });

  await request(app).post('/users').send({
    name: 'Alex Collaborator',
    email: 'alex@example.com',
    password: 'password',
    role: 'collaborator',
  });

  // Logins
  let res = await request(app).post('/auth/login').send({
    email: 'sophie@example.com',
    password: 'password',
  });
  support1Token = res.body.token;

  res = await request(app).post('/auth/login').send({
    email: 'sam@example.com',
    password: 'password',
  });
  support2Token = res.body.token;

  res = await request(app).post('/auth/login').send({
    email: 'alice@example.com',
    password: 'password',
  });
  aliceToken = res.body.token;

  res = await request(app).post('/auth/login').send({
    email: 'alex@example.com',
    password: 'password',
  });
  alexToken = res.body.token;

  // Create tickets by collaborators
  res = await request(app)
    .post('/tickets')
    .set('Authorization', `Bearer ${aliceToken}`)
    .send({
      title: 'Alice ticket',
      description: 'Issue from Alice',
      category: 'bug',
      priority: 'medium',
    });
  ticketId = res.body.id;

  await request(app)
    .post('/tickets')
    .set('Authorization', `Bearer ${alexToken}`)
    .send({
      title: 'Alex ticket',
      description: 'Issue from Alex',
      category: 'access',
      priority: 'high',
    });
});

describe('Support role permissions', () => {
  test('support sees all tickets', async () => {
    const res = await request(app)
      .get('/tickets')
      .set('Authorization', `Bearer ${support1Token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('support can add internal comments visible only to support', async () => {
    const commentRes = await request(app)
      .post(`/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${support1Token}`)
      .send({
        content: 'Internal note from support',
        internal: true,
      });

    expect(commentRes.statusCode).toBe(201);
    expect(commentRes.body.internal).toBe(true);

    const supportView = await request(app)
      .get(`/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${support2Token}`);

    expect(supportView.statusCode).toBe(200);
    expect(supportView.body.comments.some((c) => c.internal === true)).toBe(true);

    const aliceView = await request(app)
      .get(`/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(aliceView.statusCode).toBe(200);
    expect(aliceView.body.comments.every((c) => c.internal !== true)).toBe(true);
  });

  test('support cannot change priority', async () => {
    const res = await request(app)
      .patch(`/tickets/${ticketId}/priority`)
      .set('Authorization', `Bearer ${support1Token}`)
      .send({ priority: 'critical' });

    expect(res.statusCode).toBe(403);
  });
});

