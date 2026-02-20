import Vue, { VNode } from 'vue'

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface IntrinsicElements extends Record<string, any> {}
  }
}
