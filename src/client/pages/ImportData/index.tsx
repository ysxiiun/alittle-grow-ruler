/**
 * 数据导入页面（响应式版本）
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Steps,
  Upload,
  message,
  Row,
  Col,
  Alert,
  Dropdown,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  InboxOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import type { MenuProps } from 'antd';
import request from '../../utils/request';

interface TemplateField {
  key: string;
  label: string;
  type: 'number' | 'string' | 'date' | 'select';
  unit?: string;
}

interface Template {
  id: string;
  name: string;
  fields: TemplateField[];
  icon?: string;
}

interface RulerInfo {
  id: number;
  name: string;
  template: Template;
}

const { Dragger } = Upload;

export default function ImportData() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [ruler, setRuler] = useState<RulerInfo | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    request<{ data: RulerInfo }>(`/rulers/${id}`)
      .then((result) => setRuler(result.data))
      .catch(() => message.error('加载记录尺失败'));
  }, [id]);

  const downloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      const response = await fetch(`/api/records/import/template?ruler_id=${id}&format=${format}`);
      if (!response.ok) {
        const error = await response.json();
        message.error(error.message || '下载模板失败');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ruler?.name || '导入模板'}_${ruler?.template.name || '模板'}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('模板已下载');
      setCurrentStep(1);
    } catch (error) {
      message.error('下载模板失败');
    }
  };

  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'xlsx',
      icon: <FileExcelOutlined />,
      label: 'Excel 格式 (.xlsx)',
      onClick: () => downloadTemplate('xlsx'),
    },
    {
      key: 'csv',
      label: 'CSV 格式 (.csv)',
      onClick: () => downloadTemplate('csv'),
    },
  ];

  const customRequest = async ({ file }: { file: File }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('record_id', id!);

      const response = await fetch('/api/records/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        message.success(result.message || '导入成功');
        setCurrentStep(2);
        setTimeout(() => {
          navigate(`/ruler/${id}`);
        }, 1500);
      } else {
        message.error(result.message || '导入失败');
      }
    } catch (error) {
      message.error('导入失败');
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    {
      title: '下载模板',
      description: '获取导入模板',
    },
    {
      title: '填写数据',
      description: '准备导入文件',
    },
    {
      title: '上传导入',
      description: '完成数据导入',
    },
  ];

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* 头部导航 */}
        <Card className="app-card-static mb-16">
          <Space align="center">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/ruler/${id}`)}
            >
              返回
            </Button>
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              数据导入
            </span>
          </Space>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card className="app-card-static">
              <Steps
                direction={isMobile ? 'horizontal' : 'vertical'}
                current={currentStep}
                items={steps}
                size={isMobile ? 'small' : 'default'}
              />
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 导入说明 */}
              <Card className="app-card-static">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>导入说明</div>
                <div style={{ color: '#666', marginBottom: 12 }}>
                  将数据按当前记录尺所属模板填写后导入，系统会按模板字段解析文件。
                </div>
                <ul style={{ color: '#666', lineHeight: '2', marginBottom: 16 }}>
                  <li>Excel 文件 (.xlsx, .xls)</li>
                  <li>CSV 文件 (.csv)</li>
                  <li>推荐先下载模板文件，再按列头填写</li>
                </ul>
                <Alert
                  message="数据格式要求"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>时间列格式：YYYY-MM-DD HH:mm</li>
                      <li>列头格式：字段标签(key)</li>
                      <li>当前模板：{ruler?.template.name || '加载中'}</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />
              </Card>

              {ruler?.template && (
                <Card className="app-card-static">
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>
                    {ruler.template.icon || '📋'} 模板字段
                  </div>
                  <ul style={{ color: '#666', lineHeight: '2', margin: 0, paddingLeft: 18 }}>
                    {ruler.template.fields.map((field) => (
                      <li key={field.key}>
                        {field.label} ({field.key})
                        {field.unit ? `，单位 ${field.unit}` : ''}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* 下载模板 */}
              <Card className="app-card-static">
                <Row align="middle" justify="space-between">
                  <Col>
                    <Space align="center">
                      <FileExcelOutlined style={{ fontSize: 40, color: '#52c41a' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>导入模板</div>
                        <div className="text-caption">下载模板文件并填写数据</div>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    <Dropdown menu={{ items: downloadMenuItems }} placement="bottomRight">
                      <Button type="primary" icon={<DownloadOutlined />}>
                        下载模板 <DownOutlined />
                      </Button>
                    </Dropdown>
                  </Col>
                </Row>
              </Card>

              {/* 文件上传 */}
              <Card className="app-card-static">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>上传文件</div>
                <Dragger
                  customRequest={customRequest}
                  accept=".xlsx,.xls,.csv"
                  showUploadList={false}
                  disabled={uploading}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持 Excel (.xlsx, .xls) 或 CSV (.csv) 格式
                  </p>
                </Dragger>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}
