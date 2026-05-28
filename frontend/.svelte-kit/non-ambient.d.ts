
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
		RouteId(): "/" | "/exceptions" | "/inspections" | "/inspections/new" | "/inventory" | "/inventory/[id]" | "/login" | "/orders" | "/orders/new" | "/orders/[id]" | "/products" | "/products/[id]" | "/reviews";
		RouteParams(): {
			"/inventory/[id]": { id: string };
			"/orders/[id]": { id: string };
			"/products/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/exceptions": Record<string, never>;
			"/inspections": Record<string, never>;
			"/inspections/new": Record<string, never>;
			"/inventory": { id?: string | undefined };
			"/inventory/[id]": { id: string };
			"/login": Record<string, never>;
			"/orders": { id?: string | undefined };
			"/orders/new": Record<string, never>;
			"/orders/[id]": { id: string };
			"/products": { id?: string | undefined };
			"/products/[id]": { id: string };
			"/reviews": Record<string, never>
		};
		Pathname(): "/" | "/exceptions" | "/inspections" | "/inspections/new" | "/inventory" | `/inventory/${string}` & {} | "/login" | "/orders" | "/orders/new" | `/orders/${string}` & {} | "/products" | `/products/${string}` & {} | "/reviews";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}