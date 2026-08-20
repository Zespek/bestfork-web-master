'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiX, FiShield, FiSave } from 'react-icons/fi'
import { IProfile } from '@bestfork/shared'
import { listProfiles, listModules, createProfile, updateProfile, updateProfilePermissions } from '@/services/profiles.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './permissions.module.css'

/**
 * Só as células que o usuário mudou — `overrides[profileId][moduleId] = enabled`.
 * Guardar apenas o diff (em vez de copiar a matriz inteira do servidor pra um
 * estado local) evita precisar de um `useEffect` pra ressincronizar a cada
 * `refetch`; o valor efetivo de cada célula é resolvido em `isCellEnabled`.
 */
type MatrixOverrides = Record<string, Record<string, boolean>>

export default function PermissionsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix'>('roles')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<IProfile | null>(null)
  const [profileName, setProfileName] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<MatrixOverrides>({})

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  })

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: listModules,
  })

  function isCellEnabled(profile: IProfile, moduleId: string): boolean {
    const override = overrides[profile.id]?.[moduleId]
    if (override !== undefined) return override

    return profile.permissions.find((permission) => permission.moduleId === moduleId)?.enabled ?? false
  }

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      editingProfile ? updateProfile(editingProfile.id, { name: profileName }) : createProfile({ name: profileName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      closeModal()
    },
    onError: (error) => {
      setModalError(extractErrorMessage(error, 'Não foi possível salvar o cargo. Tente novamente.'))
    },
  })

  const saveMatrixMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        profiles.map((profile) =>
          updateProfilePermissions(profile.id, {
            permissions: modules.map((module) => ({
              moduleId: module.id,
              enabled: isCellEnabled(profile, module.id),
            })),
          }),
        ),
      )
    },
    onSuccess: () => {
      // Depois de salvo, os overrides já viraram o dado real do servidor.
      setOverrides({})
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })

  function openCreateModal() {
    setEditingProfile(null)
    setProfileName('')
    setModalError(null)
    setIsModalOpen(true)
  }

  function openEditModal(profile: IProfile) {
    setEditingProfile(profile)
    setProfileName(profile.name)
    setModalError(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
  }

  function toggleCell(profile: IProfile, moduleId: string) {
    const nextValue = !isCellEnabled(profile, moduleId)

    setOverrides((current) => ({
      ...current,
      [profile.id]: { ...current[profile.id], [moduleId]: nextValue },
    }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Níveis de Permissão</h1>
          <p className={styles.subtitle}>
            Gerencie os cargos e o que cada perfil pode acessar na plataforma
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.buttonPrimary} onClick={openCreateModal}>
            <FiPlus size={18} />
            <span>Novo Perfil / Cargo</span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'roles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            Cargos e Usuários
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'matrix' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            Matriz de Permissões Dinâmica
          </button>
        </div>

        {activeTab === 'roles' && (
          <div>
            <div className={styles.cardTitle}>
              <FiShield color="var(--color-gold)" />
              Cargos Cadastrados
            </div>

            <table className={styles.matrixTable} style={{ marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Nome do Cargo</th>
                  <th style={{ textAlign: 'center' }}>Usuários Vinculados</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingProfiles && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>
                      Carregando cargos...
                    </td>
                  </tr>
                )}

                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>{profile.name}</td>
                    <td style={{ textAlign: 'center' }}>{profile.usersCount}</td>
                    <td
                      style={{ textAlign: 'right', color: 'var(--color-gold)', cursor: 'pointer' }}
                      onClick={() => openEditModal(profile)}
                    >
                      Editar
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'matrix' && (
          <div>
            <div className={styles.header} style={{ marginBottom: 20 }}>
              <div className={styles.cardTitle} style={{ marginBottom: 0 }}>
                Matriz de Acessos
              </div>
              <button
                className={styles.buttonPrimary}
                style={{ backgroundColor: 'var(--color-success)', height: 36 }}
                disabled={saveMatrixMutation.isPending}
                onClick={() => saveMatrixMutation.mutate()}
              >
                <FiSave size={16} />
                <span>{saveMatrixMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.matrixTable}>
                <thead>
                  <tr>
                    <th>Módulo / Funcionalidade</th>
                    {profiles.map((profile) => (
                      <th key={profile.id}>{profile.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module.id}>
                      <td>
                        <div className={styles.moduleName}>{module.name}</div>
                        <div className={styles.moduleDesc}>{module.description}</div>
                      </td>
                      {profiles.map((profile) => (
                        <td key={`${module.id}-${profile.id}`}>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={isCellEnabled(profile, module.id)}
                              onChange={() => toggleCell(profile, module.id)}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição de Cargo */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingProfile ? 'Editar Cargo' : 'Novo Cargo'}</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nome do Cargo</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Ex: Gerente Financeiro"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                autoFocus
              />
            </div>

            {modalError && (
              <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 16 }}>{modalError}</p>
            )}

            <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
              <button
                className={styles.buttonPrimary}
                style={{ flex: 1, backgroundColor: 'var(--color-gray-200)', color: 'var(--color-black)' }}
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className={styles.buttonPrimary}
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={!profileName.trim() || saveProfileMutation.isPending}
                onClick={() => saveProfileMutation.mutate()}
              >
                {saveProfileMutation.isPending ? 'Salvando...' : 'Salvar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
