
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


export const BaseModal: typeof import("../components/common/BaseModal.vue")['default']
export const ConfirmModal: typeof import("../components/common/ConfirmModal.vue")['default']
export const EmptyState: typeof import("../components/common/EmptyState.vue")['default']
export const ErrorState: typeof import("../components/common/ErrorState.vue")['default']
export const LoadingState: typeof import("../components/common/LoadingState.vue")['default']
export const PriorityBadge: typeof import("../components/common/PriorityBadge.vue")['default']
export const RoleSwitcher: typeof import("../components/common/RoleSwitcher.vue")['default']
export const StatusBadge: typeof import("../components/common/StatusBadge.vue")['default']
export const StatCard: typeof import("../components/dashboard/StatCard.vue")['default']
export const TaskList: typeof import("../components/dashboard/TaskList.vue")['default']
export const AppHeader: typeof import("../components/layout/AppHeader.vue")['default']
export const CreateWorkOrderModal: typeof import("../components/workorder/CreateWorkOrderModal.vue")['default']
export const InspectModal: typeof import("../components/workorder/InspectModal.vue")['default']
export const PartLockModal: typeof import("../components/workorder/PartLockModal.vue")['default']
export const ProgressModal: typeof import("../components/workorder/ProgressModal.vue")['default']
export const QuoteModal: typeof import("../components/workorder/QuoteModal.vue")['default']
export const SatisfactionModal: typeof import("../components/workorder/SatisfactionModal.vue")['default']
export const Timeline: typeof import("../components/workorder/Timeline.vue")['default']
export const WorkOrderDetail: typeof import("../components/workorder/WorkOrderDetail.vue")['default']
export const WorkOrderFilter: typeof import("../components/workorder/WorkOrderFilter.vue")['default']
export const WorkOrderList: typeof import("../components/workorder/WorkOrderList.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyBaseModal: LazyComponent<typeof import("../components/common/BaseModal.vue")['default']>
export const LazyConfirmModal: LazyComponent<typeof import("../components/common/ConfirmModal.vue")['default']>
export const LazyEmptyState: LazyComponent<typeof import("../components/common/EmptyState.vue")['default']>
export const LazyErrorState: LazyComponent<typeof import("../components/common/ErrorState.vue")['default']>
export const LazyLoadingState: LazyComponent<typeof import("../components/common/LoadingState.vue")['default']>
export const LazyPriorityBadge: LazyComponent<typeof import("../components/common/PriorityBadge.vue")['default']>
export const LazyRoleSwitcher: LazyComponent<typeof import("../components/common/RoleSwitcher.vue")['default']>
export const LazyStatusBadge: LazyComponent<typeof import("../components/common/StatusBadge.vue")['default']>
export const LazyStatCard: LazyComponent<typeof import("../components/dashboard/StatCard.vue")['default']>
export const LazyTaskList: LazyComponent<typeof import("../components/dashboard/TaskList.vue")['default']>
export const LazyAppHeader: LazyComponent<typeof import("../components/layout/AppHeader.vue")['default']>
export const LazyCreateWorkOrderModal: LazyComponent<typeof import("../components/workorder/CreateWorkOrderModal.vue")['default']>
export const LazyInspectModal: LazyComponent<typeof import("../components/workorder/InspectModal.vue")['default']>
export const LazyPartLockModal: LazyComponent<typeof import("../components/workorder/PartLockModal.vue")['default']>
export const LazyProgressModal: LazyComponent<typeof import("../components/workorder/ProgressModal.vue")['default']>
export const LazyQuoteModal: LazyComponent<typeof import("../components/workorder/QuoteModal.vue")['default']>
export const LazySatisfactionModal: LazyComponent<typeof import("../components/workorder/SatisfactionModal.vue")['default']>
export const LazyTimeline: LazyComponent<typeof import("../components/workorder/Timeline.vue")['default']>
export const LazyWorkOrderDetail: LazyComponent<typeof import("../components/workorder/WorkOrderDetail.vue")['default']>
export const LazyWorkOrderFilter: LazyComponent<typeof import("../components/workorder/WorkOrderFilter.vue")['default']>
export const LazyWorkOrderList: LazyComponent<typeof import("../components/workorder/WorkOrderList.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
