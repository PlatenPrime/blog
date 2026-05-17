import type { ExampleItem, ListExamplesResponse } from '@blog/shared-contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateExampleBodyDto } from './dto/create-example-body.dto';
import { ListExamplesQueryDto } from './dto/list-examples-query.dto';
import { UpdateExampleBodyDto } from './dto/update-example-body.dto';
import { ExamplesService } from './examples.service';

@Controller('examples')
export class ExamplesController {
  constructor(private readonly examples: ExamplesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateExampleBodyDto): ExampleItem {
    return this.examples.create(body);
  }

  @Get()
  findAll(@Query() query: ListExamplesQueryDto): ListExamplesResponse {
    return this.examples.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): ExampleItem {
    return this.examples.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateExampleBodyDto,
  ): ExampleItem {
    return this.examples.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.examples.remove(id);
  }
}
