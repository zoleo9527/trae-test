import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, MarkReadDto } from './notification.dto';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('isRead') isRead?: string,
    @Query('recipientRole') recipientRole?: string,
    @Query('recipientName') recipientName?: string,
  ) {
    return this.notificationService.findAll(
      { page: +page, pageSize: +pageSize },
      isRead ? isRead === 'true' : undefined,
      recipientRole,
      recipientName,
    );
  }

  @Get('unread/count')
  getUnreadCount(
    @Query('recipientRole') recipientRole?: string,
    @Query('recipientName') recipientName?: string,
  ) {
    return this.notificationService.getUnreadCount(recipientRole, recipientName);
  }

  @Get('workbench/tasks')
  getWorkbenchTasks(@Query('role') role: string) {
    return this.notificationService.getWorkbenchTasks(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(+id);
  }

  @Put('read/all')
  markAllAsRead(
    @Body('recipientRole') recipientRole?: string,
    @Body('recipientName') recipientName?: string,
  ) {
    return this.notificationService.markAllAsRead(recipientRole, recipientName);
  }
}
