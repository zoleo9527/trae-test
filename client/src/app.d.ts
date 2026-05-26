/// <reference types="@sveltejs/kit" />
declare global {
  namespace App {
    interface Locals {
      token?: string;
      user?: import('./lib/types').User;
    }
  }
}
export { };

