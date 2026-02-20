<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'CrmLogo',
  props: {
    width: { type: [Number, String], default: 120 },
    height: { type: [Number, String], default: 40 }
  },
  data() {
    return {
      gradientId: `crmLogoGradient-${Math.random().toString(36).slice(2, 11)}`
    }
  }
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="CRM"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" class="[stop-color:#1976D2]" />
        <stop offset="100%" class="[stop-color:#42A5F5]" />
      </linearGradient>
    </defs>
    <text
      x="50%"
      y="50%"
      dominant-baseline="central"
      text-anchor="middle"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="28"
      font-weight="700"
      fill="none"
      :stroke="`url(#${gradientId})`"
      stroke-width="1.5"
      paint-order="stroke"
    >
      CRM
    </text>
  </svg>
</template>
