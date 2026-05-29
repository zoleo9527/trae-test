"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
require("reflect-metadata");
dotenv.config();
__exportStar(require("./modules/disease/disease-timeline.entity"), exports);
__exportStar(require("./modules/disease/disease.entity"), exports);
__exportStar(require("./modules/inspection/inspection.entity"), exports);
__exportStar(require("./modules/negotiation/negotiation.entity"), exports);
__exportStar(require("./modules/plot/plot.entity"), exports);
__exportStar(require("./modules/user/user.entity"), exports);
//# sourceMappingURL=bootstrap.js.map