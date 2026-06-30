import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(): Promise<Vehicle[]> {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  create(
    @Body() body: Partial<Vehicle>,
    @Request() req: { user: { nickname: string } },
  ): Promise<Vehicle> {
    return this.vehiclesService.create(body, req.user.nickname);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<Vehicle>,
    @Request() req: { user: { nickname: string } },
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, body, req.user.nickname);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { nickname: string } },
  ): Promise<object> {
    return this.vehiclesService.remove(id, req.user.nickname);
  }
}
