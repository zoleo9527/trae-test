import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InstallationAppointment, AppointmentStatus } from '../../entities/installation-appointment.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { CreateInstallationDto, UpdateInstallationDto, RescheduleDto } from './installation.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';
import { ActivityLogService } from '../../common/activity-log.service';

@Injectable()
export class InstallationService {
  constructor(
    @InjectRepository(InstallationAppointment)
    private readonly appointmentRepository: Repository<InstallationAppointment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll(
    pagination: PaginationParams,
    status?: AppointmentStatus,
    startDate?: string,
    endDate?: string,
    installerName?: string,
  ): Promise<PaginatedResult<InstallationAppointment>> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (installerName) {
      where.installerName = installerName;
    }
    if (startDate && endDate) {
      where.appointmentDate = Between(startDate, endDate);
    }

    const [items, total] = await this.appointmentRepository.findAndCount({
      where,
      relations: ['order', 'order.customer'],
      order: { appointmentDate: 'ASC', createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async getCalendarView(startDate: string, endDate: string): Promise<InstallationAppointment[]> {
    return this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, endDate),
      },
      relations: ['order', 'order.customer'],
      order: { appointmentDate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<InstallationAppointment> {
    return this.appointmentRepository.findOne({
      where: { id },
      relations: ['order', 'order.customer', 'order.items'],
    });
  }

  async findByOrderId(orderId: number): Promise<InstallationAppointment[]> {
    return this.appointmentRepository.find({
      where: { orderId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateInstallationDto, operator: string): Promise<InstallationAppointment> {
    const appointment = this.appointmentRepository.create(dto);
    const saved = await this.appointmentRepository.save(appointment);

    const order = await this.orderRepository.findOneBy({ id: dto.orderId });
    if (order && order.status === OrderStatus.DELIVERED) {
      order.status = OrderStatus.INSTALLING;
      await this.orderRepository.save(order);
    }

    await this.activityLogService.log(
      'installation',
      saved.id,
      'create',
      `创建安装预约: ${dto.appointmentDate} ${dto.timeSlot}`,
      operator,
      'coordinator',
      null,
      saved,
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateInstallationDto, operator: string): Promise<InstallationAppointment> {
    const appointment = await this.findOne(id);
    const oldValue = { ...appointment };
    Object.assign(appointment, dto);
    const updated = await this.appointmentRepository.save(appointment);

    if (dto.status === AppointmentStatus.COMPLETED) {
      appointment.actualEndTime = new Date();
      await this.appointmentRepository.save(appointment);
    }

    await this.activityLogService.log(
      'installation',
      id,
      'update',
      `更新安装预约`,
      operator,
      'coordinator',
      oldValue,
      updated,
    );

    return updated;
  }

  async reschedule(id: number, dto: RescheduleDto, operator: string): Promise<InstallationAppointment> {
    const oldAppointment = await this.findOne(id);
    oldAppointment.status = AppointmentStatus.RESCHEDULED;
    await this.appointmentRepository.save(oldAppointment);

    const newAppointment = this.appointmentRepository.create({
      orderId: oldAppointment.orderId,
      appointmentDate: dto.appointmentDate,
      timeSlot: dto.timeSlot,
      installerName: oldAppointment.installerName,
      installerPhone: oldAppointment.installerPhone,
      teamSize: oldAppointment.teamSize,
      customerRemark: dto.reason,
      previousAppointmentId: oldAppointment.id,
    });
    const saved = await this.appointmentRepository.save(newAppointment);

    await this.activityLogService.log(
      'installation',
      saved.id,
      'reschedule',
      `改期: 从 ${oldAppointment.appointmentDate} ${oldAppointment.timeSlot} 改到 ${dto.appointmentDate} ${dto.timeSlot}，原因: ${dto.reason || '未填写'}`,
      operator,
      'coordinator',
      oldAppointment,
      saved,
    );

    return this.findOne(saved.id);
  }

  async startInstallation(id: number, operator: string): Promise<InstallationAppointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.IN_PROGRESS;
    appointment.actualStartTime = new Date();
    const updated = await this.appointmentRepository.save(appointment);

    await this.activityLogService.log(
      'installation',
      id,
      'start',
      `开始安装`,
      operator,
      'installer',
      null,
      updated,
    );

    return updated;
  }

  async completeInstallation(id: number, operator: string): Promise<InstallationAppointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.COMPLETED;
    appointment.actualEndTime = new Date();
    const updated = await this.appointmentRepository.save(appointment);

    await this.activityLogService.log(
      'installation',
      id,
      'complete',
      `安装完成`,
      operator,
      'installer',
      null,
      updated,
    );

    return updated;
  }

  async remove(id: number, operator: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.delete(id);

    await this.activityLogService.log(
      'installation',
      id,
      'delete',
      `删除安装预约: ${appointment.appointmentDate} ${appointment.timeSlot}`,
      operator,
      'manager',
      appointment,
      null,
    );
  }
}
