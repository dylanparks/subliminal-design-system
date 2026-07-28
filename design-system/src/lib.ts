// Public library entry point. Distinct from src/index.tsx, which is the CRA demo app entry and
// is not part of the published package (see the "files" field in package.json).
//
// Consumers also need:
//   import 'subliminal-design-system/tokens.css';       — CSS variables (light + dark via .dark)
//   import 'subliminal-design-system/typography.css';   — sds-text--{category}-{size} utility classes
//   import 'subliminal-design-system/style.css';        — component styles (all .sds-* class rules)

// ─── Actions ────────────────────────────────────────────────────────────────
export * from './components/Actions/Button/Button';
export * from './components/Actions/ButtonGroup/ButtonGroup';
export * from './components/Actions/Stepper/Stepper';

// ─── Fields ─────────────────────────────────────────────────────────────────
export * from './components/Fields/Combobox/Combobox';
export * from './components/Fields/DatePicker/DatePicker';
export * from './components/Fields/FileUpload/FileUpload';
export * from './components/Fields/FileUpload/FileUploadItem';
export * from './components/Fields/FileUpload/FileUpload.types';
export * from './components/Fields/PasswordField/PasswordField';
export * from './components/Fields/PhoneField/PhoneField';
export * from './components/Fields/SearchField/SearchField';
export * from './components/Fields/SelectField/SelectField';
export * from './components/Fields/TextArea/TextArea';
export * from './components/Fields/TextField/TextField';
export * from './components/Fields/TimePicker/TimePicker';

// ─── Inputs ─────────────────────────────────────────────────────────────────
export * from './components/Inputs/Checkbox/Checkbox';
export * from './components/Inputs/Checkbox/CheckboxGroup';
export * from './components/Inputs/InputIndicators/CheckboxIndicator';
export * from './components/Inputs/InputIndicators/RadioIndicator';
export * from './components/Inputs/InputIndicators/ToggleIndicator';
export * from './components/Inputs/Radio/Radio';
export * from './components/Inputs/Radio/RadioGroup';
export * from './components/Inputs/RatingInput/RatingInput';
export * from './components/Inputs/Slider/Slider';
export * from './components/Inputs/Toggle/Toggle';

// ─── Navigation ─────────────────────────────────────────────────────────────
export * from './components/Navigation/Breadcrumbs/Breadcrumbs';
export * from './components/Navigation/Menu/Menu';
export * from './components/Navigation/Pagination/Pagination';
export * from './components/Navigation/Tabs/Tabs';

// ─── DataDisplay ────────────────────────────────────────────────────────────
export * from './components/DataDisplay/Avatar/Avatar';
export * from './components/DataDisplay/ProgressBar/ProgressBar';
export * from './components/DataDisplay/ProgressCircle/ProgressCircle';
export * from './components/DataDisplay/Tag/Tag';

// ─── Surfaces ───────────────────────────────────────────────────────────────
export * from './components/Surfaces/Accordion/Accordion';
export * from './components/Surfaces/Modal/Modal';
export * from './components/Surfaces/Notification/Notification';
export * from './components/Surfaces/Popover/Popover';
export * from './components/Surfaces/Toast/Toast';

// ─── Enhancers ──────────────────────────────────────────────────────────────
export * from './components/Enhancers/Divider/Divider';
export * from './components/Enhancers/StatusLight/StatusLight';
export * from './components/Enhancers/Tooltip/Tooltip';

// ─── Theme ──────────────────────────────────────────────────────────────────
export * from './theme';

// ─── Utilities ──────────────────────────────────────────────────────────────
export * from './utilities';

// ─── Tokens (typed TS constants — CSS files are separate subpath exports) ───
export * from './tokens/generated/tokens';
