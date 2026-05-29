import { useState } from 'react';
import { Settings, AlertTriangle, GraduationCap, Scale, Save, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { ASSESSMENT_RULES } from '@/utils/assessmentRules';
import { TRAINING_TRIGGER_RULES, TRAINING_CONTENT_TEMPLATES } from '@/utils/trainingTrigger';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'assessment' | 'training' | 'responsibility'>('assessment');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">规则配置</h1>
          <p className="text-gray-500 mt-1">配置考核规则、培训触发条件、责任判定逻辑</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            重置为默认
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            保存更改
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-1 inline-flex gap-1">
        {[
          { key: 'assessment', label: '考核规则' },
          { key: 'training', label: '培训触发' },
          { key: 'responsibility', label: '责任判定' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-primary-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'assessment' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              考核计分规则
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">规则说明</p>
                  <p className="text-sm text-amber-700 mt-1">
                    考核规则会根据违规类型、情节严重程度、是否累犯自动计算扣分和罚款金额。
                    骑手初始积分为100分，扣至60分以下将自动触发待岗培训。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(ASSESSMENT_RULES).map(([type, rule]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag variant="danger" size="sm">{rule.type}</Tag>
                    <span className="font-medium text-gray-900">配送违规</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="font-medium text-green-700">轻微</p>
                      <p className="text-green-600">扣3-5分</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="font-medium text-amber-700">一般</p>
                      <p className="text-amber-600">扣5-8分</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="font-medium text-red-700">严重</p>
                      <p className="text-red-600">扣8-15分</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'training' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
              培训触发规则
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">培训触发条件</p>
                  <p className="text-sm text-blue-700 mt-1">
                    满足以下任一条件将自动触发培训任务，骑手需在规定时间内完成学习。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">单次扣分触发</p>
                <p className="text-sm text-gray-600">单次考核扣分 ≥ {TRAINING_TRIGGER_RULES.singleDeductionThreshold} 分</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">月度累计触发</p>
                <p className="text-sm text-gray-600">月度累计扣分 ≥ {TRAINING_TRIGGER_RULES.monthlyDeductionThreshold} 分</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">累犯触发</p>
                <p className="text-sm text-gray-600">同类违规 ≥ {TRAINING_TRIGGER_RULES.repeatOffenseThreshold} 次/月</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">培训内容模板</h3>
              <div className="space-y-3">
                {Object.entries(TRAINING_CONTENT_TEMPLATES).map(([type, template]) => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{template.title}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.content.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'responsibility' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-500" />
              责任判定规则
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800">责任归属判定</p>
                  <p className="text-sm text-purple-700 mt-1">
                    系统会根据订单时间线、申诉内容、历史记录等因素自动判定责任方，
                    支持人工复核和调整。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag variant="danger" size="sm">骑手责任</Tag>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 未按规定路线配送</li>
                  <li>• 未及时联系用户导致超时</li>
                  <li>• 餐品保管不当导致撒漏</li>
                  <li>• 服务态度问题导致投诉</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag variant="warning" size="sm">商家责任</Tag>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 出餐超时导致配送延误</li>
                  <li>• 餐品包装不当导致撒漏</li>
                  <li>• 餐品与订单不符</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag variant="info" size="sm">平台/其他</Tag>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 系统派单不合理</li>
                  <li>• 恶劣天气等不可抗力</li>
                  <li>• 用户地址不准确</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
