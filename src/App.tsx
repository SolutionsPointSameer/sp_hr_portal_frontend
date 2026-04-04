import { ConfigProvider, App as AntdApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { appTheme } from './theme';
import { Suspense } from 'react';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={appTheme}>
        <AntdApp>
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
              <img src="/assets/LOGO.png" alt="Loading..." className="h-16 animate-pulse" />
            </div>
          }>
            <RouterProvider router={router} />
          </Suspense>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
