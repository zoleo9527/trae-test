
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  BaseModal: typeof import("../../components/common/BaseModal.vue")['default']
  ConfirmModal: typeof import("../../components/common/ConfirmModal.vue")['default']
  EmptyState: typeof import("../../components/common/EmptyState.vue")['default']
  ErrorState: typeof import("../../components/common/ErrorState.vue")['default']
  LoadingState: typeof import("../../components/common/LoadingState.vue")['default']
  PriorityBadge: typeof import("../../components/common/PriorityBadge.vue")['default']
  RoleSwitcher: typeof import("../../components/common/RoleSwitcher.vue")['default']
  StatusBadge: typeof import("../../components/common/StatusBadge.vue")['default']
  StatCard: typeof import("../../components/dashboard/StatCard.vue")['default']
  TaskList: typeof import("../../components/dashboard/TaskList.vue")['default']
  AppHeader: typeof import("../../components/layout/AppHeader.vue")['default']
  CreateWorkOrderModal: typeof import("../../components/workorder/CreateWorkOrderModal.vue")['default']
  InspectModal: typeof import("../../components/workorder/InspectModal.vue")['default']
  PartLockModal: typeof import("../../components/workorder/PartLockModal.vue")['default']
  ProgressModal: typeof import("../../components/workorder/ProgressModal.vue")['default']
  QuoteModal: typeof import("../../components/workorder/QuoteModal.vue")['default']
  SatisfactionModal: typeof import("../../components/workorder/SatisfactionModal.vue")['default']
  Timeline: typeof import("../../components/workorder/Timeline.vue")['default']
  WorkOrderDetail: typeof import("../../components/workorder/WorkOrderDetail.vue")['default']
  WorkOrderFilter: typeof import("../../components/workorder/WorkOrderFilter.vue")['default']
  WorkOrderList: typeof import("../../components/workorder/WorkOrderList.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyBaseModal: LazyComponent<typeof import("../../components/common/BaseModal.vue")['default']>
  LazyConfirmModal: LazyComponent<typeof import("../../components/common/ConfirmModal.vue")['default']>
  LazyEmptyState: LazyComponent<typeof import("../../components/common/EmptyState.vue")['default']>
  LazyErrorState: LazyComponent<typeof import("../../components/common/ErrorState.vue")['default']>
  LazyLoadingState: LazyComponent<typeof import("../../components/common/LoadingState.vue")['default']>
  LazyPriorityBadge: LazyComponent<typeof import("../../components/common/PriorityBadge.vue")['default']>
  LazyRoleSwitcher: LazyComponent<typeof import("../../components/common/RoleSwitcher.vue")['default']>
  LazyStatusBadge: LazyComponent<typeof import("../../components/common/StatusBadge.vue")['default']>
  LazyStatCard: LazyComponent<typeof import("../../components/dashboard/StatCard.vue")['default']>
  LazyTaskList: LazyComponent<typeof import("../../components/dashboard/TaskList.vue")['default']>
  LazyAppHeader: LazyComponent<typeof import("../../components/layout/AppHeader.vue")['default']>
  LazyCreateWorkOrderModal: LazyComponent<typeof import("../../components/workorder/CreateWorkOrderModal.vue")['default']>
  LazyInspectModal: LazyComponent<typeof import("../../components/workorder/InspectModal.vue")['default']>
  LazyPartLockModal: LazyComponent<typeof import("../../components/workorder/PartLockModal.vue")['default']>
  LazyProgressModal: LazyComponent<typeof import("../../components/workorder/ProgressModal.vue")['default']>
  LazyQuoteModal: LazyComponent<typeof import("../../components/workorder/QuoteModal.vue")['default']>
  LazySatisfactionModal: LazyComponent<typeof import("../../components/workorder/SatisfactionModal.vue")['default']>
  LazyTimeline: LazyComponent<typeof import("../../components/workorder/Timeline.vue")['default']>
  LazyWorkOrderDetail: LazyComponent<typeof import("../../components/workorder/WorkOrderDetail.vue")['default']>
  LazyWorkOrderFilter: LazyComponent<typeof import("../../components/workorder/WorkOrderFilter.vue")['default']>
  LazyWorkOrderList: LazyComponent<typeof import("../../components/workorder/WorkOrderList.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
