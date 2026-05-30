'use client';

import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/services/api';
import { ConfigRules } from '@/types';
import { Info, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get<ConfigRules>('/config/rules');
      if (res.success) {
        setConfig(res.data || null);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.put('/config/rules', config);
      alert('保存成功，配置已生效');
    } catch (e: any) {
      alert(e.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<ConfigRules>) => {
    setConfig((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const addGiftRule = () => {
    if (!config) return;
    const newRules = [...config.recharge_gift_rules, { threshold: 0, gift_percent: 0 }];
    updateConfig({ recharge_gift_rules: newRules });
  };

  const updateGiftRule = (index: number, field: 'threshold' | 'gift_percent', value: number) => {
    if (!config) return;
    const newRules = [...config.recharge_gift_rules];
    newRules[index] = { ...newRules[index], [field]: value };
    updateConfig({ recharge_gift_rules: newRules });
  };

  const removeGiftRule = (index: number) => {
    if (!config || config.recharge_gift_rules.length <= 1) return;
    const newRules = config.recharge_gift_rules.filter((_, i) => i !== index);
    updateConfig({ recharge_gift_rules: newRules });
  };

  if (loading || !config) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-800">消耗口径配置</h2>
            </div>
            <p className="text-gray-500 text-sm">
              配置储值扣减规则、费率系数、赠送规则等核心业务参数，修改后立即生效
            </p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6">
            <Save size={18} />
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">重要提示</p>
              <p>修改消耗口径配置将影响所有后续交易的计算方式，请谨慎操作。所有修改均会被记录到操作日志中。</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">储值扣减优先级</h3>
          <p className="text-sm text-gray-500 mb-3">
            会员消费时，优先扣减哪个账户的余额
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deduct_priority"
                value="gift_first"
                checked={config.deduct_priority === 'gift_first'}
                onChange={(e) => updateConfig({ deduct_priority: e.target.value as 'gift_first' | 'principal_first' })}
                className="w-4 h-4 text-primary-600"
              />
              <span>优先扣减赠送金</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deduct_priority"
                value="principal_first"
                checked={config.deduct_priority === 'principal_first'}
                onChange={(e) => updateConfig({ deduct_priority: e.target.value as 'gift_first' | 'principal_first' })}
                className="w-4 h-4 text-primary-600"
              />
              <span>优先扣减本金</span>
            </label>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">费率系数配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">节假日费率系数</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={config.holiday_coefficient}
                onChange={(e) => updateConfig({ holiday_coefficient: parseFloat(e.target.value) })}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">节假日消费时的费率倍数</p>
            </div>
            <div>
              <label className="label">周末费率系数</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={config.weekend_coefficient}
                onChange={(e) => updateConfig({ weekend_coefficient: parseFloat(e.target.value) })}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">周六日消费时的费率倍数</p>
            </div>
            <div>
              <label className="label">赠送金有效期(天)</label>
              <input
                type="number"
                min="1"
                value={config.gift_validity_days}
                onChange={(e) => updateConfig({ gift_validity_days: parseInt(e.target.value) })}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">赠送金的有效使用期限</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">充值赠送规则</h3>
              <p className="text-sm text-gray-500">达到充值门槛时自动赠送一定比例的金额</p>
            </div>
            <button onClick={addGiftRule} className="btn-secondary text-sm flex items-center gap-1">
              <Plus size={16} />
              添加规则
            </button>
          </div>
          <div className="space-y-3">
            {config.recharge_gift_rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium text-sm">
                  {index + 1}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-600 whitespace-nowrap">满</span>
                  <input
                    type="number"
                    min="0"
                    value={rule.threshold}
                    onChange={(e) => updateGiftRule(index, 'threshold', parseFloat(e.target.value))}
                    className="input-field w-32"
                  />
                  <span className="text-gray-600 whitespace-nowrap">元，赠送</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rule.gift_percent}
                    onChange={(e) => updateGiftRule(index, 'gift_percent', parseFloat(e.target.value))}
                    className="input-field w-24"
                  />
                  <span className="text-gray-600 whitespace-nowrap">%</span>
                </div>
                <button
                  onClick={() => removeGiftRule(index)}
                  disabled={config.recharge_gift_rules.length <= 1}
                  className="text-red-500 hover:text-red-700 p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">会员等级折扣</h3>
          <p className="text-sm text-gray-500 mb-4">
            不同等级会员享受的消费折扣（1.0 = 不打折，0.9 = 9折）
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(config.member_discount).map(([type, discount]) => {
              const labels: Record<string, string> = {
                normal: '普通会员',
                silver: '银卡会员',
                gold: '金卡会员',
                diamond: '钻石会员',
              };
              return (
                <div key={type}>
                  <label className="label">{labels[type]}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={discount}
                      onChange={(e) =>
                        updateConfig({
                          member_discount: {
                            ...config.member_discount,
                            [type]: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="input-field pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">折</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {discount === 1 ? '无折扣' : `${(discount * 10).toFixed(0)}折`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="font-medium text-gray-700 mb-3">配置预览</h4>
          <div className="text-sm text-gray-600 space-y-2 font-mono bg-white p-4 rounded-lg">
            <p>{`扣减优先级: ${config.deduct_priority === 'gift_first' ? '先扣赠送金，后扣本金' : '先扣本金，后扣赠送金'}`}</p>
            <p>{`节假日费率: ${config.holiday_coefficient}倍 | 周末费率: ${config.weekend_coefficient}倍`}</p>
            <p>{`充值规则: ${config.recharge_gift_rules
              .map((r) => `满${r.threshold}送${r.gift_percent}%`)
              .join(', ')}`}</p>
            <p>{`会员折扣: ${Object.entries(config.member_discount)
              .map(([t, d]) => `${t === 'normal' ? '普通' : t === 'silver' ? '银卡' : t === 'gold' ? '金卡' : '钻石'}${d === 1 ? '无折扣' : (d * 10).toFixed(0) + '折'}`)
              .join(', ')}`}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
