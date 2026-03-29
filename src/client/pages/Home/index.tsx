/**
 * 首页 - 记录尺列表页面（响应式版本）
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Card,
  Tag,
  Empty,
  Dropdown,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Space,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
  LineChartOutlined,
  CalendarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';
import type { MenuProps } from 'antd';

interface RecordRuler {
  id: number;
  name: string;
  description: string;
  template_type: string;
  created_at: string;
  updated_at: string;
  record_count?: number;
}

interface Stats {
  totalRulers: number;
  totalRecords: number;
  recentRecords: number;
}

const templateOptions = [
  { value: '', label: '全部模板' },
  { value: 'height_weight', label: '身高体重' },
];

const sortOptions = [
  { value: 'updated_desc', label: '最近更新' },
  { value: 'created_desc', label: '最新创建' },
  { value: 'name_asc', label: '名称排序' },
];

const templateNames: Record<string, string> = {
  height_weight: '身高体重',
};

const templateColors: Record<string, string> = {
  height_weight: 'blue',
};

export default function Home() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [rulers, setRulers] = useState<RecordRuler[]>([]);
  const [filteredRulers, setFilteredRulers] = useState<RecordRuler[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRulers: 0, totalRecords: 0, recentRecords: 0 });
  const [searchText, setSearchText] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('updated_desc');
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRuler, setSelectedRuler] = useState<RecordRuler | null>(null);

  const fetchRulers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) {
        params.set('search', searchText);
      }
      if (templateFilter) {
        params.set('template_type', templateFilter);
      }

      const url = `/rulers${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await request<{ data: RecordRuler[] }>(url);

      // 获取每个记录尺的记录数
      const rulersWithCount = await Promise.all(
        result.data.map(async (ruler) => {
          try {
            const recordsResult = await request<{ data: { total: number } }>(
              `/records?ruler_id=${ruler.id}&page=1&pageSize=1`
            );
            return { ...ruler, record_count: recordsResult.data.total };
          } catch {
            return { ...ruler, record_count: 0 };
          }
        })
      );

      setRulers(rulersWithCount);
      filterAndSortRulers(rulersWithCount);

      // 计算统计数据
      const totalRecords = rulersWithCount.reduce((sum, r) => sum + (r.record_count || 0), 0);
      setStats({
        totalRulers: rulersWithCount.length,
        totalRecords,
        recentRecords: rulersWithCount.filter(
          (r) => new Date(r.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      });
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRulers = (data: RecordRuler[]) => {
    let result = [...data];

    // 排序
    switch (sortBy) {
      case 'updated_desc':
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case 'created_desc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        break;
    }

    setFilteredRulers(result);
  };

  useEffect(() => {
    fetchRulers();
  }, []);

  useEffect(() => {
    filterAndSortRulers(rulers);
  }, [sortBy, rulers]);

  const handleDelete = async () => {
    if (!selectedRuler) return;

    try {
      await request(`/rulers/${selectedRuler.id}`, { method: 'DELETE' });
      message.success('删除成功');
      fetchRulers();
    } catch (error) {
      message.error('删除失败');
    }
    setDeleteModalVisible(false);
    setSelectedRuler(null);
  };

  const showDeleteModal = (ruler: RecordRuler) => {
    setSelectedRuler(ruler);
    setDeleteModalVisible(true);
  };

  const getActionItems = (ruler: RecordRuler): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => navigate(`/ruler/${ruler.id}/edit`),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => showDeleteModal(ruler),
    },
  ];

  // Hero 区域
  const renderHero = () => (
    <div className="hero-section">
      <div className="hero-title">ALittle 成长尺</div>
      <div className="hero-subtitle">记录每一步成长，见证每一份进步</div>
    </div>
  );

  // 统计卡片
  const renderStats = () => (
    <Row gutter={[16, 16]} className="mb-24">
      <Col xs={24} sm={12} md={8}>
        <Card className="app-card-static">
          <Statistic
            title="记录尺数量"
            value={stats.totalRulers}
            prefix={<LineChartOutlined className="text-primary" />}
            valueStyle={{ color: '#1677ff', fontWeight: 600 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card className="app-card-static">
          <Statistic
            title="总记录数"
            value={stats.totalRecords}
            prefix={<CalendarOutlined className="text-success" />}
            valueStyle={{ color: '#52c41a', fontWeight: 600 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card className="app-card-static">
          <Statistic
            title="本周更新"
            value={stats.recentRecords}
            prefix={<RiseOutlined className="text-warning" />}
            valueStyle={{ color: '#faad14', fontWeight: 600 }}
          />
        </Card>
      </Col>
    </Row>
  );

  // 筛选栏
  const renderFilterBar = () => (
    <Card className="app-card-static mb-16">
      <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }} size="middle">
        <Input
          placeholder="搜索记录尺名称或描述"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={fetchRulers}
          prefix={<SearchOutlined />}
          style={{ width: isMobile ? '100%' : 280 }}
          allowClear
        />
        <Space>
          <Select
            placeholder="模板筛选"
            value={templateFilter}
            onChange={(value) => {
              setTemplateFilter(value);
              fetchRulers();
            }}
            options={templateOptions}
            style={{ width: 140 }}
          />
          <Select
            placeholder="排序方式"
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            style={{ width: 140 }}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/ruler/new')}
          style={{ marginLeft: isMobile ? 0 : 'auto' }}
        >
          新建记录尺
        </Button>
      </Space>
    </Card>
  );

  // 记录尺卡片
  const renderRulerCard = (ruler: RecordRuler) => (
    <Card
      key={ruler.id}
      className="app-card"
      hoverable
      onClick={() => navigate(`/ruler/${ruler.id}`)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space align="center" style={{ marginBottom: 8 }}>
            <span className="text-heading">{ruler.name}</span>
            <Tag color={templateColors[ruler.template_type] || 'default'}>
              {templateNames[ruler.template_type] || ruler.template_type}
            </Tag>
          </Space>
          <div className="text-body" style={{ marginBottom: 12 }}>
            {ruler.description || '暂无描述'}
          </div>
          <Space className="text-caption">
            <span>记录数: {ruler.record_count || 0}</span>
            <span>·</span>
            <span>更新于: {new Date(ruler.updated_at).toLocaleDateString('zh-CN')}</span>
          </Space>
        </div>
        <Dropdown
          menu={{ items: getActionItems(ruler) }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    </Card>
  );

  // 空状态
  const renderEmpty = () => (
    <Card className="app-card-static" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <Empty
        description={
          searchText || templateFilter
            ? '暂无匹配的记录尺'
            : '暂无记录尺，点击下方按钮创建第一个记录尺'
        }
      >
        {!searchText && !templateFilter && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ruler/new')}>
            创建记录尺
          </Button>
        )}
      </Empty>
    </Card>
  );

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {renderHero()}
        {renderStats()}
        {renderFilterBar()}

        {filteredRulers.length === 0 ? (
          renderEmpty()
        ) : (
          <Row gutter={[16, 16]}>
            {filteredRulers.map((ruler) => (
              <Col xs={24} sm={12} lg={8} key={ruler.id}>
                {renderRulerCard(ruler)}
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedRuler(null);
        }}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除记录尺「{selectedRuler?.name}」吗？</p>
        <p style={{ color: '#999', fontSize: 12 }}>删除后将无法恢复，该记录尺下的所有数据也将被删除。</p>
      </Modal>
    </div>
  );
}
