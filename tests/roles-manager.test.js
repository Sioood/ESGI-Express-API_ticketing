const request = require('supertest');
const { createTestApp } = require('./test-utils');

let app;
let aliceToken;
let alexToken;
let bobToken;
let biancaToken;
let aliceTicketId;
let alexTicketId;

beforeAll(async () => {
  app = await createTestApp();

  // Create managers
  const bobRes = await request(app).post('/users').send({
    name: 'Bob Manager',
    email: 'bob@example.com',
    password: 'password',
    role: 'manager',
  });

  const biancaRes = await request(app).post('/users').send({
    name: 'Bianca Manager',
    email: 'bianca@example.com',
    password: 'password',
    role: 'manager',
  });

  const bobId = bobRes.body.id;
  const biancaId = biancaRes.body.id;

  // Create collaborators and assign managers
  await request(app).post('/users').send({
    name: 'Alice Collaborator',
    email: 'alice@example.com',
    password: 'password',
    role: 'collaborator',
    managerId: bobId,
  });

  await request(app).post('/users').send({
    name: 'Alex Collaborator',
    email: 'alex@example.com',
    password: 'password',
    role: 'collaborator',
    managerId: biancaId,
  });

  // Login all
  let res = await request(app).post('/auth/login').send({
    email: 'alice@example.com',
    password: 'password',
  });
  aliceToken = res.body.token;

  res = await request(app).post('/auth/login').send({
    email: 'alex@example.com',
    password: 'password',
  });
  alexToken = res.body.token;

  res = await request(app).post('/auth/login').send({
    email: 'bob@example.com',
    password: 'password',
  });
  bobToken = res.body.token;

  res = await request(app).post('/auth/login').send({
    email: 'bianca@example.com',
    password: 'password',
  });
  biancaToken = res.body.token;

  // Each collaborator creates one ticket
  res = await request(app)
    .post('/tickets')
    .set('Authorization', `Bearer ${aliceToken}`)
    .send({
      title: 'Alice ticket',
      description: 'Alice issue',
      category: 'bug',
      priority: 'medium',
    });
  aliceTicketId = res.body.id;

  res = await request(app)
    .post('/tickets')
    .set('Authorization', `Bearer ${alexToken}`)
    .send({
      title: 'Alex ticket',
      description: 'Alex issue',
      category: 'hardware',
      priority: 'low',
    });
  alexTicketId = res.body.id;
});

describe('Manager role permissions', () => {
  test('manager sees tickets of own team and not others', async () => {
    const bobTickets = await request(app)
      .get('/tickets')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(bobTickets.statusCode).toBe(200);
    expect(Array.isArray(bobTickets.body)).toBe(true);
    expect(bobTickets.body.some((t) => t.id === aliceTicketId)).toBe(true);
    expect(bobTickets.body.some((t) => t.id === alexTicketId)).toBe(false);

  });

  test('manager can change priority including critical for team tickets', async () => {
    const res = await request(app)
      .patch(`/tickets/${aliceTicketId}/priority`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ priority: 'critical' });

    expect(res.statusCode).toBe(200);
    expect(res.body.priority).toBe('critical');
  });

  test('manager cannot change priority of tickets outside team', async () => {
    const res = await request(app)
      .patch(`/tickets/${aliceTicketId}/priority`)
      .set('Authorization', `Bearer ${biancaToken}`)
      .send({ priority: 'high' });

    expect(res.statusCode).toBe(403);
  });

  test('manager cannot perform support-only status transitions', async () => {
    const res = await request(app)
      .patch(`/tickets/${aliceTicketId}/status`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ status: 'assigned' });

    expect(res.statusCode).toBe(403);
  });
});

