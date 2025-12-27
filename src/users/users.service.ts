import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  create(createUserDto: CreateUserDto) {
    // Note: User creation usually happens via Auth.register
    // This might be for admin or testing. 
    // For now we assume standard creation logic or throw error if not intended.
    // Leaving basic implementation.
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: 'placeholder_password', // Should be hashed
        name: createUserDto.name || 'User',
        birthDate: new Date(), // Placeholder
      }
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOneWithFamily(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        familyId: true,
        createdAt: true,
        family: {
          select: {
            id: true,
            name: true,
            inviteCode: true,
            adminId: true,
            createdAt: true,
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
        },
      },
    });

    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
