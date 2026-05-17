import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExamplesService } from './examples.service';

describe('ExamplesService', () => {
  let service: ExamplesService;

  beforeEach(() => {
    service = new ExamplesService();
  });

  it('creates an example with id and timestamps', () => {
    const item = service.create({
      title: 'Hello',
      body: 'World',
    });

    expect(item.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(item.title).toBe('Hello');
    expect(item.body).toBe('World');
    expect(item.createdAt).toBe(item.updatedAt);
  });

  it('lists examples with pagination', () => {
    service.create({ title: 'A', body: 'a' });
    service.create({ title: 'B', body: 'b' });
    service.create({ title: 'C', body: 'c' });

    const page1 = service.findAll({ page: 1, limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(3);
    expect(page1.page).toBe(1);
    expect(page1.limit).toBe(2);

    const page2 = service.findAll({ page: 2, limit: 2 });
    expect(page2.items).toHaveLength(1);
  });

  it('updates an example and bumps updatedAt', () => {
    const created = service.create({ title: 'Old', body: 'x' });

    const updated = service.update(created.id, { title: 'New' });

    expect(updated.title).toBe('New');
    expect(updated.body).toBe('x');
    expect(updated.updatedAt >= created.updatedAt).toBe(true);
  });

  it('removes an example', () => {
    const created = service.create({ title: 'Delete me', body: 'x' });

    service.remove(created.id);

    expect(() => service.findOne(created.id)).toThrow(NotFoundException);
  });

  it('throws NotFoundException for unknown id', () => {
    expect(() =>
      service.findOne('00000000-0000-4000-8000-000000000000'),
    ).toThrow(NotFoundException);
  });
});
