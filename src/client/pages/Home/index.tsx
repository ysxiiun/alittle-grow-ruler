/**
 * 首页 - 记录尺列表页面（响应式版本）
 */

import { useEffect, useState } from 'react';
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
  Space,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import request from '../../utils/request';
import type { MenuProps } from 'antd';

interface RecordRuler {
  id: number;
  name: string;
  description: string;
  template_id: string;
  subject?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  record_count?: number;
  last_time?: string;
}

interface Template {
  id: string;
  name: string;
}

interface Stats {
  totalRulers: number;
  totalRecords: number;
  recentRecords: number;
}

const sortOptions = [
  { value: 'updated_desc', label: '最近更新' },
  { value: 'created_desc', label: '最新创建' },
  { value: 'name_asc', label: '名称排序' },
];

export default function Home() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [rulers, setRulers] = useState<RecordRuler[]>([]);
  const [filteredRulers, setFilteredRulers] = useState<RecordRuler[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRulers: 0, totalRecords: 0, recentRecords: 0 });
  const [searchText, setSearchText] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sortBy, setSortBy] = useState<string>('updated_desc');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRuler, setSelectedRuler] = useState<RecordRuler | null>(null);

  const templateOptions = [
    { value: '', label: '全部' },
    ...templates.map((template) => ({
      value: template.id,
      label: template.name,
    })),
  ];

  const templateNames = templates.reduce<Record<string, string>>((acc, template) => {
    acc[template.id] = template.name;
    return acc;
  }, {});

  const fetchRulers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchText) {
        params.set('search', searchText);
      }
      if (templateFilter) {
        params.set('template_id', templateFilter);
      }

      const url = `/rulers${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await request<{ data: RecordRuler[] }>(url);

      setRulers(result.data);
      filterAndSortRulers(result.data);

      // 计算统计数据
      const totalRecords = result.data.reduce((sum, r) => sum + (r.record_count || 0), 0);
      setStats({
        totalRulers: result.data.length,
        totalRecords,
        recentRecords: result.data.filter(
          (r) => new Date(r.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      });
    } catch (error) {
      message.error('加载失败');
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
    request<{ data: Template[] }>('/templates')
      .then((result) => setTemplates(result.data))
      .catch(() => message.error('加载模板失败'));

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

  const stopEventPropagation = (
    event:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.PointerEvent<HTMLElement>
      | Event
  ) => {
    event.stopPropagation();
  };

  const handleActionMenuClick = (
    ruler: RecordRuler,
    info: { key: string; domEvent: Event }
  ) => {
    info.domEvent.stopPropagation();

    if (info.key === 'edit') {
      navigate(`/ruler/${ruler.id}/edit`);
      return;
    }

    if (info.key === 'delete') {
      showDeleteModal(ruler);
    }
  };

  const getActionItems = (): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
    },
  ];

  // 移动端紧凑头部
  const renderMobileHeader = () => (
    <Card className="app-card-static mb-16" bodyStyle={{ padding: '16px' }}>
      {/* 标题行 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <span style={{ fontSize: 18, fontWeight: 600 }}>📏 ALittle 成长尺</span>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ruler/new')}>
            新建
          </Button>
        </Col>
      </Row>

      {/* 统计行 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: '8px 0', background: '#f6ffed', borderRadius: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#10B981' }}>{stats.totalRulers}</div>
            <div style={{ fontSize: 12, color: '#666' }}>记录尺</div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: '8px 0', background: '#e6f7ff', borderRadius: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1677ff' }}>{stats.totalRecords}</div>
            <div style={{ fontSize: 12, color: '#666' }}>记录数</div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: '8px 0', background: '#fffbe6', borderRadius: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#faad14' }}>{stats.recentRecords}</div>
            <div style={{ fontSize: 12, color: '#666' }}>本周更新</div>
          </div>
        </Col>
      </Row>

      {/* 搜索筛选行 */}
      <Row gutter={[8, 12]} align="middle">
        <Col span={24}>
          <Input
            placeholder="搜索记录尺"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={fetchRulers}
            allowClear
          />
        </Col>
        <Col span={12}>
          <Select
            value={templateFilter}
            onChange={(value) => {
              setTemplateFilter(value);
              fetchRulers();
            }}
            options={templateOptions}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
    </Card>
  );

  // PC端 Hero 区域
  const renderHero = () => (
    <div className="hero-section">
      <div className="hero-title">ALittle 成长尺</div>
      <div className="hero-subtitle">记录每一步成长，见证每一份进步</div>
    </div>
  );

  // PC端 统计卡片
  const renderStats = () => (
    <Row gutter={[16, 16]} className="mb-24">
      <Col xs={24} sm={12} md={8}>
        <Card className="app-card-static">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 32, color: '#10B981' }}>📊</div>
            <div>
              <div style={{ fontSize: 12, color: '#999' }}>记录尺数量</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#10B981' }}>{stats.totalRulers}</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card className="app-card-static">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 32, color: '#1677ff' }}>📋</div>
            <div>
              <div style={{ fontSize: 12, color: '#999' }}>总记录数</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>{stats.totalRecords}</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card className="app-card-static">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 32, color: '#faad14' }}>📈</div>
            <div>
              <div style={{ fontSize: 12, color: '#999' }}>本周更新</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>{stats.recentRecords}</div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );

  // PC端 筛选栏
  const renderFilterBar = () => (
    <Card className="app-card-static mb-16">
      <Row justify="space-between" align="middle" gutter={16}>
        <Col flex="auto">
          <Space size="middle">
            <Input
              placeholder="搜索记录尺名称或描述"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={fetchRulers}
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              allowClear
            />
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
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/ruler/new')}
            size="large"
          >
            新建记录尺
          </Button>
        </Col>
      </Row>
    </Card>
  );

  // 记录尺卡片
  const renderRulerCard = (ruler: RecordRuler) => (
    <Card
      key={ruler.id}
      className="app-card"
      hoverable
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('.ruler-card-actions')) {
          return;
        }
        navigate(`/ruler/${ruler.id}`);
      }}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space align="center" style={{ marginBottom: 8 }}>
            <span className="text-heading">{ruler.name}</span>
            <Tag color="default">
              {templateNames[ruler.template_id] || ruler.template_id}
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
        <div
          className="ruler-card-actions"
          onClick={stopEventPropagation}
          onMouseDown={stopEventPropagation}
          onTouchStart={stopEventPropagation}
        >
          <Dropdown
            menu={{
              items: getActionItems(),
              onClick: (info) => handleActionMenuClick(ruler, info),
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={stopEventPropagation}
              onMouseDown={stopEventPropagation}
              onTouchStart={stopEventPropagation}
            />
          </Dropdown>
        </div>
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
        {/* 移动端紧凑头部 */}
        {isMobile && renderMobileHeader()}

        {/* PC端原有布局 */}
        {!isMobile && renderHero()}
        {!isMobile && renderStats()}
        {!isMobile && renderFilterBar()}

        {/* 记录尺列表 */}
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
