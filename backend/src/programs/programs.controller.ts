import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { ListProgramsQueryDto } from './dto/list-programs-query.dto';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Slug de la categoría',
  })
  findAll(@Query() query: ListProgramsQueryDto) {
    return this.programsService.findAll(query.category);
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', example: 'maestria-gestion-publica-gobernanza' })
  findBySlug(@Param('slug') slug: string) {
    return this.programsService.findBySlug(slug);
  }
}
