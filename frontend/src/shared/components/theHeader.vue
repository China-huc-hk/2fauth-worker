<template>
  <header class="header">
    <div class="logo">
      <el-button v-if="layoutStore.isMobile && route.meta.requiresAuth" @click="layoutStore.showMobileMenu = true" class="header-menu-btn">
        <el-icon :size="14" class="menu-icon" style="color: var(--el-text-color-primary);">
          <svg viewBox="0 0 16 16" version="1.1" width="100%" height="100%" aria-hidden="true" fill="currentColor">
            <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"></path>
          </svg>
        </el-icon>
      </el-button>
      <a href="#" @click.prevent="goHome" class="header-home-link">
        <el-icon :size="24" color="#409EFC" style="margin-right: 10px;"><Lock /></el-icon>
        <h2>2FAuth Worker</h2>
      </a>
    </div>
    <div class="user-actions">
      <!-- 访客页面（登录/报错）始终显示的通用操作 -->
      <div class="guest-actions" v-if="!route.meta.requiresAuth">
        <el-button circle :icon="themeStore.isDark ? Sunny : Moon" @click="themeStore.toggleTheme" class="header-action-btn" />
        <el-button circle :icon="iconLocales" :title="$i18n.locale === 'zh-CN' ? 'English' : '切换语言'" @click="toggleLanguage" class="header-action-btn" />
      </div>

      <!-- 系统内部页面，仅 PC 端显示用户头像 -->
      <div class="user-profile" v-if="!layoutStore.isMobile && route.meta.requiresAuth">
        <el-avatar 
          :size="32" 
          :src="authUserStore.userInfo?.avatar || ''"
          @error="(e) => true"
        >
          {{ authUserStore.userInfo?.username ? authUserStore.userInfo.username.charAt(0).toUpperCase() : '?' }}
        </el-avatar>
        <span class="username">{{ authUserStore.userInfo?.username || '2FAuth' }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { Lock } from '@element-plus/icons-vue'
import { useLayoutStore } from '@/shared/stores/layoutStore'
import { useAuthUserStore } from '@/features/auth/store/authUserStore'
import { useThemeStore } from '@/shared/stores/themeStore'
import { Sunny, Moon } from '@element-plus/icons-vue'
import iconLocales from '@/shared/components/icons/iconLocales.vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/locales'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()
const authUserStore = useAuthUserStore()
const themeStore = useThemeStore()

const toggleLanguage = () => {
  const targetLang = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  setLanguage(targetLang)
}

const goHome = () => {
  if (route.path === '/') {
    layoutStore.homeTabReset++
  } else {
    router.push('/')
  }
}
</script>\n