import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

@Injectable()
export class ExportService {
  async exportToExcel<T>(
    data: T[],
    columns: ExportColumn[],
    sheetName = 'Sheet1',
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  exportToCsv<T>(data: T[], columns: ExportColumn[]): string {
    const csvStringifier = createObjectCsvStringifier({
      header: columns.map((col) => ({
        id: col.key,
        title: col.header,
      })),
    });

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(data);

    return header + '\n' + body;
  }
}
