import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#E00C05',
    colorBgBase: '#ffffff',
    colorTextBase: '#0f172a',
    colorTextSecondary: '#475569',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorLink: '#E00C05',
    colorLinkHover: '#b91c1c',
    borderRadius: 12,
    fontFamily: '"Inter", system-ui, sans-serif',
    controlHeight: 42,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.06)',
    fontSize: 14,
    lineHeight: 1.6,
  },
  components: {
    Layout: {
      bodyBg: '#f8fafc',
      headerBg: 'rgba(255, 255, 255, 0.85)',
      siderBg: 'rgba(255, 255, 255, 0.9)',
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#fef2f2',
      itemSelectedColor: '#E00C05',
      itemColor: '#475569',
      itemHoverColor: '#0f172a',
      itemHoverBg: '#f1f5f9',
      subMenuItemBg: 'transparent',
      activeBarBorderWidth: 0,
      iconSize: 18,
      itemMarginInline: 8,
      itemBorderRadius: 10,
    },
    Card: {
      colorBgContainer: '#ffffff',
      colorBorderSecondary: '#e2e8f0',
      borderRadiusLG: 16,
      boxShadowTertiary: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.02)',
      paddingLG: 24,
    },
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#f8fafc',
      headerColor: '#64748b',
      borderColor: '#f1f5f9',
      rowHoverBg: '#fefce8',
      headerBorderRadius: 12,
    },
    Button: {
      fontWeight: 500,
      borderRadius: 10,
      controlHeight: 40,
      defaultBorderColor: '#e2e8f0',
      defaultColor: '#334155',
    },
    Input: {
      borderRadius: 10,
      controlHeight: 42,
      colorBorder: '#e2e8f0',
      activeBorderColor: '#E00C05',
      hoverBorderColor: '#cbd5e1',
    },
    Select: {
      borderRadius: 10,
      controlHeight: 42,
      colorBorder: '#e2e8f0',
    },
    DatePicker: {
      borderRadius: 10,
      controlHeight: 42,
    },
    Tabs: {
      inkBarColor: '#E00C05',
      itemSelectedColor: '#E00C05',
      itemHoverColor: '#0f172a',
      itemColor: '#64748b',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Statistic: {
      titleFontSize: 13,
    },
    Descriptions: {
      labelBg: '#f8fafc',
    },
    Steps: {
      colorPrimary: '#E00C05',
    },
  },
};
