import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Layout, Menu, Space } from 'antd';
import { Route as TableRoute } from './_table';
import { Route as ChartRoute } from './chart';
import styles from './root.module.css';
import React from 'react';
const { Header, Content, Footer } = Layout;

export const Route = createRootRoute({
  component: RootComponent,
});

const queryClient = new QueryClient();

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

function RootComponent() {
  const navigate = Route.useNavigate();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Layout className={styles.layout}>
          <Header className={styles.header}>
            <Menu
              className={styles.menu}
              theme="dark"
              mode="horizontal"
              items={[
                {
                  key: '/',
                  label: 'Tabella',
                  onClick: () => navigate({ to: TableRoute.to }),
                },
                {
                  key: '/chart',
                  label: 'Grafico',
                  onClick: () => navigate({ to: ChartRoute.to }),
                },
              ]}
              defaultSelectedKeys={[window.location.pathname]}
            ></Menu>
          </Header>
          <Content className={styles.content}>
            <Outlet />
          </Content>
          <Footer className={styles.footer}>Aron Winkler per Rapsodoo</Footer>
        </Layout>
        <TanStackRouterDevtools position="bottom-right" />
      </QueryClientProvider>
    </>
  );
}
