/**
 * 模板详情页面
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Spin,
  message,
  Space,
  Tag,
  Divider,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';

interface TemplateField {
  key: string;
  label: string;
  type: string;
  unit?: string;
  precision?: number;
  required?: boolean;
}

interface TemplateChart {
  id: string;
  type: string;
  title: string;
  field?: string;
  fields?: string[];
  description?: string;
}

interface TemplateStat {
  id: string;
  label: string;
  calc: string;
  unit?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_builtin: boolean;
  fields: TemplateField[];
  charts: TemplateChart[];
  stats: TemplateStat[];
  import_config?: {
    columns: Array<{ key: string; label: string }>;
  };
  export_config?: {
    columns: Array<{ key: string; label: string }>;
  };
}

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const result = await request<{ data: Template }>(`/templates/${id}`);
      setTemplate(result.data);
    } catch (error) {
      message.error('加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const handleUseTemplate = () => {
    navigate(`/ruler/new?template_id=${id}`);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="content-wrapper" style={{ textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="app-container">
        <div className="content-wrapper">
          <Card className="app-card-static">
            <div style={{ textAlign: 'center' }}>模板不存在</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <Card className="app-card-static">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space align="center">
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/templates')}>
                返回
              </Button>
              <span style={{ fontSize: 24 }}>{template.icon || '📊'}</span>
              <span className="text-heading">{template.name}</span>
              {template.is_builtin && <Tag color="green">内置</Tag>}
            </Space>

            <div className="text-body">{template.description}</div>

            <Button type="primary" icon={<PlusOutlined />} onClick={handleUseTemplate}>
              使用此模板创建记录尺
            </Button>
          </Space>
        </Card>

        <Divider />

        <Card className="app-card-static" title="📋 记录字段">
          <List
            dataSource={template.fields}
            renderItem={(field) => (
              <List.Item>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space align="center">
                    <span className="text-body">{field.label}</span>
                    {field.required && <Tag color="red">必填</Tag>}
                  </Space>
                  <Space className="text-caption">
                    <span>类型: {field.type}</span>
                    {field.unit && <span>单位: {field.unit}</span>}
                    {field.precision && <span>精度: {field.precision} 位小数</span>}
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        </Card>

        <Divider />

        <Card className="app-card-static" title="📊 分析图表">
          <List
            dataSource={template.charts}
            renderItem={(chart) => (
              <List.Item>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <span className="text-body">{chart.title}</span>
                  <Space className="text-caption">
                    <span>类型: {chart.type}</span>
                    <span>字段: {chart.fields?.join(', ') || chart.field}</span>
                  </Space>
                  {chart.description && (
                    <div className="text-caption">{chart.description}</div>
                  )}
                </Space>
              </List.Item>
            )}
          />
        </Card>

        <Divider />

        <Card className="app-card-static" title="📏 统计指标">
          <List
            dataSource={template.stats}
            renderItem={(stat) => (
              <List.Item>
                <Space align="center">
                  <span className="text-body">{stat.label}</span>
                  <Space className="text-caption">
                    <span>计算: {stat.calc}</span>
                    {stat.unit && <span>单位: {stat.unit}</span>}
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        </Card>

        <Divider />

        <Card className="app-card-static" title="📥 导入格式">
          <List
            dataSource={template.import_config?.columns || []}
            renderItem={(column) => (
              <List.Item>
                <Space className="text-body">
                  <span>{column.label}</span>
                  <Tag>{column.key}</Tag>
                </Space>
              </List.Item>
            )}
          />
        </Card>

        <Divider />

        <Card className="app-card-static" title="📤 导出格式">
          <List
            dataSource={template.export_config?.columns || []}
            renderItem={(column) => (
              <List.Item>
                <Space className="text-body">
                  <span>{column.label}</span>
                  <Tag>{column.key}</Tag>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
