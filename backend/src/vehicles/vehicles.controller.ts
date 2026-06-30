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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { VehicleStatusHistory } from './vehicle-status-history.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

@ApiTags('vehicles')
@ApiBearerAuth('access-token')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active vehicles' })
  findAll(): Promise<Vehicle[]> {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by ID' })
  findOne(@Param('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get the full status-change history of a vehicle' })
  getStatusHistory(@Param('id') id: string): Promise<VehicleStatusHistory[]> {
    return this.vehiclesService.getStatusHistory(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  create(
    @Body() body: CreateVehicleDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Vehicle> {
    return this.vehiclesService.create(body, req.user.nickname);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle data' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateVehicleDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, body, req.user.nickname);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change the operational status of a vehicle' })
  changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeStatusDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Vehicle> {
    return this.vehiclesService.changeStatus(
      id,
      body.status,
      req.user.nickname,
      body.notes,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete a vehicle (sets active = false, status = inativo)',
  })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { nickname: string } },
  ): Promise<object> {
    return this.vehiclesService.remove(id, req.user.nickname);
  }
}
