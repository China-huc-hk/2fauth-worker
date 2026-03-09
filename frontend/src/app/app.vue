<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Warning } from '@element-plus/icons-vue'
import TheHeader from '@/shared/components/theHeader.vue'
import TheFooter from '@/shared/components/theFooter.vue'
import { useLayoutStore } from '@/shared/stores/layoutStore'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const { locale } = useI18n()
const elementLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCn : en
})

const route = useRoute()
const layoutStore = useLayoutStore()

// 移动端菜单打开时锁定背景滚动
watch(() => layoutStore.showMobileMenu, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const checkMobile = () => {
  layoutStore.isMobile = window.innerWidth < 768
}

const userClosedOfflineBanner = ref(false)
const showOfflineBanner = computed(() => layoutStore.isOffline && !userClosedOfflineBanner.value)

watch(() => layoutStore.isOffline, (offline) => {
  if (offline) {
    userClosedOfflineBanner.value = false
  }
})

onMounted(() => {
  checkMobile()
  layoutStore.initNetworkStatus()
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <div class="app-container">
      <!-- 方案A: 全局离线横幅 -->
      <el-alert
        v-if="showOfflineBanner"
        :title="$t('common.offline_mode')"
        type="warning"
        show-icon
        center
        closable
        class="global-offline-banner"
        @close="userClosedOfflineBanner = true"
      />

    <!-- 登录页通常不显示头部，可以通过路由 meta 控制，这里简单示例默认显示 -->
    <TheHeader v-if="!route.meta.hideHeader" />
    
    <main>
      <RouterView />
    </main>
      <TheFooter />
    </div>
  </el-config-provider>
</template>
