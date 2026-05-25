import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { AuthProvider } from '../lib/auth'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const noLayout = ['/login', '/403', '/404'].includes(router.pathname)

  return (
    <AuthProvider>
      {noLayout ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </AuthProvider>
  )
}
