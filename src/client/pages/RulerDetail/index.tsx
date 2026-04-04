/**
 * 记录尺详情页面
 * 按模板动态渲染统计、图表和导出格式
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Tabs,
  Space,
  Row,
  Col,
  Empty,
  message,
  Popconfirm,
  Badge,
  Spin,
  Dropdown,
  Segmented,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LineChartOutlined,
  TableOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  MoreOutlined,
  DownOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';

const { TabPane } = Tabs;

interface TemplateField {
  key: string;
  label: string;
  type: string;
  unit?: string;
  options?: Array<{ value: string; label: string }>;
}

interface TemplateStat {
  id: string;
  label: string;
  calc: string;
  unit?: string;
  precision?: number;
}

interface TemplateChart {
  id: string;
  type: 'line' | 'bar' | 'pie';
  title: string;
  field?: string;
  fields?: string[];
  description?: string;
}

interface Template {
  id: string;
  name: string;
  fields: TemplateField[];
  stats: TemplateStat[];
  charts: TemplateChart[];
  icon?: string;
}

interface DataEntry {
  id: number;
  record_id: number;
  timestamp: string;
  values: Record<string, number | string | null>;
  note?: string;
}

interface RulerInfo {
  id: number;
  template_id: string;
  name: string;
  description?: string;
  subject?: string;
}

interface FullAnalysis {
  template_stats: Record<string, number | null>;
}

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface ChartData {
  chart_id: string;
  title: string;
  data: TrendPoint[];
  series: Array<{
    field: string;
    data: TrendPoint[];
  }>;
}

type ChartRange = 'all' | '3m' | '1m' | '1w';

export default function RulerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();

  const [record, setRecord] = useState<RulerInfo | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [chartDataMap, setChartDataMap] = useState<Record<string, ChartData>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chart');
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>('1m');

  const fieldMap = useMemo(
    () => new Map((template?.fields || []).map((field) => [field.key, field])),
    [template]
  );

  const getSeriesLabel = (field: string, chart: TemplateChart): string => {
    if (field === 'weight_morning') {
      return '晨起体重';
    }
    if (field === 'weight_night') {
      return '睡前体重';
    }
    if (field === 'weight_mean' || chart.id === 'weekly-change') {
      return '周均环比';
    }
    return fieldMap.get(field)?.label || field;
  };

  const getFilteredChartData = (chartData?: ChartData): ChartData | undefined => {
    if (!chartData || chartRange === 'all') {
      return chartData;
    }

    const allTimestamps = chartData.series.flatMap((series) => series.data.map((point) => point.timestamp));
    if (allTimestamps.length === 0) {
      return chartData;
    }

    const latestTimestamp = allTimestamps.sort().at(-1);
    if (!latestTimestamp) {
      return chartData;
    }

    const latestDate = dayjs(latestTimestamp);
    const cutoff = chartRange === '1w'
      ? latestDate.subtract(1, 'week')
      : chartRange === '1m'
        ? latestDate.subtract(1, 'month')
        : latestDate.subtract(3, 'month');

    const filteredSeries = chartData.series.map((series) => ({
      ...series,
      data: series.data.filter((point) => dayjs(point.timestamp).isAfter(cutoff) || dayjs(point.timestamp).isSame(cutoff, 'day')),
    }));

    return {
      ...chartData,
      data: filteredSeries[0]?.data || [],
      series: filteredSeries,
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const recordResult = await request<{
        data: RulerInfo & { template: Template };
      }>(`/rulers/${id}`);
      const templateData = recordResult.data.template;

      setRecord(recordResult.data);
      setTemplate(templateData);

      const [entriesResult, analysisResult, chartResults] = await Promise.all([
        request<{ data: { entries: DataEntry[]; total: number } }>(`/records?record_id=${id}&page=1&pageSize=1000`),
        request<{ data: FullAnalysis }>(`/analysis/full/${id}`),
        Promise.all(
          templateData.charts.map((chart) =>
            request<{ data: ChartData }>(`/analysis/chart/${id}?chart_id=${chart.id}`)
          )
        ),
      ]);

      setEntries(entriesResult.data.entries);
      setAnalysis(analysisResult.data);
      setChartDataMap(
        chartResults.reduce<Record<string, ChartData>>((acc, result) => {
          acc[result.data.chart_id] = result.data;
          return acc;
        }, {})
      );
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleDelete = async (entryId: number) => {
    try {
      await request(`/records/${entryId}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const openExport = (format: 'xlsx' | 'csv') => {
    window.open(`/api/records/export/${id}?format=${format}`, '_blank');
  };

  const getChartOption = (chart: TemplateChart, chartData?: ChartData): echarts.EChartsOption => {
    const filteredChartData = getFilteredChartData(chartData);
    const seriesList = filteredChartData?.series || [];
    const xAxisData = Array.from(
      new Set(seriesList.flatMap((series) => series.data.map((point) => point.timestamp)))
    ).sort();
    const colors = ['#10B981', '#1677ff', '#fa8c16', '#ef4444'];
    const valueList = seriesList.flatMap((series) => series.data.map((point) => point.value));
    const includeZero = chart.type === 'bar';
    const safeValues = includeZero ? [...valueList, 0] : valueList;
    const minValue = safeValues.length > 0 ? Math.min(...safeValues) : 0;
    const maxValue = safeValues.length > 0 ? Math.max(...safeValues) : 0;
    const range = maxValue - minValue;
    const padding = range > 0 ? Math.max(range * 0.1, 0.5) : 1;
    const yAxisMin = Math.floor((minValue - padding) * 10) / 10;
    const yAxisMax = Math.ceil((maxValue + padding) * 10) / 10;

    if (chart.type === 'pie') {
      return {
        tooltip: {
          trigger: 'item',
        },
        series: [
          {
            type: 'pie',
            radius: '65%',
            data: seriesList.map((series, index) => ({
              name: getSeriesLabel(series.field, chart),
              value: series.data[series.data.length - 1]?.value || 0,
              itemStyle: { color: colors[index % colors.length] },
            })),
          },
        ],
      };
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e8e8e8',
        borderWidth: 1,
        textStyle: { color: '#333' },
      },
      legend: {
        top: 0,
        data: seriesList.map((series) => getSeriesLabel(series.field, chart)),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: 45,
          color: '#666',
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
      },
      yAxis: {
        type: 'value',
        min: yAxisMin,
        max: yAxisMax,
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series: seriesList.map((series, index) => ({
        name: getSeriesLabel(series.field, chart),
        type: chart.type,
        smooth: chart.type === 'line',
        data: xAxisData.map((timestamp) => {
          const point = series.data.find((item) => item.timestamp === timestamp);
          return point?.value ?? null;
        }),
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: colors[index % colors.length] },
        lineStyle: { width: 3 },
        areaStyle: chart.type === 'line' && seriesList.length === 1
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
              ]),
            }
          : undefined,
      })),
    };
  };

  const getTableColumns = () => {
    const columns: any[] = [
      {
        title: '时间',
        dataIndex: 'timestamp',
        key: 'timestamp',
        render: (timestamp: string) => dayjs(timestamp).format('YYYY-MM-DD HH:mm'),
        sorter: (a: DataEntry, b: DataEntry) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      },
    ];

    if (template) {
      for (const field of template.fields) {
        columns.push({
          title: `${field.label}${field.unit ? ` (${field.unit})` : ''}`,
          key: field.key,
          render: (_: unknown, row: DataEntry) => {
            const value = row.values[field.key];
            if (value === undefined || value === null) {
              return '-';
            }
            if (field.type === 'select') {
              return field.options?.find((option) => option.value === value)?.label || String(value);
            }
            return String(value);
          },
        });
      }
    }

    columns.push({
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => note || '-',
    });

    columns.push({
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, row: DataEntry) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/ruler/${id}/edit/${row.id}`)}
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(row.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    });

    return columns;
  };

  const getExportMenuItems = (): MenuProps['items'] => [
    {
      key: 'export-xlsx',
      icon: <FileExcelOutlined />,
      label: '导出 Excel',
      onClick: () => openExport('xlsx'),
    },
    {
      key: 'export-csv',
      icon: <DownloadOutlined />,
      label: '导出 CSV',
      onClick: () => openExport('csv'),
    },
  ];

  const getMobileActionItems = (): MenuProps['items'] => [
    {
      key: 'import',
      icon: <FileExcelOutlined />,
      label: '导入数据',
      onClick: () => navigate(`/ruler/${id}/import`),
    },
    ...getExportMenuItems(),
  ];

  const renderMobileStats = () => {
    if (!template || !analysis) return null;

    const displayStats = template.stats.slice(0, 3);
    const hiddenStats = template.stats.slice(3);

    return (
      <Card className="app-card-static mb-16" bodyStyle={{ padding: 12 }}>
        <Row gutter={8}>
          {displayStats.map((stat) => {
            const value = analysis.template_stats[stat.id];
            return (
              <Col span={8} key={stat.id}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#10B981' }}>
                    {value !== null && value !== undefined ? value.toFixed(stat.precision || 1) : '-'}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>{stat.label}</div>
                </div>
              </Col>
            );
          })}
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#faad14' }}>{entries.length}</div>
              <div style={{ fontSize: 11, color: '#999' }}>记录总数</div>
            </div>
          </Col>
        </Row>

        {hiddenStats.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div
              onClick={() => setStatsExpanded(!statsExpanded)}
              style={{ textAlign: 'center', color: '#10B981', fontSize: 12, cursor: 'pointer' }}
            >
              {statsExpanded ? '收起统计' : `查看更多统计 (${hiddenStats.length})`}
              <DownOutlined
                style={{
                  marginLeft: 4,
                  transform: statsExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
            {statsExpanded && (
              <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                {hiddenStats.map((stat) => {
                  const value = analysis.template_stats[stat.id];
                  return (
                    <Col span={12} key={stat.id}>
                      <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: 6, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#999' }}>{stat.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#10B981' }}>
                          {value !== null && value !== undefined ? `${value.toFixed(stat.precision || 1)}${stat.unit || ''}` : '-'}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>
        )}
      </Card>
    );
  };

  const renderPCStats = () => {
    if (!template || !analysis) return null;

    return (
      <Row gutter={[16, 16]} className="mb-16">
        {template.stats.map((stat) => {
          const value = analysis.template_stats[stat.id];
          return (
            <Col xs={24} sm={12} md={6} key={stat.id}>
              <Card className="app-card-static">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>📊</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#999' }}>{stat.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#10B981' }}>
                      {value !== null && value !== undefined ? value.toFixed(stat.precision || 1) : '-'}
                      {value !== null ? <span style={{ fontSize: 12, color: '#999' }}> {stat.unit}</span> : ''}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
        <Col xs={24} sm={12} md={6}>
          <Card className="app-card-static">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>📋</div>
              <div>
                <div style={{ fontSize: 12, color: '#999' }}>记录总数</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>{entries.length}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderCharts = () => {
    if (!template) {
      return null;
    }

    if (entries.length === 0) {
      return (
        <Empty
          description="暂无数据，点击右上角添加记录"
          style={{ padding: '48px 0' }}
        />
      );
    }

    if (template.charts.length === 0) {
      return <Empty description="当前模板未定义图表" style={{ padding: '48px 0' }} />;
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
          <Segmented
            block={isMobile}
            value={chartRange}
            onChange={(value) => setChartRange(value as ChartRange)}
            style={isMobile ? { width: '100%', padding: 4 } : undefined}
            options={[
              { label: '全部', value: 'all' },
              { label: '最近三月', value: '3m' },
              { label: '最近一月', value: '1m' },
              { label: '最近一周', value: '1w' },
            ]}
          />
        </div>
        {template.charts.map((chart) => (
          <Card key={chart.id} className="app-card-static">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{chart.title}</div>
            {chart.description && (
              <div className="text-caption" style={{ marginBottom: 12 }}>
                {chart.description}
              </div>
            )}
            <ReactECharts
              option={getChartOption(chart, chartDataMap[chart.id])}
              style={{ height: isMobile ? '280px' : '360px' }}
            />
          </Card>
        ))}
      </Space>
    );
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
        {isMobile && (
          <Card className="app-card-static mb-16" bodyStyle={{ padding: 12 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
              <Col>
                <Space>
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                    style={{ padding: 0 }}
                  />
                  <span style={{ fontSize: 18, fontWeight: 600 }}>
                    {template?.icon || '📊'} {record?.name || '记录尺详情'}
                  </span>
                </Space>
              </Col>
              <Col>
                <Space size={8}>
                  <Dropdown menu={{ items: getMobileActionItems() }} placement="bottomRight">
                    <Button icon={<MoreOutlined />} />
                  </Dropdown>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/ruler/${id}/add`)}
                  >
                    添加
                  </Button>
                </Space>
              </Col>
            </Row>
            {record?.subject && (
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                记录对象: {record.subject}
              </div>
            )}
          </Card>
        )}

        {!isMobile && (
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
                    <span style={{ fontSize: 24 }}>{template?.icon || '📊'}</span>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>
                        {record?.name || '记录尺详情'}
                      </div>
                      {record?.subject && (
                        <div className="text-caption">记录对象: {record.subject}</div>
                      )}
                    </div>
                  </Space>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={() => navigate(`/ruler/${id}/import`)}
                  >
                    导入
                  </Button>
                  <Dropdown menu={{ items: getExportMenuItems() }} placement="bottomRight">
                    <Button icon={<DownloadOutlined />}>
                      导出 <DownOutlined />
                    </Button>
                  </Dropdown>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/ruler/${id}/add`)}
                  >
                    添加记录
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {isMobile ? renderMobileStats() : renderPCStats()}

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
              {renderCharts()}
            </TabPane>
            <TabPane
              tab={
                <Space>
                  <TableOutlined />
                  记录列表
                  <Badge count={entries.length} showZero={false} />
                </Space>
              }
              key="list"
            >
              <Table
                dataSource={entries}
                columns={getTableColumns()}
                rowKey="id"
                pagination={{ pageSize: 10, size: 'small' }}
                size="small"
                scroll={{ x: 400 }}
              />
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
