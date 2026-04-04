/**
 * 模板列表页面
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Empty, Spin, Tag, Space } from 'antd';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';

interface Template {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_builtin: boolean;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    unit?: string;
  }>;
}

export default function Templates() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const result = await request<{ data: Template[] }>('/templates');
      setTemplates(result.data);
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const renderTemplateCard = (template: Template) => (
    <Card
      key={template.id}
      className="app-card"
      hoverable
      onClick={() => navigate(`/templates/${template.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="center">
          <span style={{ fontSize: 24 }}>{template.icon || '📊'}</span>
          <span className="text-heading">{template.name}</span>
          {template.is_builtin && <Tag color="green">内置</Tag>}
        </Space>
        <div className="text-body">{template.description || '暂无描述'}</div>
        <Space className="text-caption">
          <span>字段: {template.fields.length}</span>
        </Space>
      </Space>
    </Card>
  );

  if (loading) {
    return (
      <div className="app-container">
        <div className="content-wrapper" style={{ textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="hero-section">
          <div className="hero-title">模板库</div>
          <div className="hero-subtitle">选择适合你的记录模板</div>
        </div>

        {templates.length === 0 ? (
          <Card className="app-card-static" style={{ textAlign: 'center', padding: 48 }}>
            <Empty description="暂无模板" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {templates.map((template) => (
              <Col xs={24} sm={12} lg={8} key={template.id}>
                {renderTemplateCard(template)}
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}