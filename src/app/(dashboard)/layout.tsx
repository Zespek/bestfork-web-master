'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@bestfork/shared'
import { useAuthStore } from '@/stores/auth.store'
import Sidebar from '@/components/layout/Sidebar'
import styles from './dashboard.module.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, loadSession } = useAuthStore()

  useEffect(() => {
    loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda uma única vez no boot do dashboard
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return <div className={styles.authLoading}>Carregando...</div>
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        {/* Topbar / Header */}
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            BestFork Master / Painel de Controle
          </div>

          <div className={styles.userProfile}>
            <div style={{ textAlign: 'right' }}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userRole}>{user ? ROLE_LABELS[user.role] : ''}</div>
            </div>
            <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className={styles.pageContainer}>
          {children}
        </div>
      </main>
    </div>
  )
}
