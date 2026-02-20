declare module 'vuetify/lib' {
  import { PluginObject } from 'vue'
  interface VuetifyOptions {
    theme?: Record<string, unknown>
    [key: string]: unknown
  }
  interface VuetifyConstructor {
    new (opts?: VuetifyOptions): object
    (opts?: VuetifyOptions): object
  }
  const Vuetify: VuetifyConstructor & PluginObject<unknown>
  export default Vuetify
}
