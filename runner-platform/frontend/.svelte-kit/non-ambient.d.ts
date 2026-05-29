
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
		RouteId(): "/" | "/appeals" | "/appeals/new" | "/login" | "/logout" | "/orders" | "/subsidies";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/appeals": Record<string, never>;
			"/appeals/new": Record<string, never>;
			"/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/orders": Record<string, never>;
			"/subsidies": Record<string, never>
		};
		Pathname(): "/" | "/appeals" | "/appeals/" | "/appeals/new" | "/appeals/new/" | "/login" | "/login/" | "/logout" | "/logout/" | "/orders" | "/orders/" | "/subsidies" | "/subsidies/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}