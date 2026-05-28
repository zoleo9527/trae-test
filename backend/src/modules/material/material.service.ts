import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, MaterialDistribution } from '../../entities';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(MaterialDistribution)
    private distributionRepository: Repository<MaterialDistribution>,
  ) {}

  async findAll(): Promise<Material[]> {
    return this.materialRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Material> {
    return this.materialRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Material>): Promise<Material> {
    const material = this.materialRepository.create(data);
    return this.materialRepository.save(material);
  }

  async update(id: string, data: Partial<Material>): Promise<Material> {
    await this.materialRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.materialRepository.update(id, { isActive: false });
  }

  async distribute(data: Partial<MaterialDistribution>): Promise<MaterialDistribution> {
    const material = await this.materialRepository.findOne({ where: { id: data.materialId } });
    if (!material) {
      throw new HttpException('物资不存在', HttpStatus.NOT_FOUND);
    }

    if (material.stockQuantity < data.quantity) {
      throw new HttpException(
        `${material.name} 库存不足，当前库存 ${material.stockQuantity} ${material.unit}，申请发放 ${data.quantity} ${material.unit}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const distribution = this.distributionRepository.create(data);
    const result = await this.distributionRepository.save(distribution);
    
    await this.materialRepository.decrement(
      { id: data.materialId },
      'stockQuantity',
      data.quantity,
    );
    
    return result;
  }

  async getDistributions(camperId?: string): Promise<MaterialDistribution[]> {
    const where = camperId ? { camperId } : {};
    return this.distributionRepository.find({
      where,
      relations: ['material', 'camper'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(): Promise<any> {
    const totalMaterials = await this.materialRepository.count({ where: { isActive: true } });
    const lowStock = await this.materialRepository
      .createQueryBuilder()
      .where('stock_quantity < 10')
      .andWhere('is_active = true')
      .getCount();
    
    const distributions = await this.distributionRepository.count();

    return { totalMaterials, lowStock, distributions };
  }

  async restock(materialId: string, quantity: number): Promise<Material> {
    await this.materialRepository.increment(
      { id: materialId },
      'stockQuantity',
      quantity,
    );
    return this.findOne(materialId);
  }
}
