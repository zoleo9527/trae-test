import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface DbData {
  users: any[];
  filmRolls: any[];
  workOrders: any[];
  statusLogs: any[];
  notes: any[];
  compensations: any[];
}

const DEFAULT_DATA: DbData = {
  users: [],
  filmRolls: [],
  workOrders: [],
  statusLogs: [],
  notes: [],
  compensations: [],
};

@Injectable()
export class DbService implements OnModuleInit {
  private data: DbData;
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'db.json');
  }

  async onModuleInit() {
    this.ensureDataDir();
    this.loadData();
  }

  private ensureDataDir() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const content = fs.readFileSync(this.dataPath, 'utf8');
        this.data = JSON.parse(content);
      } else {
        this.data = { ...DEFAULT_DATA };
        this.saveData();
      }
    } catch (e) {
      this.data = { ...DEFAULT_DATA };
    }
  }

  private saveData() {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  findAll(collection: keyof DbData): any[] {
    return [...this.data[collection]];
  }

  find(collection: keyof DbData, where: any = {}): any[] {
    return this.data[collection].filter((item) => {
      for (const [key, value] of Object.entries(where)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  findOne(collection: keyof DbData, where: any = {}): any | null {
    return this.data[collection].find((item) => {
      for (const [key, value] of Object.entries(where)) {
        if (item[key] !== value) return false;
      }
      return true;
    }) || null;
  }

  findById(collection: keyof DbData, id: string): any | null {
    return this.data[collection].find((item) => item.id === id) || null;
  }

  async create(collection: keyof DbData, entity: any): Promise<any> {
    const now = new Date().toISOString();
    const newEntity = {
      ...entity,
      createdAt: entity.createdAt || now,
      updatedAt: now,
    };
    this.data[collection].push(newEntity);
    this.saveData();
    return newEntity;
  }

  async update(collection: keyof DbData, id: string, updates: any): Promise<any | null> {
    const index = this.data[collection].findIndex((item) => item.id === id);
    if (index === -1) return null;

    this.data[collection][index] = {
      ...this.data[collection][index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data[collection][index];
  }

  async delete(collection: keyof DbData, id: string): Promise<boolean> {
    const index = this.data[collection].findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.data[collection].splice(index, 1);
    this.saveData();
    return true;
  }

  count(collection: keyof DbData, where: any = {}): number {
    return this.find(collection, where).length;
  }

  async clearAll(): Promise<void> {
    this.data = { ...DEFAULT_DATA };
    this.saveData();
  }
}
