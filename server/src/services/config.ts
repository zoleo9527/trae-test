import db from '../db';
import { Config } from '../types';
import { getClientIp, logAudit } from '../utils';

export interface ConfigRules {
  deduct_priority: 'gift_first' | 'principal_first';
  holiday_coefficient: number;
  weekend_coefficient: number;
  gift_validity_days: number;
  recharge_gift_rules: {
    threshold: number;
    gift_percent: number;
  }[];
  member_discount: {
    normal: number;
    silver: number;
    gold: number;
    diamond: number;
  };
}

const defaultRules: ConfigRules = {
  deduct_priority: 'gift_first',
  holiday_coefficient: 1.5,
  weekend_coefficient: 1.2,
  gift_validity_days: 365,
  recharge_gift_rules: [
    { threshold: 1000, gift_percent: 10 },
    { threshold: 3000, gift_percent: 15 },
    { threshold: 5000, gift_percent: 20 },
    { threshold: 10000, gift_percent: 30 }
  ],
  member_discount: {
    normal: 1.0,
    silver: 0.95,
    gold: 0.9,
    diamond: 0.85
  }
};

export function getConfigRules(): ConfigRules {
  const stmt = db.prepare("SELECT * FROM configs WHERE key = 'rules'");
  const result = stmt.get() as Config | undefined;

  if (!result) {
    return defaultRules;
  }

  try {
    return JSON.parse(result.value);
  } catch {
    return defaultRules;
  }
}

export function updateConfigRules(req: any, operatorId: number, rules: ConfigRules) {
  const tx = db.transaction(() => {
    const existing = db.prepare("SELECT * FROM configs WHERE key = 'rules'").get() as Config | undefined;
    const rulesJson = JSON.stringify(rules);

    if (existing) {
      db.prepare(`
        UPDATE configs
        SET value = ?,
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE key = 'rules'
      `).run(rulesJson, operatorId);

      logAudit(
        operatorId,
        'config',
        'update',
        'config',
        existing.id,
        { old_rules: existing.value },
        { new_rules: rulesJson },
        getClientIp(req),
        req.headers['user-agent']
      );
    } else {
      const result = db.prepare(`
        INSERT INTO configs (key, value, description, updated_by)
        VALUES ('rules', ?, '系统消耗口径配置规则', ?)
      `).run(rulesJson, operatorId);

      logAudit(
        operatorId,
        'config',
        'create',
        'config',
        result.lastInsertRowid as number,
        null,
        { rules: rulesJson },
        getClientIp(req),
        req.headers['user-agent']
      );
    }

    return getConfigRules();
  });

  return tx();
}

export function initDefaultConfig() {
  const existing = db.prepare("SELECT * FROM configs WHERE key = 'rules'").get();
  if (!existing) {
    db.prepare(`
      INSERT INTO configs (key, value, description)
      VALUES ('rules', ?, '系统消耗口径配置规则')
    `).run(JSON.stringify(defaultRules));
    console.log('默认配置已初始化');
  }
}
