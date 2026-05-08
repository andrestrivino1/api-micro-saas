import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('health')
  async getHealth() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: 'ok' };
    } catch (e) {
      this.logger.error(`health: DB probe failed — ${(e as Error).message}`);
      throw new HttpException(
        { status: 'error', db: 'unreachable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
