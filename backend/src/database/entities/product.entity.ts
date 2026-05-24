import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkOrderItem } from './work-order-item.entity';

export enum ProductCategory {
  RING = 'ring',
  NECKLACE = 'necklace',
  BRACELET = 'bracelet',
  EARRING = 'earring',
  PENDANT = 'pendant',
  WATCH = 'watch',
  OTHER = 'other',
}

export enum ProductStatus {
  IN_STOCK = 'in_stock',
  SOLD = 'sold',
  IN_REPAIR = 'in_repair',
  TRANSFERRED = 'transferred',
  LOST = 'lost',
}

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'product_no', unique: true })
  productNo: string;

  @Column({ type: 'varchar', length: 200, name: 'product_name' })
  productName: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHER,
  })
  category: ProductCategory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  material: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'gold_content' })
  goldContent: string;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true, name: 'weight_grams' })
  weightGrams: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'stone_info' })
  stoneInfo: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'size' })
  size: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'original_price' })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'actual_price' })
  actualPrice: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.IN_STOCK,
  })
  status: ProductStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'image_urls' })
  imageUrls: string;

  @OneToMany(() => WorkOrderItem, (item) => item.product)
  workOrderItems: WorkOrderItem[];
}
