import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { AppointmentsService, AppointmentDto } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AppointmentDto[]> {
    return this.appointments.findInRange(tenantId, { date, from, to });
  }

  @Post()
  @HttpCode(201)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentDto> {
    return this.appointments.create(tenantId, dto);
  }
}
