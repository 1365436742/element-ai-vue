export const configProviderProps = {
  /**
   * @description Controlling if the users want a11y features
   */
  a11y: {
    type: Boolean,
    default: true,
  },
  message: {
    type: String,
    default: '',
  },
  value: {
    type: Object,
    default: () => ({}),
  },
}
