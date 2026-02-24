import { createRouter, createWebHistory } from 'vue-router'
import { userState } from '../states/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true } // 需要登录才能访问
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/oauth/callback', // 匹配 GitHub 回调的路径
    name: 'OAuthCallback',
    component: () => import('../views/OAuthCallback.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：拦截未登录用户的访问
router.beforeEach(async (to, from, next) => {
  // 1. 检查内存中是否有用户信息 (乐观检查)
  let isAuthenticated = !!(userState.userInfo && userState.userInfo.id)
  
  // 2. 如果内存无状态且目标页需要登录，尝试通过 Cookie 恢复会话 (例如刷新页面后)
  if (!isAuthenticated && to.meta.requiresAuth) {
    isAuthenticated = await userState.fetchUserInfo()
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router