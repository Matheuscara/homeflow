import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { JoinFamilyDto } from './dto/join-family.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FamiliesService {
  constructor(private prisma: PrismaService) { }

  async create(createFamilyDto: CreateFamilyDto, userId: string) {
    // Create family with the current user as admin
    const family = await this.prisma.family.create({
      data: {
        name: createFamilyDto.name,
        adminId: userId,
      },
      include: { users: true },
    });

    // Update user to link to this family
    await this.prisma.user.update({
      where: { id: userId },
      data: { familyId: family.id },
    });

    return family;
  }

  async getMyFamily(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user?.familyId) {
      throw new NotFoundException('You are not part of any family');
    }

    const family = await this.prisma.family.findUnique({
      where: { id: user.familyId },
      include: {
        users: {
          orderBy: { birthDate: 'asc' }, // Oldest first
          select: {
            id: true,
            email: true,
            name: true,
            birthDate: true,
            familyId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }

  async joinFamily(joinFamilyDto: JoinFamilyDto, userId: string) {
    const family = await this.prisma.family.findUnique({
      where: { inviteCode: joinFamilyDto.inviteCode },
      include: { users: true },
    });

    if (!family) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if user already has a family
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.familyId) {
      throw new BadRequestException('You are already part of a family');
    }

    // Update user to link to this family
    await this.prisma.user.update({
      where: { id: userId },
      data: { familyId: family.id },
    });

    // Return updated family with users
    return this.prisma.family.findUnique({
      where: { id: family.id },
      include: {
        users: {
          orderBy: { birthDate: 'asc' },
          select: {
            id: true,
            email: true,
            name: true,
            birthDate: true,
            familyId: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async leaveFamily(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true, id: true },
    });

    if (!user?.familyId) {
      throw new NotFoundException('You are not part of any family');
    }

    // Check if user is admin
    const family = await this.prisma.family.findUnique({
      where: { id: user.familyId },
      select: { adminId: true },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.adminId === userId) {
      throw new BadRequestException('Admin cannot leave the family. Transfer ownership first or delete the family.');
    }

    // Remove user from family
    await this.prisma.user.update({
      where: { id: userId },
      data: { familyId: null },
    });

    return { message: 'Successfully left the family' };
  }

  findAll() {
    return this.prisma.family.findMany({
      include: { users: true },
    });
  }

  findOne(id: string) {
    return this.prisma.family.findUnique({
      where: { id },
      include: {
        users: {
          orderBy: { birthDate: 'asc' },
        },
      },
    });
  }

  update(id: string, updateFamilyDto: UpdateFamilyDto) {
    return this.prisma.family.update({ where: { id }, data: updateFamilyDto });
  }

  remove(id: string) {
    return this.prisma.family.delete({ where: { id } });
  }
}
