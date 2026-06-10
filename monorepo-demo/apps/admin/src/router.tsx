import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from './layouts/root-layout'
import { DashboardPage } from './views/dashboard'
import Opterations from './views/operations'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const operationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations',
  component: Opterations,
})

const routeTree = rootRoute.addChildren([indexRoute, operationsRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
