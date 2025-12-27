import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FamiliesModule } from './families/families.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule, FamiliesModule, TasksModule, AuthModule, PrismaModule, SchedulerModule, AssignmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
