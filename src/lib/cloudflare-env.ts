import { getCloudflareContext } from "@opennextjs/cloudflare";

export type AppEnv = CloudflareEnv & {
	SESSION_SECRET?: string;
};

export async function getAppEnv(): Promise<AppEnv> {
	const { env } = await getCloudflareContext({ async: true });
	return env as AppEnv;
}
