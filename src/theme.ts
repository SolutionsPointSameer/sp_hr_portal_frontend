import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#E00C05', // Brand Red
    colorBgBase: '#ffffff',
    colorTextBase: '#0f172a', // slate-900
    colorTextSecondary: '#475569', // slate-600
    colorBorder: '#cbd5e1', // slate-300
    colorBorderSecondary: '#e2e8f0', // slate-200
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorLink: '#E00C05',
    colorLinkHover: '#dc2626',
    borderRadius: 8,
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
  },
  components: {
    Layout: {
      bodyBg: '#f8fafc', // slate-50
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBg: '#ffffff',
      itemSelectedBg: '#fee2e2', // red-100
      itemSelectedColor: '#E00C05',
      itemColor: '#475569',
      itemHoverColor: '#0f172a',
    },
    Card: {
      colorBgContainer: '#ffffff',
      colorBorderSecondary: '#e2e8f0',
    },
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#f1f5f9', // slate-100
      borderColor: '#e2e8f0',
      rowHoverBg: '#f8fafc',
      headerColor: '#475569',
    },
  },
};
