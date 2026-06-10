import {
  DashboardOutlined,
  EnvironmentOutlined,
  FormOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Button, Layout, Menu, Space, Typography, theme } from 'antd'
import type { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { useState } from 'react'

const { Header, Sider, Content } = Layout

export const RootLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const menuItems: ItemType<MenuItemType>[] = [
    {
      key: '/',
      label: <Link to="/">Dashboard</Link>,
      icon: <DashboardOutlined />,
    },
    {
      key: '/operations',
      label: <Link to="/operations">Operations</Link>,
      icon: <FormOutlined />,
    },
  ]

  return (
    <Layout className="admin-shell">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="brand">{collapsed ? <DashboardOutlined /> : 'Admin Panel'}</div>
        <Menu theme="dark" mode="inline" selectedKeys={[pathname]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="admin-header" style={{ background: colorBgContainer }}>
          <Button
            type="text"
            aria-label="Toggle navigation"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="nav-toggle"
          />
          <Space size={10}>
            <EnvironmentOutlined />
            <Typography.Text strong>Initial Admin Stack</Typography.Text>
          </Space>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
