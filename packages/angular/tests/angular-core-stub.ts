/**
 * Stub for `@angular/core` used by the Vitest smoke tests.
 *
 * The real `@angular/core` requires the Angular runtime bootstrap
 * (`platform-browser-dynamic`, Zone.js, the compiler), which is heavy
 * for a unit test that just verifies the module's side-effect-import
 * surface. The stub provides the bare minimum: an `NgModule` decorator
 * that's a no-op identity function, mirroring the runtime behaviour
 * for an `@NgModule({})` empty-metadata case.
 */
export function NgModule(_metadata: unknown): ClassDecorator {
  return (target) => target
}
