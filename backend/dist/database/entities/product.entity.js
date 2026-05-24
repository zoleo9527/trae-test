"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = exports.ProductStatus = exports.ProductCategory = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const work_order_item_entity_1 = require("./work-order-item.entity");
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["RING"] = "ring";
    ProductCategory["NECKLACE"] = "necklace";
    ProductCategory["BRACELET"] = "bracelet";
    ProductCategory["EARRING"] = "earring";
    ProductCategory["PENDANT"] = "pendant";
    ProductCategory["WATCH"] = "watch";
    ProductCategory["OTHER"] = "other";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["IN_STOCK"] = "in_stock";
    ProductStatus["SOLD"] = "sold";
    ProductStatus["IN_REPAIR"] = "in_repair";
    ProductStatus["TRANSFERRED"] = "transferred";
    ProductStatus["LOST"] = "lost";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
let Product = class Product extends base_entity_1.BaseEntity {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'product_no', unique: true }),
    __metadata("design:type", String)
], Product.prototype, "productNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'product_name' }),
    __metadata("design:type", String)
], Product.prototype, "productName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProductCategory,
        default: ProductCategory.OTHER,
    }),
    __metadata("design:type", String)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "material", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'gold_content' }),
    __metadata("design:type", String)
], Product.prototype, "goldContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 3, nullable: true, name: 'weight_grams' }),
    __metadata("design:type", Number)
], Product.prototype, "weightGrams", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'stone_info' }),
    __metadata("design:type", String)
], Product.prototype, "stoneInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'size' }),
    __metadata("design:type", String)
], Product.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, name: 'original_price' }),
    __metadata("design:type", Number)
], Product.prototype, "originalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'actual_price' }),
    __metadata("design:type", Number)
], Product.prototype, "actualPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProductStatus,
        default: ProductStatus.IN_STOCK,
    }),
    __metadata("design:type", String)
], Product.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'image_urls' }),
    __metadata("design:type", String)
], Product.prototype, "imageUrls", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => work_order_item_entity_1.WorkOrderItem, (item) => item.product),
    __metadata("design:type", Array)
], Product.prototype, "workOrderItems", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products')
], Product);
//# sourceMappingURL=product.entity.js.map