
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/inspector" | "/inspector/rect" | "/inspector/trace" | "/manager" | "/manager/followup" | "/manager/projects" | "/manager/schedule" | "/manager/trace" | "/scheduler" | "/scheduler/material" | "/scheduler/projects" | "/worker" | "/worker/checkin" | "/worker/material" | "/worker/rect";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/inspector": Record<string, never>;
			"/inspector/rect": Record<string, never>;
			"/inspector/trace": Record<string, never>;
			"/manager": Record<string, never>;
			"/manager/followup": Record<string, never>;
			"/manager/projects": Record<string, never>;
			"/manager/schedule": Record<string, never>;
			"/manager/trace": Record<string, never>;
			"/scheduler": Record<string, never>;
			"/scheduler/material": Record<string, never>;
			"/scheduler/projects": Record<string, never>;
			"/worker": Record<string, never>;
			"/worker/checkin": Record<string, never>;
			"/worker/material": Record<string, never>;
			"/worker/rect": Record<string, never>
		};
		Pathname(): "/" | "/inspector" | "/inspector/rect" | "/inspector/trace" | "/manager" | "/manager/followup" | "/manager/projects" | "/manager/schedule" | "/manager/trace" | "/scheduler" | "/scheduler/material" | "/scheduler/projects" | "/worker" | "/worker/checkin" | "/worker/material" | "/worker/rect";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}