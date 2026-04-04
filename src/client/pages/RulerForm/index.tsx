/**
 * 记录尺创建/编辑页面
 * 支持动态模板选择
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  message,
  Space,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  FormOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';

const { TextArea } = Input;

interface Template {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export default function RulerForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { isMobile } = useDeviceType();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  // 从 URL 参数获取预选模板
  const preselectedTemplateId = searchParams.get('template_id');

  useEffect(() => {
    fetchTemplates();
    if (isEdit) {
      fetchRuler();
    } else if (preselectedTemplateId) {
      form.setFieldValue('template_id', preselectedTemplateId);
    }
  }, [id, preselectedTemplateId]);

  const fetchTemplates = async () => {
    try {
      const result = await request<{ data: Template[] }>('/templates');
      setTemplates(result.data);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const fetchRuler = async () => {
    setLoading(true);
    try {
      const result = await request<{ data: Record<string, unknown> }>(`/rulers/${id}`);
      if (result.success) {
        form.setFieldsValue({
          name: result.data.name,
          description: result.data.description,
          template_id: result.data.template_id,
          subject: result.data.subject,
          color: result.data.color,
        });
      }
    } catch (error) {
      message.error('加载失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = isEdit ? `/rulers/${id}` : '/rulers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(`/api${url}`, {
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
        {/* 头部导航栏 - 参考详情页风格 */}
        <Card className="app-card-static mb-16">
          <Row justify="space-between" align="middle">
            <Col>
              <Space align="center">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(-1)}
                >
                  返回
                </Button>
                <Space align="center" style={{ marginLeft: 16 }}>
                  {isEdit ? <EditOutlined style={{ fontSize: 24, color: '#10B981' }} /> : <FormOutlined style={{ fontSize: 24, color: '#10B981' }} />}
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                      {isEdit ? '编辑记录尺' : '新建记录尺'}
                    </div>
                  </div>
                </Space>
              </Space>
            </Col>
            {!isMobile && (
              <Col>
                <Space>
                  <Button onClick={() => navigate(-1)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={submitting}
                    onClick={() => form.submit()}
                  >
                    {isEdit ? '保存修改' : '创建记录尺'}
                  </Button>
                </Space>
              </Col>
            )}
          </Row>
        </Card>

        {/* 表单内容区域 */}
        <Card className="app-card-static" loading={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Row gutter={48}>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="name"
                  label="记录尺名称"
                  rules={[{ required: true, message: '请输入记录尺名称' }]}
                  extra="给你的记录尺起个名字，方便识别"
                >
                  <Input placeholder="例如：小明的成长记录" />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="subject"
                  label="记录对象"
                  extra="记录对象名称（如：小明）"
                >
                  <Input placeholder="例如：小明" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={48}>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="template_id"
                  label="模板类型"
                  rules={[{ required: true, message: '请选择模板类型' }]}
                  initialValue="height-weight"
                  extra="选择适合的模板类型"
                >
                  <Select
                    placeholder="请选择模板类型"
                    disabled={isEdit}
                    options={templates.map((t) => ({
                      value: t.id,
                      label: (
                        <Space>
                          <span>{t.icon || '📊'}</span>
                          <span>{t.name}</span>
                        </Space>
                      ),
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="描述"
              extra="可选，添加一些描述信息"
            >
              <TextArea
                placeholder="请输入描述（可选）"
                rows={3}
                showCount
                maxLength={200}
              />
            </Form.Item>

            {/* 移动端底部按钮 */}
            {isMobile && (
              <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => navigate(-1)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={submitting}
                    onClick={() => form.submit()}
                  >
                    {isEdit ? '保存修改' : '创建记录尺'}
                  </Button>
                </Space>
              </Form.Item>
            )}
          </Form>
        </Card>
      </div>
    </div>
  );
}