'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  FiHome, FiUsers, FiLock, FiStar, FiCalendar, 
  FiMessageSquare, FiBell, FiLink2, FiBarChart2, 
  FiDownloadCloud, FiAward, FiLogOut, FiFileText,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { MdOutlineRestaurantMenu } from 'react-icons/md'
import { BiUserVoice } from 'react-icons/bi'
import { useAuthStore } from '@/stores/auth.store'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Grupos mapeados do escopo do Master
  const navGroups = [
    {
      title: 'Cadastros e Permissões',
      items: [
        { label: 'Usuários do Master', path: '/users', icon: FiUsers },
        { label: 'Níveis de Permissão', path: '/permissions', icon: FiLock },
        { label: 'Casas', path: '/restaurants', icon: MdOutlineRestaurantMenu },
      ]
    },
    {
      title: 'Operação',
      items: [
        { label: 'Gestão de Clientes', path: '/customers', icon: BiUserVoice },
        { label: 'Reservas', path: '/reservations', icon: FiCalendar },
        { label: 'Eventos', path: '/events', icon: FiStar },
        { label: 'Avaliações', path: '/reviews', icon: FiMessageSquare },
      ]
    },
    {
      title: 'Fidelidade & Benefícios',
      items: [
        { label: 'Premiação & Pontos', path: '/loyalty', icon: FiAward },
        { label: 'Resgate de Pontos', path: '/rewards', icon: FiStar },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { label: 'Notificações Push', path: '/notifications', icon: FiBell },
      ]
    },
    {
      title: 'Inteligência',
      items: [
        { label: 'Relatórios & Analytics', path: '/analytics', icon: FiBarChart2 },
        { label: 'Conversão Base Antiga', path: '/conversion', icon: FiDownloadCloud },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { label: 'Redirecionamentos', path: '/redirects', icon: FiLink2 },
        { label: 'Termos de Uso', path: '/terms', icon: FiFileText },
      ]
    }
  ]

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Botão Flutuante de Toggle */}
      <button 
        className={styles.toggleButton}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
      </button>

      {/* Logo */}
      <div className={styles.logoContainer}>
        {!isCollapsed && (
          <img 
            src="/BFprime_ver.svg" 
            alt="BestFork Master" 
            className={styles.logo} 
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>

      {/* Menu Principal */}
      <div className={styles.navScroll}>
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h4 className={styles.categoryTitle}>{group.title}</h4>
            {group.items.map((item, itemIdx) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.path)

              return (
                <Link 
                  key={itemIdx} 
                  href={item.path}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  <Icon className={styles.icon} />
                  <span className={styles.linkLabel}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className={styles.logoutSection}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <FiLogOut className={styles.icon} />
          <span>Sair do Painel</span>
        </button>
      </div>
    </aside>
  )
}
