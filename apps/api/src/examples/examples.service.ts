import type { ExampleItem, ListExamplesResponse } from '@blog/shared-contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateExampleBodyDto } from './dto/create-example-body.dto';
import type { ListExamplesQueryDto } from './dto/list-examples-query.dto';
import type { UpdateExampleBodyDto } from './dto/update-example-body.dto';

@Injectable()
export class ExamplesService {
  private readonly items = new Map<string, ExampleItem>();

  create(body: CreateExampleBodyDto): ExampleItem {
    const now = new Date().toISOString();
    const item: ExampleItem = {
      id: randomUUID(),
      title: body.title,
      body: body.body,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(item.id, item);
    return item;
  }

  findAll(query: ListExamplesQueryDto): ListExamplesResponse {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sorted = [...this.items.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    const total = sorted.length;
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);

    return {
      items,
      page,
      limit,
      total,
    };
  }

  findOne(id: string): ExampleItem {
    const item = this.items.get(id);

    if (item === undefined) {
      throw new NotFoundException(`Example ${id} not found`);
    }

    return item;
  }

  update(id: string, body: UpdateExampleBodyDto): ExampleItem {
    const existing = this.findOne(id);
    const updated: ExampleItem = {
      ...existing,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.items.has(id)) {
      throw new NotFoundException(`Example ${id} not found`);
    }

    this.items.delete(id);
  }
}
