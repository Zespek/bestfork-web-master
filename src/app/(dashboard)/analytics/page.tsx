'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FiDownloadCloud,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiStar,
  FiActivity,
  FiAward,
  FiTag,
  FiUsers,
} from 'react-icons/fi'
import { getAnalyticsSummary, exportAnalyticsReport } from '@/services/analytics.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './analytics.module.css'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatMonthLabel(monthKey: string): string {
  const [, month] = monthKey.split('-').map(Number)

  return MONTH_LABELS[month - 1] ?? monthKey
}

function TrendBadge({ changePercent }: { changePercent: number | null }) {
  if (changePercent === null) {
    return (
      <div className={styles.statTrend} style={{ color: 'var(--color-gray-400)' }}>
        <span>Sem dado do mês anterior</span>
      </div>
    )
  }

  const isUp = changePercent >= 0

  return (
    <div className={`${styles.statTrend} ${isUp ? styles.trendUp : styles.trendDown}`}>
      {isUp ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
      <span>{isUp ? '+' : ''}{changePercent}% vs Mês Anterior</span>
    </div>
  )
}

function InfoBadge({ text }: { text: string }) {
  return (
    <div className={`${styles.statTrend} ${styles.trendUp}`}>
      <FiTrendingUp size={16} />
      <span>{text}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const [exportError, setExportError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: getAnalyticsSummary,
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportAnalyticsReport()
      setExportError(null)
    } catch (error) {
      setExportError(extractErrorMessage(error, 'Não foi possível exportar o relatório. Tente novamente.'))
    } finally {
      setIsExporting(false)
    }
  }

  const maxMonthCount = summary ? Math.max(1, ...summary.reservationsByMonth.map((entry) => entry.count)) : 1

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatórios e Analytics</h1>
          <p className={styles.subtitle}>
            Acompanhe a performance operacional e os níveis de fidelização da rede
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={handleExport} disabled={isExporting}>
            <FiDownloadCloud size={18} />
            <span>{isExporting ? 'Exportando...' : 'Exportar Relatório CSV'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <p style={{ color: 'var(--color-error)', fontSize: 13 }} role="alert">
          {exportError}
        </p>
      )}

      {isLoading && <p style={{ color: 'var(--color-gray-500)' }}>Carregando métricas...</p>}
      {isError && <p style={{ color: 'var(--color-error)' }}>Não foi possível carregar as métricas. Tente novamente.</p>}

      {summary && (
        <>
          <h2 className={styles.sectionTitle}>
            <FiActivity className={styles.sectionIcon} />
            Performance Operacional
          </h2>

          <div className={styles.grid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Reservas no Mês</span>
                <div className={styles.statIconWrapper}>
                  <FiCalendar size={20} />
                </div>
              </div>
              <div className={styles.statValue}>{summary.reservationsThisMonth.count.toLocaleString('pt-BR')}</div>
              <TrendBadge changePercent={summary.reservationsThisMonth.changePercent} />
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Nota Média das Avaliações</span>
                <div className={styles.statIconWrapper}>
                  <FiStar size={20} />
                </div>
              </div>
              <div className={styles.statValue}>
                {summary.averageReviewRating.rating !== null ? summary.averageReviewRating.rating.toFixed(1) : '—'}
              </div>
              <InfoBadge text={`com base em ${summary.averageReviewRating.totalReviews.toLocaleString('pt-BR')} avaliações`} />
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Taxa de Cancelamento</span>
                <div className={styles.statIconWrapper}>
                  <FiActivity size={20} />
                </div>
              </div>
              <div className={styles.statValue}>
                {summary.cancellationRate.rate !== null ? `${summary.cancellationRate.rate}%` : '—'}
              </div>
              <TrendBadge changePercent={summary.cancellationRate.changePercent} />
            </div>

            {/* Gráfico: Reservas por Mês */}
            <div className={styles.chartCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Reservas por Mês</span>
              </div>
              <div className={styles.mockChart}>
                {summary.reservationsByMonth.map((entry) => (
                  <div key={entry.month} className={styles.chartBarContainer}>
                    <div
                      className={styles.chartBar}
                      style={{ height: `${(entry.count / maxMonthCount) * 100}%` }}
                      title={`${entry.count} reserva(s)`}
                    />
                    <span className={styles.chartLabel}>{formatMonthLabel(entry.month)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className={styles.sectionTitle} style={{ marginTop: '40px' }}>
            <FiAward className={styles.sectionIcon} />
            Programa de Fidelidade (Prime)
          </h2>

          <div className={styles.grid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Prêmios Resgatados</span>
                <div className={styles.statIconWrapper}>
                  <FiAward size={20} />
                </div>
              </div>
              <div className={styles.statValue}>{summary.rewardsRedeemed.toLocaleString('pt-BR')}</div>
              <InfoBadge text="no total" />
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Cupons Ativos</span>
                <div className={styles.statIconWrapper}>
                  <FiTag size={20} />
                </div>
              </div>
              <div className={styles.statValue}>{summary.activeCoupons.toLocaleString('pt-BR')}</div>
              <InfoBadge text="cadastrados" />
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Retenção Prime</span>
                <div className={styles.statIconWrapper}>
                  <FiUsers size={20} />
                </div>
              </div>
              <div className={styles.statValue}>
                {summary.primeRetentionRate !== null ? `${summary.primeRetentionRate}%` : '—'}
              </div>
              <InfoBadge text="clientes com 2+ reservas na própria conta" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
