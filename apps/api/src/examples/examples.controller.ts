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
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProblemResponse } from '../openapi/api-problem-response.decorator';
import {
  ExampleItemSchema,
  ListExamplesResponseSchema,
} from '../openapi/examples/example-response.schemas';
import { CreateExampleBodyDto } from './dto/create-example-body.dto';
import { ListExamplesQueryDto } from './dto/list-examples-query.dto';
import { UpdateExampleBodyDto } from './dto/update-example-body.dto';
import { ExamplesService } from './examples.service';

@ApiTags('examples')
@Controller('examples')
export class ExamplesController {
  constructor(private readonly examples: ExamplesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create example item' })
  @ApiCreatedResponse({ type: ExampleItemSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST)
  create(@Body() body: CreateExampleBodyDto): ExampleItem {
    return this.examples.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List example items (paginated)' })
  @ApiOkResponse({ type: ListExamplesResponseSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST)
  findAll(@Query() query: ListExamplesQueryDto): ListExamplesResponse {
    return this.examples.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get example item by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ExampleItemSchema })
  @ApiProblemResponse(HttpStatus.NOT_FOUND)
  findOne(@Param('id', ParseUUIDPipe) id: string): ExampleItem {
    return this.examples.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update example item' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ExampleItemSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateExampleBodyDto,
  ): ExampleItem {
    return this.examples.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete example item' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiProblemResponse(HttpStatus.NOT_FOUND)
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.examples.remove(id);
  }
}
