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

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          colorInfo: '#1677ff',
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
          <Route path="/ruler/new" element={<RulerForm />} />
          <Route path="/ruler/:id/edit" element={<RulerForm />} />
          <Route path="/ruler/:id" element={<RulerDetail />} />
          <Route path="/ruler/:id/import" element={<ImportData />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
