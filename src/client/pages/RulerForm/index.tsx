/**
 * 记录尺创建/编辑页面（响应式版本）
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  message,
  Space,
  Typography,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  FormOutlined,
  EditOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useDeviceType } from '../../hooks/useDeviceType';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface TemplateOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const templateOptions: TemplateOption[] = [
  {
    value: 'height_weight',
    label: '身高体重',
    description: '记录身高和体重数据，支持趋势分析和对比',
    icon: <DashboardOutlined />,
  },
];

export default function RulerForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isMobile } = useDeviceType();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchRuler();
    }
  }, [id]);

  const fetchRuler = async () => {
    setLoading(true);
    try {
      const result = await fetch(`/api/rulers/${id}`).then((res) => res.json());
      if (result.success) {
        form.setFieldsValue({
          name: result.data.name,
          description: result.data.description,
          template_type: result.data.template_type,
        });
      }
    } catch (error) {
      message.error('加载失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/rulers/${id}` : '/api/rulers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        message.success(isEdit ? '更新成功' : '创建成功');
        navigate('/');
      } else {
        message.error(result.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* 头部导航 */}
        <Card className="app-card-static mb-16">
          <Space align="center">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
            <Divider type="vertical" />
            <Space align="center">
              {isEdit ? <EditOutlined className="text-primary" /> : <FormOutlined className="text-primary" />}
              <Title level={4} style={{ margin: 0 }}>
                {isEdit ? '编辑记录尺' : '新建记录尺'}
              </Title>
            </Space>
          </Space>
        </Card>

        {/* 表单卡片 */}
        <Card
          className="app-card-static"
          loading={loading}
          style={{ maxWidth: isMobile ? '100%' : 600, margin: '0 auto' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              name="name"
              label={<Text strong>记录尺名称</Text>}
              rules={[{ required: true, message: '请输入记录尺名称' }]}
              extra={<Text type="secondary">给你的记录尺起个名字，方便识别</Text>}
            >
              <Input
                placeholder="例如：小明的成长记录"
                size="large"
                prefix={<FormOutlined />}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={<Text strong>描述</Text>}
              extra={<Text type="secondary">可选，添加一些描述信息帮助你记住这个记录尺的用途</Text>}
            >
              <TextArea
                placeholder="请输入描述（可选）"
                rows={4}
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Form.Item
              name="template_type"
              label={<Text strong>模板类型</Text>}
              rules={[{ required: true, message: '请选择模板类型' }]}
              initialValue="height_weight"
              extra={<Text type="secondary">选择适合的模板类型，将决定你可以记录哪些数据</Text>}
            >
              <Select
                placeholder="请选择模板类型"
                size="large"
                options={templateOptions.map((opt) => ({
                  value: opt.value,
                  label: (
                    <Space align="start">
                      {opt.icon}
                      <div>
                        <div>{opt.label}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{opt.description}</div>
                      </div>
                    </Space>
                  ),
                }))}
              />
            </Form.Item>

            <Divider />

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  size="large"
                  onClick={() => navigate(-1)}
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  onClick={() => form.submit()}
                >
                  {isEdit ? '保存修改' : '创建记录尺'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
