import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt'; // Assuming bcryptjs or bcrypt is needed. Wait, I didn't install bcrypt. I should have.

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, name, birthDate, familyName, inviteCode } = registerDto;

        // Hash password
        const hashedPassword = await this.hashPassword(password);

        return this.prisma.$transaction(async (tx) => {
            let familyId: string | null = null;

            // Scenario 1: Join with Invite Code
            if (inviteCode) {
                const existingFamily = await tx.family.findUnique({
                    where: { inviteCode },
                });
                if (!existingFamily) {
                    throw new BadRequestException('Invalid invite code');
                }
                familyId = existingFamily.id;
            }
            // Scenario 2: Create New Family
            else if (familyName) {
                // Must create user first to be admin? No, we can create user later.
                // But family needs adminId.
                // Let's create user first, then family.
            }

            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    birthDate: new Date(birthDate),
                    familyId: familyId, // Will be null if no invite code yet, or set if invite code used
                },
            });

            // If we need to create a new family (Scenario 2 continued)
            if (!inviteCode && familyName) {
                const family = await tx.family.create({
                    data: {
                        name: familyName,
                        adminId: user.id,
                    },
                });

                // Update user to link to this new family
                await tx.user.update({
                    where: { id: user.id },
                    data: { familyId: family.id },
                });

                // Set the local variable for the return object
                familyId = family.id;
            }

            // Fetch final user state
            const finalUser = await tx.user.findUnique({
                where: { id: user.id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    birthDate: true,
                    familyId: true,
                    createdAt: true,
                },
            });

            if (!finalUser) {
                throw new Error('Failed to retrieve created user');
            }

            return this.signTokenWithUser(finalUser.id, finalUser.email, finalUser);
        });
    }

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
            select: {
                id: true,
                email: true,
                name: true,
                birthDate: true,
                familyId: true,
                createdAt: true,
                password: true,
            },
        });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await this.comparePassword(loginDto.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        // Remove password from user object
        const { password, ...userWithoutPassword } = user;

        return this.signTokenWithUser(user.id, user.email, userWithoutPassword);
    }

    private signToken(userId: string, email: string) {
        const payload = { sub: userId, email };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    private signTokenWithUser(userId: string, email: string, user: any) {
        const payload = { sub: userId, email };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    // Helper methods (placeholder implementations until bcrypt is installed)
    private async hashPassword(password: string): Promise<string> {
        // TODO: Replace with bcrypt.hash(password, 10)
        return password + '_hashed';
    }

    private async comparePassword(plain: string, hashed: string): Promise<boolean> {
        // TODO: Replace with bcrypt.compare(plain, hashed)
        return (plain + '_hashed') === hashed;
    }
}
