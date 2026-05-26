import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '家具展厅安装预约与验收回单系统 API';
  }
}
