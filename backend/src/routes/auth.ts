import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { EnvBindings, AppError } from '../config';
import { generateSecureJWT } from '../utils/crypto';
import { authMiddleware } from '../utils/helper';
import { getOAuthProvider, getAvailableProviders } from '../providers/oauth/index';

const auth = new Hono<{ Bindings: EnvBindings, Variables: { user: any } }>();

// ==========================================
// 0. 获取可用登录方式列表 (新增)
// ==========================================
auth.get('/providers', (c) => {
    const providers = getAvailableProviders(c.env);
    // 注入 Telegram Bot Name 给前端 Widget 使用
    const enhancedProviders = providers.map(p => {
        if (p.id === 'telegram') {
            // 自动移除可能存在的 @ 前缀，防止 Widget 加载失败
            const rawName = c.env.OAUTH_TELEGRAM_BOT_NAME || '';
            return { ...p, botName: rawName.replace(/^@/, '') };
        }
        return p;
    });
    return c.json({ success: true, providers: enhancedProviders });
});

// ==========================================
// 1. 获取授权地址 (支持动态 Provider)
// ==========================================
auth.get('/authorize/:provider', async (c) => {
    const providerName = c.req.param('provider');
    const state = crypto.randomUUID();
    const env = c.env;
    
    try {
        const provider = getOAuthProvider(providerName, env);
        const result = await provider.getAuthorizeUrl(state);
        return c.json({ success: true, authUrl: result.url, state, codeVerifier: result.codeVerifier });
    } catch (e: any) {
        throw new AppError(e.message || 'Provider not supported', 400);
    }
});

// ==========================================
// 2. 核心逻辑：用 Code 换取系统的 JWT 令牌
// ==========================================
auth.post('/callback/:provider', async (c) => {
    const providerName = c.req.param('provider');
    const body = await c.req.json(); // 获取完整 Body
    const env = c.env;

    const provider = getOAuthProvider(providerName, env);

    // 构造参数：Telegram 需要验证所有字段，其他 Provider 只需要 code
    let params: string | URLSearchParams;
    if (providerName === 'telegram') {
        params = new URLSearchParams();
        Object.entries(body).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });
    } else {
        if (!body.code) throw new AppError('Missing OAuth code', 400);
        params = body.code;
    }
    
    const userInfo = await provider.handleCallback(params, body.codeVerifier);

    // 严密的安全校验：基于 Email 或 Username 的白名单 (OAUTH_WHITELIST)
    const allowedUsersStr = env.OAUTH_ALLOWED_USERS || '';
    const allowedIdentities = allowedUsersStr.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);
    
    const userEmail = (userInfo.email || '').toLowerCase();
    const userName = (userInfo.username || '').toLowerCase();

    // 如果白名单不为空，则必须匹配允许的字段 (Email 或 Username)
    if (allowedIdentities.length && env.OAUTH_ALLOWED_USERS !== env.JWT_SECRET) {
        let isAllowed = false;

        // 1. 检查 Email (如果 Provider 允许)
        if (provider.whitelistFields.includes('email') && userEmail && allowedIdentities.includes(userEmail)) {
            isAllowed = true;
        }
        
        // 2. 检查 Username (如果 Provider 允许)
        if (provider.whitelistFields.includes('username') && userName && allowedIdentities.includes(userName)) {
            isAllowed = true;
        }

        if (! isAllowed) {
            throw new AppError(`Unauthorized user. Email: ${userEmail}, Username: ${userName}`, 403);
        }
    }

    // 签发我们系统的专属 JWT 令牌
    const payload = {
        userInfo: {
            id: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            avatar: userInfo.avatar,
            provider: userInfo.provider
        }
    };

    if (!env.JWT_SECRET) {
        throw new AppError('Server configuration error: JWT_SECRET is missing', 500);
    }

    const token = await generateSecureJWT(payload, env.JWT_SECRET);

    // 1. 设置 httpOnly 的鉴权 Cookie (前端无法读取，防 XSS)
    setCookie(c, 'auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60, // 7天
        path: '/',
    });

    // 2. 设置 CSRF Token Cookie (前端可以读取，用于请求头)
    const csrfToken = crypto.randomUUID();
    setCookie(c, 'csrf_token', csrfToken, {
        httpOnly: false, // 允许前端 JS 读取
        secure: true,
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
    });

    return c.json({
        success: true,
        userInfo: payload.userInfo
    });
});

// ==========================================
// 2.5 退出登录 (清除 Cookies)
// ==========================================
auth.post('/logout', (c) => {
    deleteCookie(c, 'auth_token');
    deleteCookie(c, 'csrf_token');
    return c.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ==========================================
// 3. 获取当前用户信息 (前端 Token 变为 httpOnly 后需要此接口)
// ==========================================
auth.get('/me', authMiddleware, (c) => {
    const user = c.get('user');
    // 禁止浏览器缓存此接口，防止登录状态更新不及时
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    return c.json({
        success: true,
        userInfo: user
    });
});

export default auth;