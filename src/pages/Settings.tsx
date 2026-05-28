import { useState } from 'react'
import { 
  Card, Button, Space, Typography, App as AntApp, 
  Row, Col, Statistic, Divider, Alert, Upload, message
} from 'antd'
import type { UploadProps } from 'antd'
import { 
  CloudServerOutlined, DownloadOutlined, UploadOutlined, 
  SafetyOutlined, DatabaseOutlined, UserOutlined, 
  FileTextOutlined, HistoryOutlined
} from '@ant-design/icons'
import Papa from 'papaparse'
import { importExportApi } from '@/services/api'
import { useDataRefresh } from '@/contexts/DataContext'

const { Title, Text } = Typography

export default function Settings() {
  const { message: msg, modal } = AntApp.useApp()
  const { triggerRefresh } = useDataRefresh()
  const [loading, setLoading] = useState({
    backup: false,
    restore: false,
    exportMembers: false,
    exportFilms: false,
    exportProcess: false,
  })

  const handleBackup = async () => {
    setLoading(l => ({ ...l, backup: true }))
    try {
      const filePath = await importExportApi.backupDatabase()
      msg.success(`备份成功: ${filePath}`)
    } catch (e: any) {
      msg.error('备份失败: ' + e.message)
    } finally {
      setLoading(l => ({ ...l, backup: false }))
    }
  }

  const handleRestore: UploadProps['customRequest'] = async ({ file }) => {
    const filePath = (file as any).path
    if (!filePath) {
      msg.error('请选择正确的备份文件')
      return
    }

    modal.confirm({
      title: '确认恢复数据？',
      content: '恢复操作将覆盖当前所有数据，此操作不可撤销。建议先备份当前数据。',
      okText: '确认恢复',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(l => ({ ...l, restore: true }))
        try {
          await importExportApi.restoreDatabase(filePath)
          triggerRefresh()
          msg.success('数据恢复成功，所有页面数据已自动刷新')
        } catch (e: any) {
          msg.error('恢复失败: ' + e.message)
        } finally {
          setLoading(l => ({ ...l, restore: false }))
        }
      }
    })
  }

  const handleExport = async (type: 'members' | 'films' | 'process') => {
    const key = `export${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof loading
    setLoading(l => ({ ...l, [key]: true }))
    try {
      const filePath = await importExportApi.exportData(type)
      msg.success(`导出成功: ${filePath}`)
    } catch (e: any) {
      msg.error('导出失败: ' + e.message)
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  const handleDownloadTemplate = () => {
    const template = [
      {
        memberName: '张三',
        memberPhone: '13800138001',
        filmNo: 'FLM202401001',
        filmType: '彩色负片',
        filmBrand: 'Kodak',
        iso: '400',
        format: '135',
        shots: '36',
        processType: 'C-41',
        scanResolution: '3000dpi',
        deliveryVersion: 'standard',
        isUrgent: '0',
        storageStartDate: '2024-01-01',
        storageEndDate: '2024-07-01',
        remark: '备注信息'
      }
    ]
    const csv = Papa.unparse(template)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '胶卷导入模板.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="数据安全提示"
          description="所有数据存储在本地，请定期备份以防数据丢失。建议每周进行一次完整备份。"
          type="info"
          showIcon
        />

        <Card 
          title={
            <Space>
              <DatabaseOutlined />
              <Title level={4} style={{ margin: 0 }}>数据库管理</Title>
            </Space>
          }
        >
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <CloudServerOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                <Title level={5}>备份数据库</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  创建当前数据库的完整备份副本
                </Text>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  loading={loading.backup}
                  onClick={handleBackup}
                  block
                >
                  创建备份
                </Button>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <UploadOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 12 }} />
                <Title level={5}>恢复数据库</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  从备份文件恢复，将覆盖现有数据
                </Text>
                <Upload
                  accept=".db"
                  showUploadList={false}
                  customRequest={handleRestore}
                >
                  <Button 
                    type="primary" 
                    danger
                    icon={<UploadOutlined />}
                    loading={loading.restore}
                    block
                  >
                    选择备份文件恢复
                  </Button>
                </Upload>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <SafetyOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 12 }} />
                <Title level={5}>下载导入模板</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  下载CSV模板用于批量导入胶卷数据
                </Text>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  block
                >
                  下载模板
                </Button>
              </Card>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Card 
          title={
            <Space>
              <DownloadOutlined />
              <Title level={4} style={{ margin: 0 }}>数据导出</Title>
            </Space>
          }
        >
          <Row gutter={16}>
            <Col xs={12} sm={8}>
              <Card size="small">
                <Statistic 
                  title={<Space><UserOutlined /> 会员数据</Space>}
                  value="CSV"
                  valueStyle={{ fontSize: 18 }}
                  prefix={<FileTextOutlined />}
                />
                <Button 
                  type="primary" 
                  ghost
                  icon={<DownloadOutlined />}
                  loading={loading.exportMembers}
                  onClick={() => handleExport('members')}
                  style={{ marginTop: 12 }}
                  block
                >
                  导出会员数据
                </Button>
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card size="small">
                <Statistic 
                  title={<Space><FileTextOutlined /> 胶卷数据</Space>}
                  value="CSV"
                  valueStyle={{ fontSize: 18 }}
                  prefix={<FileTextOutlined />}
                />
                <Button 
                  type="primary" 
                  ghost
                  icon={<DownloadOutlined />}
                  loading={loading.exportFilms}
                  onClick={() => handleExport('films')}
                  style={{ marginTop: 12 }}
                  block
                >
                  导出胶卷数据
                </Button>
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card size="small">
                <Statistic 
                  title={<Space><HistoryOutlined /> 处理记录</Space>}
                  value="CSV"
                  valueStyle={{ fontSize: 18 }}
                  prefix={<FileTextOutlined />}
                />
                <Button 
                  type="primary" 
                  ghost
                  icon={<DownloadOutlined />}
                  loading={loading.exportProcess}
                  onClick={() => handleExport('process')}
                  style={{ marginTop: 12 }}
                  block
                >
                  导出处理记录
                </Button>
              </Card>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Card 
          title={
            <Space>
              <SafetyOutlined />
              <Title level={4} style={{ margin: 0 }}>关于系统</Title>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>胶片冲印会员寄存与到期提醒管理系统 v1.0.0</Text>
            <Text type="secondary">
              本系统采用本地数据库存储，数据保存在应用的用户数据目录下。
              请确保定期备份数据以防止数据丢失。
            </Text>
            <Text type="secondary">
              主要功能：会员管理、胶卷登记、冲扫进度跟踪、到期提醒、批量导入导出、操作日志审计。
            </Text>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              数据存储位置: ~/Library/Application Support/film-storage-manager/data/film_storage.db
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              备份存储位置: ~/Library/Application Support/film-storage-manager/backups/
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  )
}
