<template>
  <div class="callback-container">
    <el-card class="loading-card" shadow="hover">
      <el-result
        v-if="!errorMsg"
        icon="info"
        title="正在安全登录中"
        sub-title="请稍候，系统正在与 GitHub 交换安全凭证..."
      >
        <template #extra>
          <el-icon class="is-loading" :size="40" color="#409eff"><Loading /></el-icon>
        </template>
      </el-result>

      <el-result
        v-else
        icon="error"
        title="授权失败"
        :sub-title="errorMsg"
      >
        <template #extra>
          <el-button type="primary" @click="goBackToLogin">返回登录页</el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { userState } from '../states/user'

const route = useRoute()
const router = useRouter()
const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state
  const error = route.query.error

  if (error) {
    errorMsg.value = route.query.error_description || '您拒绝了 GitHub 的授权请求'
    return
  }

  if (!code || !state) {
    errorMsg.value = 'URL 缺少必要的授权凭证参数'
    return
  }

  // 🛡️ 前端 State 校验：防止 CSRF 攻击
  const savedState = localStorage.getItem('oauth_state')
  if (!savedState || savedState !== state) {
    errorMsg.value = '安全警告：State 校验失败，请求可能被篡改'
    return
  }
  localStorage.removeItem('oauth_state') // 校验通过后立即清除，防止重放

  try {
    // 关键步骤：把 code 发给后端换取我们自己的 JWT
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state })
    })

    const data = await response.json()

    if (data.success) {
      // 登录成功！Token 已写入 httpOnly Cookie
      // 立即调用接口确认会话有效性，并更新用户信息
      await userState.fetchUserInfo()
      
      // 一把推开大门，进入主界面
      router.push('/')
    } else {
      errorMsg.value = data.error || '登录验证被后端拒绝'
    }
  } catch (err) {
    console.error('OAuth Callback Error:', err)
    errorMsg.value = '网络请求异常，请稍后再试'
  }
})

const goBackToLogin = () => {
  router.push('/login')
}
</script>