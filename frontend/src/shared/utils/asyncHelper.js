import { defineAsyncComponent, h } from 'vue'
import { ElEmpty, ElButton } from 'element-plus'

/**
 * 增强的异步组件工厂函数
 * 解决 PWA/Cloudflare 环境下分块加载失败导致的白屏问题
 */
export function createAsyncComponent(loader) {
    return defineAsyncComponent({
        loader,
        // 加载中占位
        loadingComponent: {
            render() {
                return h('div', {
                    style: 'display: flex; justify-content: center; align-items: center; min-height: 400px; width: 100%;'
                }, [
                    h('div', {
                        class: 'is-loading',
                        style: 'color: var(--el-color-primary); font-size: 24px;'
                    }, 'Loading...')
                ])
            }
        },
        // 失败占位
        errorComponent: {
            props: ['error'],
            render() {
                return h('div', {
                    style: 'padding: 40px; text-align: center;'
                }, [
                    h(ElEmpty, { description: '组件加载失败，请检查网络连接' }, {
                        default: () => h(ElButton, {
                            type: 'primary',
                            onClick: () => window.location.reload()
                        }, '刷新页面')
                    })
                ])
            }
        },
        // 超时设置
        timeout: 15000,
        // 延迟显示加载组件
        delay: 200,
        // 错误重试逻辑
        onError(error, retry, fail, attempts) {
            if (attempts <= 3) {
                console.warn(`[AsyncComponent] Loading failed, retrying (${attempts}/3)...`, error)
                retry()
            } else {
                fail()
            }
        }
    })
}
