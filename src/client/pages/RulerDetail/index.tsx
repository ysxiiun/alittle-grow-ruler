/**
 * 记录尺详情页面 - 包含数据图表和记录列表（响应式版本）
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tabs,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Empty,
  message,
  Popconfirm,
  Typography,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  LineChartOutlined,
  TableOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text } = Typography;

interface Record {
  id: number;
  ruler_id: number;
  record_date: string;
  height: number | null;
  weight: number | null;
  weight_unit: string;
  created_at: string;
}

interface TrendDataPoint {
  date: string;
  height: number | null;
  weight: number | null;
}

interface RulerInfo {
  id: number;
  name: string;
  description: string;
  template_type: string;
}

interface Stats {
  latestHeight: number | null;
  latestWeight: number | null;
  heightChange: number | null;
  weightChange: number | null;
  totalRecords: number;
  dateRange: string;
}

const weightUnitOptions = [
  { value: 'kg', label: '公斤 (kg)' },
  { value: 'jin', label: '市斤' },
];

export default function RulerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();

  const [ruler, setRuler] = useState<RulerInfo | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [stats, setStats] = useState<Stats>({
    latestHeight: null,
    latestWeight: null,
    heightChange: null,
    weightChange: null,
    totalRecords: 0,
    dateRange: '-',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'jin'>('kg');
  const [form] = Form.useForm();

  const fetchRuler = async () => {
    try {
      const result = await request<{ data: RulerInfo }>(`/rulers/${id}`);
      setRuler(result.data);
    } catch (error) {
      message.error('加载记录尺信息失败');
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await request<{
        data: { records: Record[]; total: number };
      }>(`/records?ruler_id=${id}&page=1&pageSize=1000`);
      const sortedRecords = result.data.records.sort(
        (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
      );
      setRecords(sortedRecords);
      calculateStats(sortedRecords);
    } catch (error) {
      message.error('加载记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const result = await request<{ data: { trend: TrendDataPoint[] } }>(
        `/analysis/trend/${id}`
      );
      setTrendData(result.data.trend);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    }
  };

  const calculateStats = (data: Record[]) => {
    if (data.length === 0) {
      setStats({
        latestHeight: null,
        latestWeight: null,
        heightChange: null,
        weightChange: null,
        totalRecords: 0,
        dateRange: '-',
      });
      return;
    }

    const sorted = [...data].sort((a, b) =>
      new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    );

    const latest = sorted[0];
    const earliest = sorted[sorted.length - 1];

    const heightChange =
      latest.height !== null && earliest.height !== null
        ? latest.height - earliest.height
        : null;
    const weightChange =
      latest.weight !== null && earliest.weight !== null
        ? latest.weight - earliest.weight
        : null;

    setStats({
      latestHeight: latest.height,
      latestWeight: latest.weight,
      heightChange,
      weightChange,
      totalRecords: data.length,
      dateRange: `${new Date(earliest.record_date).toLocaleDateString('zh-CN')} ~ ${new Date(
        latest.record_date
      ).toLocaleDateString('zh-CN')}`,
    });
  };

  useEffect(() => {
    if (id) {
      fetchRuler();
      fetchRecords();
      fetchAnalysis();
    }
  }, [id]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      weight_unit: weightUnit,
      record_date: dayjs(),
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      record_date: dayjs(record.record_date),
      height: record.height,
      weight: record.weight,
      weight_unit: record.weight_unit,
    });
    setModalVisible(true);
  };

  const handleDelete = async (recordId: number) => {
    try {
      await request(`/records/${recordId}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchRecords();
      fetchAnalysis();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingRecord ? `/records/${editingRecord.id}` : '/records';
      const method = editingRecord ? 'PUT' : 'POST';

      const body = {
        ...values,
        ruler_id: parseInt(id!),
        record_date: values.record_date.format('YYYY-MM-DD'),
      };

      await request(url, { method, body });
      message.success(editingRecord ? '更新成功' : '添加成功');
      setModalVisible(false);
      fetchRecords();
      fetchAnalysis();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 图表配置
  const chartOption: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { color: '#333' },
    },
    legend: {
      data: ['身高', '体重'],
      bottom: 0,
      itemGap: 24,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: trendData.map((d) => d.date),
      axisLabel: {
        rotate: 45,
        interval: 'auto',
        color: '#666',
      },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '身高 (cm)',
        position: 'left',
        axisLabel: { formatter: '{value}', color: '#666' },
        axisLine: { lineStyle: { color: '#1677ff' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      {
        type: 'value',
        name: `体重 (${weightUnit})`,
        position: 'right',
        axisLabel: { formatter: '{value}', color: '#666' },
        axisLine: { lineStyle: { color: '#52c41a' } },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '身高',
        type: 'line',
        yAxisIndex: 0,
        data: trendData.map((d) => d.height ?? null),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#1677ff' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
            { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
          ]),
        },
      },
      {
        name: '体重',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map((d) => d.weight ?? null),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
          ]),
        },
      },
    ],
  };

  // 表格列定义
  const tableColumns = [
    {
      title: '日期',
      dataIndex: 'record_date',
      key: 'record_date',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
      sorter: (a: Record, b: Record) =>
        new Date(a.record_date).getTime() - new Date(b.record_date).getTime(),
    },
    {
      title: '身高 (cm)',
      dataIndex: 'height',
      key: 'height',
      render: (height: number | null) => height ?? '-',
    },
    {
      title: `体重 (${weightUnit})`,
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number | null, record: Record) =>
        weight
          ? `${weight} ${record.weight_unit === 'jin' ? '斤' : 'kg'}`
          : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 统计卡片
  const renderStats = () => (
    <Row gutter={[16, 16]} className="mb-16">
      <Col xs={24} sm={12} md={6}>
        <Card className="app-card-static">
          <Statistic
            title="最新身高"
            value={stats.latestHeight ?? '-'}
            suffix={stats.latestHeight ? 'cm' : ''}
            valueStyle={{ color: '#1677ff', fontWeight: 600 }}
          />
          {stats.heightChange !== null && (
            <div style={{ marginTop: 8 }}>
              <Tag color={stats.heightChange >= 0 ? 'success' : 'error'}>
                {stats.heightChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                {Math.abs(stats.heightChange).toFixed(1)} cm
              </Tag>
            </div>
          )}
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className="app-card-static">
          <Statistic
            title="最新体重"
            value={stats.latestWeight ?? '-'}
            suffix={stats.latestWeight ? weightUnit : ''}
            valueStyle={{ color: '#52c41a', fontWeight: 600 }}
          />
          {stats.weightChange !== null && (
            <div style={{ marginTop: 8 }}>
              <Tag color={stats.weightChange >= 0 ? 'success' : 'error'}>
                {stats.weightChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                {Math.abs(stats.weightChange).toFixed(1)} {weightUnit}
              </Tag>
            </div>
          )}
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className="app-card-static">
          <Statistic
            title="记录总数"
            value={stats.totalRecords}
            valueStyle={{ color: '#faad14', fontWeight: 600 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className="app-card-static">
          <Statistic
            title="记录时间范围"
            value={stats.dateRange}
            valueStyle={{ fontSize: 14, fontWeight: 600 }}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* 头部导航 */}
        <Card className="app-card-static mb-16">
          <Row justify="space-between" align="middle">
            <Col>
              <Space align="center">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/')}
                >
                  返回
                </Button>
                <Space align="center" style={{ marginLeft: 16 }}>
                  <LineChartOutlined className="text-primary" style={{ fontSize: 24 }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{ruler?.name || '记录尺详情'}</div>
                    {ruler?.description && (
                      <div className="text-caption">{ruler.description}</div>
                    )}
                  </div>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                <Select
                  value={weightUnit}
                  onChange={setWeightUnit}
                  options={weightUnitOptions}
                  style={{ width: 120 }}
                />
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() => navigate(`/ruler/${id}/import`)}
                >
                  导入
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  添加记录
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 统计卡片 */}
        {renderStats()}

        {/* 内容区域 */}
        <Card className="app-card-static">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <Space>
                  <LineChartOutlined />
                  趋势图表
                </Space>
              }
              key="chart"
            >
              {trendData.length === 0 ? (
                <Empty
                  description="暂无数据，点击右上角添加记录"
                  style={{ padding: '48px 0' }}
                />
              ) : (
                <ReactECharts option={chartOption} style={{ height: '400px' }} />
              )}
            </TabPane>
            <TabPane
              tab={
                <Space>
                  <TableOutlined />
                  记录列表
                  <Badge count={stats.totalRecords} showZero={false} />
                </Space>
              }
              key="list"
            >
              <Table
                dataSource={records}
                columns={tableColumns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: isMobile ? 400 : undefined }}
              />
            </TabPane>
          </Tabs>
        </Card>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑记录' : '添加记录'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
        width={isMobile ? '90%' : 520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="record_date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="height" label="身高 (cm)">
                <Input type="number" placeholder="请输入身高" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="weight" label="体重">
                <Input type="number" placeholder="请输入体重" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="weight_unit"
            label="体重单位"
            rules={[{ required: true }]}
          >
            <Select options={weightUnitOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
