/**
 * 数据导入页面（响应式版本）
 */

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Space,
  Steps,
  Upload,
  message,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useDeviceType } from '../../hooks/useDeviceType';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function ImportData() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`/api/records/import/template`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '记录模板.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('模板已下载');
      setCurrentStep(1);
    } catch (error) {
      message.error('下载模板失败');
    }
  };

  const customRequest = async ({ file }: { file: File }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ruler_id', id!);

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
            <Title level={4} style={{ margin: 0 }}>
              数据导入
            </Title>
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
                <Title level={5}>导入说明</Title>
                <Paragraph>
                  通过 Excel 文件批量导入数据，支持以下格式：
                </Paragraph>
                <ul style={{ color: '#666', lineHeight: '2' }}>
                  <li>Excel 文件 (.xlsx, .xls)</li>
                  <li>CSV 文件 (.csv)</li>
                </ul>
                <Alert
                  message="数据格式要求"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>日期格式：YYYY-MM-DD</li>
                      <li>身高单位：厘米 (cm)</li>
                      <li>体重单位：公斤 (kg) 或 市斤</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />
              </Card>

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
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={downloadTemplate}
                      size="large"
                    >
                      下载模板
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* 文件上传 */}
              <Card className="app-card-static">
                <Title level={5}>上传文件</Title>
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
