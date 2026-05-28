
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
		RouteId(): "/" | "/attendance" | "/campers" | "/dashboard" | "/feedback" | "/medical" | "/rooms" | "/supplies";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/attendance": Record<string, never>;
			"/campers": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/feedback": Record<string, never>;
			"/medical": Record<string, never>;
			"/rooms": Record<string, never>;
			"/supplies": Record<string, never>
		};
		Pathname(): "/" | "/attendance" | "/campers" | "/dashboard" | "/feedback" | "/medical" | "/rooms" | "/supplies";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}