import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(private prisma: PrismaService) { }

    // This would be called by a CRON job (e.g., every midnight)
    async rotateTasks() {
        this.logger.log('Starting daily task rotation...');

        // 1. Get all active rotation tasks
        const tasks = await this.prisma.task.findMany({
            where: { isRotation: true },
            include: { family: { include: { users: { orderBy: { birthDate: 'asc' } } } } },
        });

        for (const task of tasks) {
            this.logger.log(`Processing task: ${task.title}`);

            // Get yesterday's assignment to check status
            const lastAssignment = await this.prisma.taskAssignment.findFirst({
                where: { taskId: task.id },
                orderBy: { scheduledDate: 'desc' },
            });

            let nextUserId: string;
            const users = task.family.users;
            if (users.length === 0) continue;

            if (lastAssignment) {
                // ROLLOVER LOGIC: If incomplete, it stays with the same user
                if (lastAssignment.status !== TaskStatus.COMPLETED) {
                    this.logger.log(`Task ${task.title} not completed. Rolling over.`);
                    // Create new assignment for today with same user, marked as rollover
                    // Note: In a real app, maybe we just update the date of the old one? 
                    // Better to keep history: old one stays PENDING/SKIPPED (or we mark as MISSED), new one created.
                    // Requirement says "permanecer com o mesmo usuário".
                    nextUserId = lastAssignment.userId;
                } else {
                    // Find current user index
                    const currentIndex = users.findIndex(u => u.id === lastAssignment.userId);
                    // Move to next (Younger)
                    const nextIndex = (currentIndex + 1) % users.length;
                    nextUserId = users[nextIndex].id;
                }
            } else {
                // First ever assignment: Oldest user (index 0)
                nextUserId = users[0].id;
            }

            await this.prisma.taskAssignment.create({
                data: {
                    taskId: task.id,
                    userId: nextUserId,
                    scheduledDate: new Date(), // Today
                    isRollover: lastAssignment ? lastAssignment.status !== TaskStatus.COMPLETED : false,
                },
            });
        }
        this.logger.log('Task rotation complete.');
    }
}
