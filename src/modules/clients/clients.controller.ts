import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import {
  ClientDetailDto,
  ClientWithPetDto,
  ClientsService,
} from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string): Promise<ClientWithPetDto[]> {
    return this.clients.findAll(tenantId);
  }

  @Get(':id')
  detail(
    @CurrentTenant() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ClientDetailDto> {
    return this.clients.findOne(tenantId, id);
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateClientDto,
  ): Promise<ClientWithPetDto> {
    return this.clients.create(tenantId, dto);
  }
}
