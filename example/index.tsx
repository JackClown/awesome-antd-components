import React from 'react';
import ReactDOM from 'react-dom';
import { ConfigProvider, Layout, Menu } from 'antd';
import moment from 'moment';
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from 'react-router-dom';
import zhCN from 'antd/es/locale/zh_CN';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.less';

import Form from './Form';
import Itable from './ITable';
import './index.less';

moment.locale('zh-cn');

ReactDOM.render(
  <ConfigProvider locale={zhCN}>
    <Router>
      <Layout style={{ height: '100%' }}>
        <Menu mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">
            <Link to="/form">form</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/itable">table</Link>
          </Menu.Item>
        </Menu>
        <Layout.Content style={{ flex: 1, backgroundColor: '#f4f4f4' }}>
          <Switch>
            <Route path="/form">
              <Form />
            </Route>
            <Route path="/itable">
              <Itable />
            </Route>
            <Redirect to="form" />
          </Switch>
        </Layout.Content>
      </Layout>
    </Router>
  </ConfigProvider>,
  document.getElementById('root'),
);
