export const colors = {
  background: "#F7F8F5",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  primary: "#15803D",
  primaryPressed: "#166534",
  primarySoft: "#DCFCE7",
  primarySoftPressed: "#BBF7D0",
  primaryText: "#166534",
  error: "#B91C1C",
  errorBackground: "#FEE2E2",
  disabledBackground: "#E5E7EB",
  disabledText: "#6B7280",
  goalkeeperBackground: "#FEF3C7",
  goalkeeperText: "#92400E",
  playerBackground: "#DBEAFE",
  playerText: "#1E40AF",
  monthlyBackground: "#DCFCE7",
  monthlyText: "#166534",
  casualBackground: "#FFEDD5",
  casualText: "#9A3412",
  successBackground: "#DCFCE7",
  successText: "#166534",
  warningBackground: "#FFEDD5",
  warningText: "#9A3412",
  perebaBackground: "#FCE7F3",
  perebaText: "#9D174D",
  amadorBackground: "#E0F2FE",
  amadorText: "#075985",
  semiProfissionalBackground: "#EDE9FE",
  semiProfissionalText: "#5B21B6",
  profissionalBackground: "#FFEDD5",
  profissionalText: "#9A3412",
  neutralBackground: "#F3F4F6",
  neutralText: "#4B5563",
  overlay: "rgba(31,41,55,0.48)",
  white: "#FFFFFF",
  transparent: "transparent",
} as const;

export const teamColors = [
  { strong: "#15803D", soft: "#DCFCE7" },
  { strong: "#1D4ED8", soft: "#DBEAFE" },
  { strong: "#C2410C", soft: "#FFEDD5" },
  { strong: "#6D28D9", soft: "#EDE9FE" },
  { strong: "#BE185D", soft: "#FCE7F3" },
  { strong: "#0F766E", soft: "#CCFBF1" },
] as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  screen: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const dimensions = {
  touchTarget: 48,
  currencyFieldHeight: 52,
  checkboxSize: 24,
  checkboxIcon: 18,
  toggleRowMinimumHeight: 56,
  collapsibleIconDiameter: 36,
  collapsibleIconSize: 20,
  editIconSize: 20,
  presenceRowMinimumHeight: 72,
  optionMinWidth: 150,
  multilineFieldMinHeight: 160,
  avatar: 44,
  heroBall: 128,
  statisticMinWidth: 120,
  financeBlockMinWidth: 140,
  sheetHandleWidth: 40,
  sheetHandleHeight: 4,
} as const;

export const radii = {
  sm: 12,
  checkbox: 6,
  field: 16,
  button: 20,
  card: 24,
  sheet: 28,
  pill: 999,
} as const;

export const typography = {
  sizes: {
    caption: 13,
    body: 16,
    currency: 18,
    button: 16,
    section: 20,
    display: 32,
    title: 28,
    question: 28,
    hero: 64,
  },
  weights: {
    regular: "400",
    medium: "600",
    bold: "700",
  },
  lineHeights: {
    body: 24,
    template: 26,
  },
  families: {
    monospace: "Courier",
  },
} as const;

export const borders = {
  option: 1,
  surface: 1,
  separator: 1,
  highlight: 2,
  dash: 1,
} as const;

export const durations = {
  cardToggle: 220,
} as const;
