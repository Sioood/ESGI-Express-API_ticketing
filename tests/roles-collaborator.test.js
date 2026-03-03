const request = require('supertest');
const { createTestApp } = require('./test-utils');

let app;
let aliceToken;
let alexToken;
let aliceTicketId;

beforeAll(async () => {
  app = await createTestApp();

  // Create two collaborators
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

  // Login both
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
});

describe('Collaborator role permissions', () => {
  test('collaborator can create non-critical tickets', async () => {
    const res = await request(app)
      .post('/tickets')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Alice ticket',
        description: 'Issue from Alice',
        category: 'bug',
        priority: 'high',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.priority).toBe('high');
    expect(res.body.status).toBe('open');
    aliceTicketId = res.body.id;
  });

  test('collaborator cannot create critical tickets', async () => {
    const res = await request(app)
      .post('/tickets')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Critical attempt',
        description: 'Should fail',
        category: 'bug',
        priority: 'critical',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  test('collaborator sees only own tickets', async () => {
    // Alex creates his own ticket
    await request(app)
      .post('/tickets')
      .set('Authorization', `Bearer ${alexToken}`)
      .send({
        title: 'Alex ticket',
        description: 'Issue from Alex',
        category: 'access',
        priority: 'medium',
      });

    const aliceList = await request(app)
      .get('/tickets')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(aliceList.statusCode).toBe(200);
    expect(Array.isArray(aliceList.body)).toBe(true);
    expect(aliceList.body.every((t) => t.authorId !== undefined)).toBe(true);
    const uniqueAuthorIds = new Set(aliceList.body.map((t) => t.authorId));
    expect(uniqueAuthorIds.size).toBe(1);

    const alexList = await request(app)
      .get('/tickets')
      .set('Authorization', `Bearer ${alexToken}`);

    expect(alexList.statusCode).toBe(200);
    const alexAuthorIds = new Set(alexList.body.map((t) => t.authorId));
    expect(alexAuthorIds.size).toBe(1);
    expect(uniqueAuthorIds).not.toEqual(alexAuthorIds);
  });

  test('collaborator cannot see other collaborator ticket by id', async () => {
    // Get one of Alice tickets, then Alex tries to access it
    const aliceTickets = await request(app)
      .get('/tickets')
      .set('Authorization', `Bearer ${aliceToken}`);

    const ticket = aliceTickets.body[0];

    const res = await request(app)
      .get(`/tickets/${ticket.id}`)
      .set('Authorization', `Bearer ${alexToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('collaborator can add non-internal comments on own ticket', async () => {
    const res = await request(app)
      .post(`/tickets/${aliceTicketId}/comments`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        content: 'Alice public comment',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.internal).toBe(false);
  });

  test('collaborator cannot add internal comments', async () => {
    const res = await request(app)
      .post(`/tickets/${aliceTicketId}/comments`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        content: 'Alice internal attempt',
        internal: true,
      });

    expect(res.statusCode).toBe(403);
  });

  test('collaborator can cancel own open ticket but not others', async () => {
    // Alice cancels her open ticket
    let res = await request(app)
      .patch(`/tickets/${aliceTicketId}/status`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ status: 'cancelled' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('cancelled');

    // Alex tries to cancel Alice ticket
    res = await request(app)
      .patch(`/tickets/${aliceTicketId}/status`)
      .set('Authorization', `Bearer ${alexToken}`)
      .send({ status: 'cancelled' });

    expect(res.statusCode).toBe(403);
  });
});

