import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let rabbitClient: ClientProxy;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    dataSource = app.get<DataSource>('DATA_SOURCE');
    rabbitClient = app.get<ClientProxy>('RABBITMQ_CLIENT');
  });

  it('/ (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/').expect(401);
  });

  it('/auth/login (POST) rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'aivacol', password: 'wrong-password' })
      .expect(401);
  });

  it('logs in and reaches a protected route with the issued access token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'aivacol', password: 'aivacol' })
      .expect(201);

    expect(loginRes.body.access_token).toBeDefined();

    await request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Bearer ${loginRes.body.access_token}`)
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
    await dataSource.destroy();
    rabbitClient.close();
  });
});
