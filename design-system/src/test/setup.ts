import '@testing-library/jest-dom';

// jsdom does not implement Element.prototype.scrollIntoView (it does no layout),
// but SearchField, Combobox and TimePicker call it to keep the active option
// visible during keyboard navigation. Stub it as a no-op so those code paths
// run. Guarded so the Storybook browser project keeps the real implementation.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
