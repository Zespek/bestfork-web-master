'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiAward, FiTag, FiTrendingUp, FiX, FiSave } from 'react-icons/fi'
import { LoyaltyTier } from '@bestfork/shared'
import {
  listCoupons,
  updateCoupon,
  getTierRules,
  updateTierRules,
  getLoyaltySettings,
  updateLoyaltySettings,
} from '@/services/loyalty.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './loyalty.module.css'

const PER_PAGE = 10
const TIER_ORDER = [LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD]
const TIER_LABELS: Record<LoyaltyTier, string> = { BRONZE: 'Bronze', SILVER: 'Prata', GOLD: 'Ouro' }

type TierInputs = Record<string, { minPoints: string; maxPoints: string }>

export default function LoyaltyPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [tierInputs, setTierInputs] = useState<TierInputs>({})
  const [tierError, setTierError] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [ruleInput, setRuleInput] = useState('1')
  const [ruleError, setRuleError] = useState<string | null>(null)

  // Mesmo debounce já usado nas outras listas.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const { data: tierRules } = useQuery({ queryKey: ['loyalty', 'tier-rules'], queryFn: getTierRules })
  const { data: settings } = useQuery({ queryKey: ['loyalty', 'settings'], queryFn: getLoyaltySettings })

  const { data: couponsData, isLoading, isError } = useQuery({
    queryKey: ['loyalty', 'coupons', debouncedSearch, page],
    queryFn: () => listCoupons({ search: debouncedSearch || undefined, page, perPage: PER_PAGE }),
  })

  // `useState` local nunca sabe esperar uma promise — preenche assim que os dados chegam, sem passar por um effect.
  const [syncedTierRules, setSyncedTierRules] = useState(tierRules)
  if (tierRules !== syncedTierRules) {
    setSyncedTierRules(tierRules)
    if (tierRules) {
      const next: TierInputs = {}
      tierRules.forEach((rule) => {
        next[rule.tier] = {
          minPoints: String(rule.minPoints),
          maxPoints: rule.maxPoints === null ? '' : String(rule.maxPoints),
        }
      })
      setTierInputs(next)
    }
  }

  const toggleCouponMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateCoupon(id, { isActive }),
    onSuccess: () => {
      setCouponError(null)
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'coupons'] })
    },
    onError: (error) => setCouponError(extractErrorMessage(error, 'Não foi possível atualizar o cupom. Tente novamente.')),
  })

  const saveTiersMutation = useMutation({
    mutationFn: () => {
      const rules = TIER_ORDER.map((tier) => ({
        tier,
        minPoints: Number(tierInputs[tier]?.minPoints || 0),
        maxPoints: tierInputs[tier]?.maxPoints ? Number(tierInputs[tier].maxPoints) : null,
      }))
      return updateTierRules(rules)
    },
    onSuccess: () => {
      setTierError(null)
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'tier-rules'] })
    },
    onError: (error) => setTierError(extractErrorMessage(error, 'Não foi possível salvar as faixas de pontos. Tente novamente.')),
  })

  const saveRuleMutation = useMutation({
    mutationFn: () => updateLoyaltySettings({ pointsPerCurrencyUnit: Number(ruleInput) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'settings'] })
      setIsRuleModalOpen(false)
    },
    onError: (error) => setRuleError(extractErrorMessage(error, 'Não foi possível atualizar a regra. Tente novamente.')),
  })

  function updateTierInput(tier: LoyaltyTier, field: 'minPoints' | 'maxPoints', value: string) {
    setTierInputs((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }))
  }

  function openRuleModal() {
    setRuleInput(settings ? String(settings.pointsPerCurrencyUnit) : '1')
    setRuleError(null)
    setIsRuleModalOpen(true)
  }

  const coupons = couponsData?.data ?? []
  const meta = couponsData?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Premiação & Pontos</h1>
          <p className={styles.subtitle}>
            Gestão de fidelidade, premiações e gamificação do aplicativo
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/loyalty/new" className={styles.buttonPrimary}>
            <FiPlus size={18} />
            <span>Nova Premiação</span>
          </Link>
        </div>
      </div>

      {/* Gamification Settings */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FiTrendingUp /> Regras de Gamificação (Níveis)</h2>
        <div className={styles.card}>
          <div className={styles.rulesSection}>
            <FiAward size={24} color="var(--color-gold)" />
            <span className={styles.ruleText}>
              Regra de Pontos Base:{' '}
              <strong style={{ color: 'var(--color-gold-dark)' }}>
                R$ 1,00 gasto = {settings?.pointsPerCurrencyUnit ?? '—'} Ponto(s)
              </strong>
            </span>
            <button
              className={styles.buttonSecondary}
              style={{ height: '36px', marginLeft: 'auto' }}
              onClick={openRuleModal}
            >
              Alterar Regra
            </button>
          </div>
          <div className={styles.gamificationGrid}>
            {TIER_ORDER.map((tier) => (
              <div key={tier} className={styles.tierCard}>
                <div className={`${styles.tierHeader} ${styles[tier.toLowerCase()]}`}>
                  <span>{TIER_LABELS[tier]}</span>
                  <FiAward size={20} />
                </div>
                <div className={styles.tierInputGroup}>
                  <label>Pontos Mínimos</label>
                  <input
                    type="number"
                    className={styles.tierInput}
                    value={tierInputs[tier]?.minPoints ?? ''}
                    onChange={(e) => updateTierInput(tier, 'minPoints', e.target.value)}
                  />
                </div>
                <div className={styles.tierInputGroup}>
                  <label>Pontos Máximos</label>
                  <input
                    type="number"
                    className={styles.tierInput}
                    placeholder="Sem limite"
                    value={tierInputs[tier]?.maxPoints ?? ''}
                    onChange={(e) => updateTierInput(tier, 'maxPoints', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tierError && <span className={styles.errorText}>{tierError}</span>}
            <button
              className={styles.buttonPrimary}
              style={{ alignSelf: 'flex-end' }}
              disabled={saveTiersMutation.isPending}
              onClick={() => saveTiersMutation.mutate()}
            >
              <FiSave size={16} />
              <span>{saveTiersMutation.isPending ? 'Salvando...' : 'Salvar Faixas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FiTag /> Gestão de Premiações</h2>
        <div className={styles.card}>
          {couponError && (
            <p style={{ color: 'var(--color-error)', fontSize: 13, padding: '16px 24px 0' }} role="alert">
              {couponError}
            </p>
          )}
          <div className={styles.filterSection}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Buscar premiação pelo código..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Qtd. Usos</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                      Carregando premiações...
                    </td>
                  </tr>
                )}

                {isError && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                      Não foi possível carregar as premiações. Tente novamente.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <span className={styles.couponCode}>{coupon.code}</span>
                    </td>
                    <td>{coupon.discountType === 'PERCENTAGE' ? 'Porcentagem (%)' : 'Valor Fixo (R$)'}</td>
                    <td>
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.value}%`
                        : `R$ ${coupon.value.toFixed(2).replace('.', ',')}`}
                    </td>
                    <td>{coupon.usageCount} vezes</td>
                    <td>{new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className={`${styles.badge} ${coupon.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                        {coupon.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                        <button
                          className={styles.iconButton}
                          title="Editar"
                          onClick={() => router.push(`/loyalty/${coupon.id}`)}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          title={coupon.isActive ? 'Inativar' : 'Ativar'}
                          disabled={toggleCouponMutation.isPending}
                          onClick={() => toggleCouponMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!isLoading && !isError && coupons.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                      {debouncedSearch
                        ? `Nenhuma premiação encontrada com "${debouncedSearch}".`
                        : 'Nenhuma premiação cadastrada ainda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.lastPage > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Página {meta.page} de {meta.lastPage} ({meta.total} premiações)
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

      {/* Modal: Alterar Regra */}
      {isRuleModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Alterar Regra de Pontos</h2>
              <button className={styles.closeButton} onClick={() => setIsRuleModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pontos por R$ 1,00 gasto</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.formInput}
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                autoFocus
              />
            </div>

            {ruleError && <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 16 }}>{ruleError}</p>}

            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <button
                className={styles.buttonSecondary}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setIsRuleModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.buttonPrimary}
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={saveRuleMutation.isPending}
                onClick={() => saveRuleMutation.mutate()}
              >
                {saveRuleMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
