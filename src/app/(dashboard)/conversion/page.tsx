'use client'

import React, { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiDatabase, FiCheckCircle, FiAlertCircle, FiArrowRight, FiUploadCloud } from 'react-icons/fi'
import { BsFileEarmarkExcel } from 'react-icons/bs'
import { ILegacyCustomer } from '@bestfork/shared'
import { getConversionSummary, listPendingCustomers, importLegacyCsv, exportConversionReport } from '@/services/conversion.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './conversion.module.css'

const PER_PAGE = 10

function formatDate(iso: string | null): string {
  if (!iso) return '—'

  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatConsumed(value: number | null): string {
  if (value === null) return '—'

  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default function ConversionPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const [minDaysFilter, setMinDaysFilter] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const minDaysSinceLastVisit = minDaysFilter ? Number(minDaysFilter) : undefined

  const { data: summary } = useQuery({
    queryKey: ['conversion', 'summary'],
    queryFn: getConversionSummary,
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['conversion', 'pending', page, minDaysSinceLastVisit],
    queryFn: () => listPendingCustomers({ page, perPage: PER_PAGE, minDaysSinceLastVisit }),
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => importLegacyCsv(file),
    onSuccess: () => {
      setImportError(null)
      queryClient.invalidateQueries({ queryKey: ['conversion'] })
    },
    onError: (error) => setImportError(extractErrorMessage(error, 'Não foi possível importar a planilha. Tente novamente.')),
  })

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    importMutation.mutate(file)
    // Sem isto, escolher o mesmo arquivo de novo não disparia outro onChange.
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportConversionReport({ minDaysSinceLastVisit })
      setExportError(null)
    } catch (error) {
      setExportError(extractErrorMessage(error, 'Não foi possível exportar o relatório. Tente novamente.'))
    } finally {
      setIsExporting(false)
    }
  }

  const customers = data?.data ?? []
  const meta = data?.meta
  const result = importMutation.data

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Conversão da Base</h1>
          <p className={styles.subtitle}>
            Acompanhe a migração dos clientes do sistema antigo para o novo App BestFork
          </p>
        </div>
        <div className={styles.actions}>
          <label className={styles.buttonSecondary}>
            <FiUploadCloud size={18} />
            <span>{importMutation.isPending ? 'Importando...' : 'Importar Planilha (.csv)'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className={styles.fileInput}
              disabled={importMutation.isPending}
              onChange={handleFileSelected}
            />
          </label>
          <button className={styles.buttonPrimary} onClick={handleExport} disabled={isExporting}>
            <BsFileEarmarkExcel size={18} />
            <span>{isExporting ? 'Exportando...' : 'Exportar Relatório CSV'}</span>
          </button>
        </div>
      </div>

      {importError && (
        <p style={{ color: 'var(--color-error)', fontSize: 13 }} role="alert">
          {importError}
        </p>
      )}
      {exportError && (
        <p style={{ color: 'var(--color-error)', fontSize: 13 }} role="alert">
          {exportError}
        </p>
      )}

      {result && (
        <div className={styles.importResult}>
          Importação concluída: {result.imported} cliente(s) importado(s), {result.duplicates} duplicado(s) ignorado(s)
          {result.errors.length > 0 && `, ${result.errors.length} linha(s) com erro`}.
          {result.errors.length > 0 && (
            <ul className={styles.importErrors}>
              {result.errors.map((err) => (
                <li key={err.line}>Linha {err.line}: {err.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Funil */}
      <div className={styles.funnelGrid}>
        <div className={styles.funnelCard}>
          <div className={styles.funnelIcon}>
            <FiDatabase size={24} />
          </div>
          <span className={styles.funnelLabel}>Total Base Antiga</span>
          <span className={styles.funnelValue}>{(summary?.totalLegacyBase ?? 0).toLocaleString('pt-BR')}</span>
          <FiArrowRight className={styles.funnelArrow} size={40} />
        </div>

        <div className={styles.funnelCard}>
          <div className={styles.funnelIcon} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <FiCheckCircle size={24} />
          </div>
          <span className={styles.funnelLabel}>Baixaram o Novo App</span>
          <span className={styles.funnelValue} style={{ color: '#10b981' }}>
            {(summary?.migratedToNewApp ?? 0).toLocaleString('pt-BR')}
          </span>
          <FiArrowRight className={styles.funnelArrow} size={40} />
        </div>

        <div className={styles.funnelCard}>
          <div className={styles.funnelIcon} style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)' }}>
            <FiAlertCircle size={24} />
          </div>
          <span className={styles.funnelLabel}>Falta Migrar</span>
          <span className={styles.funnelValue} style={{ color: '#dc2626' }}>
            {(summary?.pendingMigration ?? 0).toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Tabela */}
      <div className={styles.card}>
        <div className={styles.filterSection}>
          <span className={styles.tableTitle}>
            <FiAlertCircle /> Clientes Inativos (Aguardando Cadastro)
          </span>
          <select
            className={styles.filterSelect}
            value={minDaysFilter}
            onChange={(e) => {
              setMinDaysFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todo o Período</option>
            <option value="90">Última visita há mais de 90 dias</option>
            <option value="180">Última visita há mais de 180 dias</option>
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Última Visita</th>
                <th style={{ textAlign: 'right' }}>Histórico de Consumo (Antigo)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Carregando clientes...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                    Não foi possível carregar os clientes. Tente novamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && customers.map((user: ILegacyCustomer) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </td>
                  <td>{user.cpf ?? '—'}</td>
                  <td>{user.phone ?? '—'}</td>
                  <td>{formatDate(user.legacyLastVisitAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={styles.consumeHistory}>{formatConsumed(user.legacyConsumedTotal)}</span>
                  </td>
                </tr>
              ))}

              {!isLoading && !isError && customers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Nenhum cliente pendente de migração.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.lastPage > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {meta.page} de {meta.lastPage} ({meta.total} clientes)
            </span>
            <button className={styles.paginationButton} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <button
              className={styles.paginationButton}
              disabled={page >= meta.lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
