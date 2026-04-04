/**
 * 数据表单页面（添加/编辑数据）
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  TimePicker,
  Select,
  Button,
  Space,
  Spin,
  message,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';

interface TemplateField {
  key: string;
  label: string;
  type: 'number' | 'string' | 'date' | 'select';
  unit?: string;
  precision?: number;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface Template {
  id: string;
  name: string;
  icon?: string;
  fields: TemplateField[];
}

interface RulerInfo {
  id: number;
  template_id: string;
  name: string;
}

interface DataEntry {
  id: number;
  record_id: number;
  timestamp: string;
  values: Record<string, number | string | null>;
  note?: string;
}

export default function DataForm() {
  const { id, dataId } = useParams<{ id: string; dataId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ruler, setRuler] = useState<RulerInfo | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [weightPeriodTouched, setWeightPeriodTouched] = useState(Boolean(dataId));
  const autoSettingWeightPeriodRef = useRef(false);

  const isEdit = Boolean(dataId);

  const getDefaultWeightPeriod = (timestamp: dayjs.Dayjs): 'morning' | 'night' | undefined => {
    const hour = timestamp.hour();
    if (hour >= 4 && hour <= 10) {
      return 'morning';
    }
    if (hour >= 18 && hour <= 23) {
      return 'night';
    }
    return undefined;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 获取记录尺信息
      const recordResult = await request<{ data: RulerInfo & { template: Template } }>(`/rulers/${id}`);
      setRuler(recordResult.data);
      setTemplate(recordResult.data.template);

      // 如果是编辑，获取数据详情
      if (dataId) {
        const entryResult = await request<{ data: DataEntry }>(`/records/${dataId}`);

        // 设置表单值
        const timestamp = dayjs(entryResult.data.timestamp);
        form.setFieldsValue({
          date: timestamp,
          time: timestamp,
          note: entryResult.data.note,
        });
        setWeightPeriodTouched(true);

        // 设置动态字段值
        for (const field of recordResult.data.template.fields) {
          form.setFieldValue(field.key, entryResult.data.values[field.key]);
        }
      } else {
        // 新建时设置默认值
        const now = dayjs();
        form.setFieldsValue({
          date: now,
          time: now,
          weight_period: recordResult.data.template.id === 'pregnancy-weight' ? getDefaultWeightPeriod(now) : undefined,
        });
        setWeightPeriodTouched(false);
      }
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, dataId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // 组合 timestamp
      const date = values.date.format('YYYY-MM-DD');
      const time = values.time.format('HH:mm');
      const timestamp = `${date} ${time}`;

      // 组合动态字段值
      const dataValues: Record<string, number | string | null> = {};
      if (template) {
        for (const field of template.fields) {
          dataValues[field.key] = values[field.key];
        }
      }

      const payload = {
        record_id: parseInt(id!),
        timestamp,
        values: dataValues,
        note: values.note,
      };

      if (isEdit) {
        await request(`/records/${dataId}`, {
          method: 'PUT',
          body: payload,
        });
        message.success('更新成功');
      } else {
        await request('/records', {
          method: 'POST',
          body: payload,
        });
        message.success('添加成功');
      }

      navigate(`/ruler/${id}`);
    } catch (error) {
      message.error(isEdit ? '更新失败' : '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (field: TemplateField) => {
    switch (field.type) {
      case 'number':
        return (
          <InputNumber
            placeholder={field.placeholder || `请输入${field.label}`}
            precision={field.precision}
            addonAfter={field.unit}
            style={{ width: '100%' }}
          />
        );
      case 'select':
        return (
          <Select
            placeholder={field.placeholder || `请选择${field.label}`}
            options={field.options}
          />
        );
      case 'string':
        return (
          <Input placeholder={field.placeholder || `请输入${field.label}`} />
        );
      default:
        return (
          <Input placeholder={field.placeholder || `请输入${field.label}`} />
        );
    }
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
                  onClick={() => navigate(`/ruler/${id}`)}
                >
                  返回
                </Button>
                <Space align="center" style={{ marginLeft: 16 }}>
                  <span style={{ fontSize: 24 }}>{template?.icon || '📊'}</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                      {isEdit ? '编辑记录' : '添加记录'}
                    </div>
                    {ruler && (
                      <div className="text-caption">{ruler.name}</div>
                    )}
                  </div>
                </Space>
              </Space>
            </Col>
            {!isMobile && (
              <Col>
                <Space>
                  <Button onClick={() => navigate(`/ruler/${id}`)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => form.submit()}
                  >
                    保存
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
            onValuesChange={(changedValues, allValues) => {
              if ('weight_period' in changedValues) {
                if (autoSettingWeightPeriodRef.current) {
                  autoSettingWeightPeriodRef.current = false;
                } else {
                  setWeightPeriodTouched(true);
                }
              }

              if (
                template?.id === 'pregnancy-weight' &&
                'time' in changedValues &&
                !weightPeriodTouched &&
                allValues.time
              ) {
                autoSettingWeightPeriodRef.current = true;
                form.setFieldValue('weight_period', getDefaultWeightPeriod(allValues.time));
              }
            }}
          >
            <Row gutter={48}>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item label="时间" name="time" rules={[{ required: true, message: '请选择时间' }]}>
                  <TimePicker style={{ width: '100%' }} format="HH:mm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={48}>
              {template?.fields.map((field) => (
                <Col xs={24} sm={12} lg={8} key={field.key}>
                  <Form.Item
                    label={field.label}
                    name={field.key}
                    rules={[{
                      required: field.required,
                      message: field.type === 'select' ? `请选择${field.label}` : `请输入${field.label}`,
                    }]}
                  >
                    {renderFieldInput(field)}
                  </Form.Item>
                </Col>
              ))}
            </Row>

            <Row gutter={48}>
              <Col xs={24} lg={16}>
                <Form.Item label="备注" name="note">
                  <Input.TextArea placeholder="可选备注信息" rows={2} />
                </Form.Item>
              </Col>
            </Row>

            {/* 移动端底部按钮 */}
            {isMobile && (
              <>
                <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => navigate(`/ruler/${id}`)}>
                      取消
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>
                      保存
                    </Button>
                  </Space>
                </Form.Item>
              </>
            )}
          </Form>
        </Card>
      </div>
    </div>
  );
}
