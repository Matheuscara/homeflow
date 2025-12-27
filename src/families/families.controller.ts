import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { JoinFamilyDto } from './dto/join-family.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('families')
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  create(@Body() createFamilyDto: CreateFamilyDto, @CurrentUser() user: any) {
    return this.familiesService.create(createFamilyDto, user.id);
  }

  @Get('my-family')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  getMyFamily(@CurrentUser() user: any) {
    return this.familiesService.getMyFamily(user.id);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  joinFamily(@Body() joinFamilyDto: JoinFamilyDto, @CurrentUser() user: any) {
    return this.familiesService.joinFamily(joinFamilyDto, user.id);
  }

  @Post('leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  leaveFamily(@CurrentUser() user: any) {
    return this.familiesService.leaveFamily(user.id);
  }

  @Get()
  findAll() {
    return this.familiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFamilyDto: UpdateFamilyDto) {
    return this.familiesService.update(id, updateFamilyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.familiesService.remove(id);
  }
}
