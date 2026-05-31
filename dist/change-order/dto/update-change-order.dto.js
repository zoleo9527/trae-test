"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChangeOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_change_order_dto_1 = require("./create-change-order.dto");
class UpdateChangeOrderDto extends (0, swagger_1.PartialType)(create_change_order_dto_1.CreateChangeOrderDto) {
}
exports.UpdateChangeOrderDto = UpdateChangeOrderDto;
//# sourceMappingURL=update-change-order.dto.js.map