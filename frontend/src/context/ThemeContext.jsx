import { createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { toggleTheme } from '../store/slices/themeSlice';
import tokens from '../assets/tokens';
const ThemeContext = createContext();
export const useThemeMode = () => useContext(ThemeContext);
const buildTheme = mode => createTheme({
  palette: {
    mode,
    primary: { main: mode === 'light' ? tokens.primary : '#72B6FF', light: tokens.primaryLight, dark: tokens.primaryDark, contrastText: '#fff' },
    secondary: { main: mode === 'light' ? tokens.secondary : '#80BFFF' },
    success: { main: mode === 'light' ? tokens.success : '#39D9B1' }, error: { main: tokens.error }, warning: { main: tokens.warning },
    background: { default: mode === 'light' ? tokens.surface : tokens.dark.bg, paper: mode === 'light' ? '#fff' : tokens.dark.paper },
    text: { primary: mode === 'light' ? tokens.secondary : '#ECF4FB', secondary: mode === 'light' ? tokens.muted : tokens.dark.muted },
    divider: mode === 'light' ? tokens.border : tokens.dark.border,
  },
  typography: {
    fontFamily: tokens.fontFamily,
    h1: { fontWeight: 800, letterSpacing: '-.04em' }, h2: { fontWeight: 800, letterSpacing: '-.035em' },
    h3: { fontWeight: 800, letterSpacing: '-.035em' }, h4: { fontWeight: 750, letterSpacing: '-.03em' },
    h5: { fontWeight: 750, letterSpacing: '-.02em' }, h6: { fontWeight: 700, fontSize: '1rem' },
    subtitle1: { fontWeight: 650 }, subtitle2: { fontWeight: 700 },
    body1: { lineHeight: 1.7 }, body2: { lineHeight: 1.65 },
    button: { textTransform: 'none', fontWeight: 650 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundImage: 'none' } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, boxShadow: 'none', transition: 'background .18s ease, transform .18s ease, box-shadow .18s ease', '&:hover': { boxShadow: 'none' }, '&:active': { transform: 'translateY(1px)' } }, containedPrimary: { background: tokens.primary, '&:hover': { background: tokens.primaryDark, boxShadow: tokens.shadow.brand } } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 14, backgroundImage: 'none', boxShadow: mode === 'light' ? tokens.shadow.sm : '0 3px 18px rgba(0,0,0,.12)', border: '1px solid', borderColor: mode === 'light' ? 'rgba(10,37,64,.09)' : tokens.dark.border } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: 14 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, '& .MuiOutlinedInput-notchedOutline': { borderColor: mode === 'light' ? tokens.border : tokens.dark.border }, '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(0,102,255,.1)' } } } },
    MuiTab: { styleOverrides: { root: { fontWeight: 650, textTransform: 'none', fontSize: '.82rem', minHeight: 46 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 2, borderRadius: 2 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 7, fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 9 } } },
    MuiAvatar: { styleOverrides: { root: { fontWeight: 700 } } },
  },
});
export const ThemeProvider = ({ children }) => {
  const { mode } = useSelector(state => state.theme); const dispatch = useDispatch();
  useEffect(() => { localStorage.setItem('theme', mode); document.documentElement.dataset.theme = mode; }, [mode]);
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggleMode: () => dispatch(toggleTheme()) }), [mode, dispatch]);
  return <ThemeContext.Provider value={value}><MuiThemeProvider theme={theme}><CssBaseline />{children}</MuiThemeProvider></ThemeContext.Provider>;
};
