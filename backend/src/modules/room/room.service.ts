import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, Camper } from '../../entities';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Camper)
    private camperRepository: Repository<Camper>,
  ) {}

  async findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      order: { building: 'ASC', floorNumber: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Room> {
    return this.roomRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Room>): Promise<Room> {
    const room = this.roomRepository.create(data);
    return this.roomRepository.save(room);
  }

  async update(id: string, data: Partial<Room>): Promise<Room> {
    await this.roomRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.roomRepository.delete(id);
  }

  async getRoomAssignments(): Promise<any[]> {
    const rooms = await this.findAll();
    const campers = await this.camperRepository
      .createQueryBuilder()
      .where('room_id IS NOT NULL')
      .getMany();

    return rooms.map(room => {
      const roomCampers = campers.filter(c => c.roomId === room.id);
      const assignments: Record<number, any> = {};
      
      roomCampers.forEach(camper => {
        if (camper.bedNumber) {
          assignments[camper.bedNumber] = {
            id: camper.id,
            name: camper.name,
            gender: camper.gender,
            age: camper.age,
          };
        }
      });

      return {
        ...room,
        assignments,
        occupied: roomCampers.length,
        available: room.bedCount - roomCampers.length,
      };
    });
  }

  async assignBed(roomId: string, bedNumber: number, camperId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new HttpException('房间不存在', HttpStatus.NOT_FOUND);
    }

    const camper = await this.camperRepository.findOne({ where: { id: camperId } });
    if (!camper) {
      throw new HttpException('营员不存在', HttpStatus.NOT_FOUND);
    }

    if (camper.gender !== room.genderType) {
      throw new HttpException(
        `${camper.name}（${camper.gender === 'male' ? '男' : '女'}）与${room.name}（${room.genderType === 'male' ? '男寝' : '女寝'}）性别不符`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingOccupant = await this.camperRepository
      .createQueryBuilder()
      .where('room_id = :roomId AND bed_number = :bedNumber AND id != :camperId', {
        roomId,
        bedNumber,
        camperId,
      })
      .getOne();

    if (existingOccupant) {
      throw new HttpException(
        `${bedNumber}号床已被${existingOccupant.name}占用`,
        HttpStatus.CONFLICT,
      );
    }

    await this.camperRepository.update(camperId, { roomId, bedNumber });
    return this.findOne(roomId);
  }

  async unassignBed(camperId: string): Promise<void> {
    await this.camperRepository.update(camperId, { roomId: null, bedNumber: null });
  }

  async getStats(): Promise<any> {
    const totalRooms = await this.roomRepository.count();
    const totalBeds = await this.roomRepository
      .createQueryBuilder()
      .select('SUM(bed_count)', 'sum')
      .getRawOne();
    
    const assignedCampers = await this.camperRepository
      .createQueryBuilder()
      .where('room_id IS NOT NULL')
      .getCount();

    return {
      totalRooms,
      totalBeds: parseInt(totalBeds.sum) || 0,
      assignedCampers,
      occupancyRate: totalBeds.sum > 0 ? Math.round((assignedCampers / parseInt(totalBeds.sum)) * 100) : 0,
    };
  }
}
