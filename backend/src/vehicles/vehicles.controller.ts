import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { VehicleStatusHistory } from './vehicle-status-history.entity';
import { ChangeStatusDto } from './dto/change-status.dto';

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

  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string): Promise<VehicleStatusHistory[]> {
    return this.vehiclesService.getStatusHistory(id);
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

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeStatusDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Vehicle> {
    return this.vehiclesService.changeStatus(id, body.status, req.user.nickname, body.notes);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { nickname: string } },
  ): Promise<object> {
    return this.vehiclesService.remove(id, req.user.nickname);
  }
}
