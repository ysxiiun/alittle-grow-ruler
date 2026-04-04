/**
 * 主应用组件
 */

import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/Home';
import RulerForm from './pages/RulerForm';
import RulerDetail from './pages/RulerDetail';
import ImportData from './pages/ImportData';
import Templates from './pages/Templates';
import TemplateDetail from './pages/TemplateDetail';
import DataForm from './pages/DataForm';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#10B981',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          colorInfo: '#3B82F6',
          borderRadius: 8,
          wireframe: false,
        },
        components: {
          Card: {
            borderRadiusLG: 12,
          },
          Button: {
            borderRadiusLG: 8,
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
          <Route path="/ruler/new" element={<RulerForm />} />
          <Route path="/ruler/:id/edit" element={<RulerForm />} />
          <Route path="/ruler/:id" element={<RulerDetail />} />
          <Route path="/ruler/:id/import" element={<ImportData />} />
          <Route path="/ruler/:id/add" element={<DataForm />} />
          <Route path="/ruler/:id/edit/:dataId" element={<DataForm />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
