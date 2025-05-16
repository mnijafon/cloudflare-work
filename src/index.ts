/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	DEEPSEEK_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// 处理 OPTIONS 预检请求
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "https://ryuukeihou.chat",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				}
			});
		}

		// 非 POST 请求拒绝
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', {
				status: 405,
				headers: {
					"Access-Control-Allow-Origin": "https://ryuukeihou.chat"
				}
			});
		}

		try {
			// @ts-ignore
			const { prompt } = await request.json();

			const apiResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`
				},
				body: JSON.stringify({
					model: "deepseek-chat",
					messages: [{ role: "user", content: prompt }]
				})
			});

			if (!apiResponse.ok) {
				const errorText = await apiResponse.text();
				return new Response(`AI 请求失败，状态码：${apiResponse.status}\n${errorText}`, {
					status: 500,
					headers: {
						"Content-Type": "text/plain",
						"Access-Control-Allow-Origin": "https://ryuukeihou.chat"
					}
				});
			}

			const data = await apiResponse.json();
			// @ts-ignore
			const content = data.choices?.[0]?.message?.content ?? "AI 没有返回内容";

			return new Response(content, {
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"Access-Control-Allow-Origin": "https://ryuukeihou.chat"
				}
			});
		} catch (err) {
			return new Response("请求解析或处理失败", {
				status: 400,
				headers: {
					"Access-Control-Allow-Origin": "https://ryuukeihou.chat"
				}
			});
		}
	}
} satisfies ExportedHandler<Env>;

