import { EnvBindings, AppError } from '../../config';
import { BaseOAuthProvider } from './BaseOAuthProvider';
import { GitHubProvider } from './GitHubProvider';
import { CloudflareAccessProvider } from './CloudflareAccessProvider';
import { NodeLocProvider } from './NodeLocProvider';
import { GiteeProvider } from './GiteeProvider';
import { TelegramProvider } from './TelegramProvider';

export function getOAuthProvider(providerId: string, env: EnvBindings): BaseOAuthProvider {
    switch (providerId.toLowerCase()) {
        case 'github':
            return new GitHubProvider(env);
        case 'gitee':
            return new GiteeProvider(env);
        case 'cloudflare':
            return new CloudflareAccessProvider(env);
        case 'nodeloc':
            return new NodeLocProvider(env);
        case 'telegram':
            return new TelegramProvider(env);
        default:
            throw new AppError(`Provider '${providerId}' is not supported`, 400);
    }
}

export function getAvailableProviders(env: EnvBindings) {
    const providers = [];
    
    const githubProvider = new GitHubProvider(env);
    const cloudflareProvider = new CloudflareAccessProvider(env);
    const nodelocProvider = new NodeLocProvider(env);
    const giteeProvider = new GiteeProvider(env);
    const telegramProvider = new TelegramProvider(env);

    if (env.OAUTH_GITHUB_CLIENT_ID && env.OAUTH_GITHUB_CLIENT_SECRET) {
        providers.push({
            id: githubProvider.id,
            name: githubProvider.name,
            icon: githubProvider.icon,
            color: githubProvider.color
        });
    }

    if (env.OAUTH_TELEGRAM_BOT_TOKEN && env.OAUTH_TELEGRAM_BOT_NAME) {
        providers.push({
            id: telegramProvider.id,
            name: telegramProvider.name,
            icon: telegramProvider.icon,
            color: telegramProvider.color,
        });
    }

    if (env.OAUTH_CLOUDFLARE_CLIENT_ID && env.OAUTH_CLOUDFLARE_CLIENT_SECRET) {
        providers.push({
            id: cloudflareProvider.id,
            name: cloudflareProvider.name,
            icon: cloudflareProvider.icon,
            color: cloudflareProvider.color,
        });
    }

    if (env.OAUTH_GITEE_CLIENT_ID && env.OAUTH_GITEE_CLIENT_SECRET) {
        providers.push({
            id: giteeProvider.id,
            name: giteeProvider.name,
            icon: giteeProvider.icon,
            color: giteeProvider.color,
        });
    }

    if (env.OAUTH_NODELOC_CLIENT_ID && env.OAUTH_NODELOC_CLIENT_SECRET) {
        providers.push({
            id: nodelocProvider.id,
            name: nodelocProvider.name,
            icon: nodelocProvider.icon,
            color: nodelocProvider.color,
        });
    }

    return providers;
}