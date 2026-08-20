'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiEdit2, FiPlus, FiSave, FiTrash2, FiMapPin, FiStar, FiX } from 'react-icons/fi'
import { IEventSpace } from '@bestfork/shared'
import { getRestaurant, updateRestaurant } from '@/services/restaurants.service'
import { listStaff, createStaff, updateStaff } from '@/services/restaurant-staff.service'
import { listEventSpaces, createEventSpace, updateEventSpace, deleteEventSpace } from '@/services/event-spaces.service'
import { extractErrorMessage } from '@/lib/http-error'
import { formatCnpj, formatPhone, maskOnChange } from '@/lib/masks'
import styles from '../restaurants.module.css'

const editDataSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z.enum(['ACTIVE', 'INACTIVE']),
  ownerName: z.string().min(1, 'O nome do proprietário é obrigatório.'),
  ownerEmail: z.string().email('Informe um e-mail válido.'),
  ownerPhone: z.string().optional(),
})

type EditDataFormInputs = z.infer<typeof editDataSchema>

const staffModalSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Informe um e-mail válido.'),
  position: z.string().optional(),
})

type StaffModalFormInputs = z.infer<typeof staffModalSchema>

const spaceModalSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  capacity: z.coerce.number({ invalid_type_error: 'Informe um número válido.' }).int().positive('A capacidade deve ser maior que zero.'),
  availableDays: z.string().min(1, 'Os dias disponíveis são obrigatórios.'),
})

type SpaceModalFormInputs = z.infer<typeof spaceModalSchema>

export default function RestaurantDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const restaurantId = params.id as string

  const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'team' | 'spaces'>('dashboard')
  const [isEditingData, setIsEditingData] = useState(false)
  const [dataFormError, setDataFormError] = useState<string | null>(null)

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [staffModalError, setStaffModalError] = useState<string | null>(null)
  const [staffDevLink, setStaffDevLink] = useState<string | null>(null)

  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<IEventSpace | null>(null)
  const [spaceModalError, setSpaceModalError] = useState<string | null>(null)

  const {
    data: restaurant,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['restaurants', restaurantId],
    queryFn: () => getRestaurant(restaurantId),
  })

  const { data: staff = [] } = useQuery({
    queryKey: ['restaurants', restaurantId, 'staff'],
    queryFn: () => listStaff(restaurantId),
    enabled: activeTab === 'team',
  })

  const { data: eventSpaces = [] } = useQuery({
    queryKey: ['restaurants', restaurantId, 'event-spaces'],
    queryFn: () => listEventSpaces(restaurantId),
    enabled: activeTab === 'spaces',
  })

  // --- Dados Cadastrais: edição inline (sem rota nova) ---

  const {
    register: registerData,
    handleSubmit: handleSubmitData,
    reset: resetDataForm,
    formState: { errors: dataErrors },
  } = useForm<EditDataFormInputs>({ resolver: zodResolver(editDataSchema) })

  const cnpjField = registerData('cnpj')
  const ownerPhoneField = registerData('ownerPhone')

  // `useForm` não sabe esperar uma promise — só preenche quando os dados chegam.
  useEffect(() => {
    if (restaurant) {
      resetDataForm({
        name: restaurant.name,
        cnpj: restaurant.cnpj ?? '',
        address: restaurant.address ?? '',
        city: restaurant.city ?? '',
        state: restaurant.state ?? '',
        isActive: restaurant.isActive ? 'ACTIVE' : 'INACTIVE',
        ownerName: restaurant.owner.name,
        ownerEmail: restaurant.owner.email,
        ownerPhone: restaurant.owner.phone ?? '',
      })
    }
  }, [restaurant, resetDataForm])

  const updateDataMutation = useMutation({
    mutationFn: (data: EditDataFormInputs) =>
      updateRestaurant(restaurantId, {
        name: data.name,
        cnpj: data.cnpj || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        isActive: data.isActive === 'ACTIVE',
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPhone: data.ownerPhone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      setIsEditingData(false)
    },
    onError: (error) => {
      setDataFormError(extractErrorMessage(error, 'Não foi possível salvar as alterações. Tente novamente.'))
    },
  })

  function openEditData() {
    setDataFormError(null)
    setIsEditingData(true)
  }

  function cancelEditData() {
    setIsEditingData(false)
    setDataFormError(null)
    if (restaurant) {
      resetDataForm({
        name: restaurant.name,
        cnpj: restaurant.cnpj ?? '',
        address: restaurant.address ?? '',
        city: restaurant.city ?? '',
        state: restaurant.state ?? '',
        isActive: restaurant.isActive ? 'ACTIVE' : 'INACTIVE',
        ownerName: restaurant.owner.name,
        ownerEmail: restaurant.owner.email,
        ownerPhone: restaurant.owner.phone ?? '',
      })
    }
  }

  // --- Colaboradores ---

  const {
    register: registerStaff,
    handleSubmit: handleSubmitStaff,
    reset: resetStaffForm,
    formState: { errors: staffErrors },
  } = useForm<StaffModalFormInputs>({ resolver: zodResolver(staffModalSchema) })

  const createStaffMutation = useMutation({
    mutationFn: (data: StaffModalFormInputs) =>
      createStaff(restaurantId, { name: data.name, email: data.email, position: data.position || undefined }),
    onSuccess: (result) => {
      setStaffDevLink(result.devSetPasswordLink ?? null)
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'staff'] })
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    },
    onError: (error) => {
      setStaffModalError(extractErrorMessage(error, 'Não foi possível cadastrar o colaborador. Tente novamente.'))
    },
  })

  const toggleStaffActiveMutation = useMutation({
    mutationFn: ({ staffId, isActive }: { staffId: string; isActive: boolean }) =>
      updateStaff(restaurantId, staffId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'staff'] })
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    },
  })

  function openStaffModal() {
    resetStaffForm({ name: '', email: '', position: '' })
    setStaffModalError(null)
    setStaffDevLink(null)
    setIsStaffModalOpen(true)
  }

  function closeStaffModal() {
    setIsStaffModalOpen(false)
  }

  // --- Espaços de Eventos ---

  const {
    register: registerSpace,
    handleSubmit: handleSubmitSpace,
    reset: resetSpaceForm,
    formState: { errors: spaceErrors },
  } = useForm<SpaceModalFormInputs>({ resolver: zodResolver(spaceModalSchema) })

  const saveSpaceMutation = useMutation({
    mutationFn: (data: SpaceModalFormInputs) =>
      editingSpace
        ? updateEventSpace(restaurantId, editingSpace.id, data)
        : createEventSpace(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'event-spaces'] })
      closeSpaceModal()
    },
    onError: (error) => {
      setSpaceModalError(extractErrorMessage(error, 'Não foi possível salvar o espaço de evento. Tente novamente.'))
    },
  })

  const deleteSpaceMutation = useMutation({
    mutationFn: (spaceId: string) => deleteEventSpace(restaurantId, spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'event-spaces'] })
    },
  })

  function openCreateSpaceModal() {
    setEditingSpace(null)
    resetSpaceForm({ name: '', capacity: undefined, availableDays: '' })
    setSpaceModalError(null)
    setIsSpaceModalOpen(true)
  }

  function openEditSpaceModal(space: IEventSpace) {
    setEditingSpace(space)
    resetSpaceForm({ name: space.name, capacity: space.capacity, availableDays: space.availableDays })
    setSpaceModalError(null)
    setIsSpaceModalOpen(true)
  }

  function closeSpaceModal() {
    setIsSpaceModalOpen(false)
  }

  function handleDeleteSpace(space: IEventSpace) {
    if (window.confirm(`Excluir o espaço "${space.name}"? Esta ação não pode ser desfeita.`)) {
      deleteSpaceMutation.mutate(space.id)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--color-gray-500)' }}>Carregando casa...</p>
      </div>
    )
  }

  if (isError || !restaurant) {
    return (
      <div className={styles.container}>
        <div className={styles.detailsCard}>
          Não foi possível carregar esta casa. Ela pode ter sido removida.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push('/restaurants')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20, backgroundColor: 'var(--color-gray-100)' }}
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title}>{restaurant.name}</h1>
            <p className={styles.subtitle}>Gestão completa do estabelecimento</p>
          </div>
        </div>
        <div className={styles.actions}>
          <span
            className={`${styles.statusBadge} ${restaurant.isActive ? styles.statusActive : styles.statusInactive}`}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            {restaurant.isActive ? 'Ativo na Plataforma' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button className={`${styles.tab} ${activeTab === 'data' ? styles.tabActive : ''}`} onClick={() => setActiveTab('data')}>
          Dados Cadastrais
        </button>
        <button className={`${styles.tab} ${activeTab === 'team' ? styles.tabActive : ''}`} onClick={() => setActiveTab('team')}>
          Colaboradores
        </button>
        <button className={`${styles.tab} ${activeTab === 'spaces' ? styles.tabActive : ''}`} onClick={() => setActiveTab('spaces')}>
          Espaços de Eventos
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className={styles.detailsCard}>
          <h2 style={{ fontSize: 18, marginBottom: 20 }}>Visão Geral (Indicadores)</h2>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div style={{ color: 'var(--color-gray-500)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
                Colaboradores Ativos
              </div>
              <div className={styles.kpiValue}>{restaurant.staffCount}</div>
            </div>

            <div className={styles.kpiCard}>
              <div style={{ color: 'var(--color-gray-500)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
                Favoritado por (Clientes)
              </div>
              <div className={styles.kpiValue} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                —
                <FiStar size={24} color="var(--color-warning)" />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div style={{ color: 'var(--color-gray-500)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
                Avaliação Média
              </div>
              <div className={styles.kpiValue}>—</div>
            </div>

            <div className={styles.kpiCard}>
              <div style={{ color: 'var(--color-gray-500)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
                Reservas (Mês)
              </div>
              <div className={styles.kpiValue}>—</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className={styles.detailsCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18 }}>Dados do Restaurante e Proprietário</h2>
            {!isEditingData && (
              <button className={styles.buttonPrimary} style={{ height: 36 }} onClick={openEditData}>
                <FiEdit2 size={16} />
                <span>Editar Dados</span>
              </button>
            )}
          </div>

          {!isEditingData ? (
            <div className={styles.detailsHeader}>
              <div
                className={styles.detailsLogo}
                style={{ backgroundColor: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', color: 'var(--color-gray-400)' }}
              >
                {restaurant.name.charAt(0)}
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--color-gray-500)', fontWeight: 600 }}>NOME FANTASIA</p>
                  <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 16 }}>{restaurant.name}</p>

                  <p style={{ fontSize: 12, color: 'var(--color-gray-500)', fontWeight: 600 }}>CNPJ</p>
                  <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 16 }}>{restaurant.cnpj || '—'}</p>

                  <p style={{ fontSize: 12, color: 'var(--color-gray-500)', fontWeight: 600 }}>ENDEREÇO</p>
                  <p style={{ fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiMapPin />
                    {[restaurant.address, restaurant.city, restaurant.state].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--color-gray-500)', fontWeight: 600 }}>NOME DO PROPRIETÁRIO</p>
                  <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 16 }}>{restaurant.owner.name}</p>

                  <p style={{ fontSize: 12, color: 'var(--color-gray-500)', fontWeight: 600 }}>E-MAIL DO PROPRIETÁRIO</p>
                  <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 16 }}>{restaurant.owner.email}</p>

                  <p style={{ fontSize: 12, color: 'var(--color-gray-500)', fontWeight: 600 }}>CONTATO</p>
                  <p style={{ fontWeight: 500, fontSize: 15 }}>{restaurant.owner.phone || '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitData((data) => updateDataMutation.mutate(data))}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome Fantasia</label>
                <input className={styles.formInput} {...registerData('name')} />
                {dataErrors.name && <span className={styles.errorText}>{dataErrors.name.message}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>CNPJ</label>
                  <input
                    className={styles.formInput}
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    {...cnpjField}
                    onChange={maskOnChange(formatCnpj, cnpjField.onChange)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select className={styles.formSelect} {...registerData('isActive')}>
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Endereço</label>
                <input className={styles.formInput} {...registerData('address')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cidade</label>
                  <input className={styles.formInput} {...registerData('city')} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>UF</label>
                  <input className={styles.formInput} maxLength={2} {...registerData('state')} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome do Proprietário</label>
                <input className={styles.formInput} {...registerData('ownerName')} />
                {dataErrors.ownerName && <span className={styles.errorText}>{dataErrors.ownerName.message}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>E-mail do Proprietário</label>
                  <input className={styles.formInput} {...registerData('ownerEmail')} />
                  {dataErrors.ownerEmail && <span className={styles.errorText}>{dataErrors.ownerEmail.message}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contato</label>
                  <input
                    className={styles.formInput}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    {...ownerPhoneField}
                    onChange={maskOnChange(formatPhone, ownerPhoneField.onChange)}
                  />
                </div>
              </div>

              {dataFormError && <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 16 }}>{dataFormError}</p>}

              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  style={{ backgroundColor: 'var(--color-gray-200)', color: 'var(--color-black)' }}
                  onClick={cancelEditData}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.buttonPrimary} disabled={updateDataMutation.isPending}>
                  <FiSave size={16} />
                  <span>{updateDataMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className={styles.detailsCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18 }}>Colaboradores do Restaurante</h2>
            <button className={styles.buttonPrimary} style={{ height: 36 }} onClick={openStaffModal}>
              <FiPlus size={16} />
              <span>Novo Colaborador</span>
            </button>
          </div>

          {staff.length === 0 ? (
            <div className={styles.emptyState}>Nenhum colaborador cadastrado ainda.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-black)' }}>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.position || '—'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${member.isActive ? styles.statusActive : styles.statusInactive}`}>
                        {member.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <label className={styles.switch} title={member.isActive ? 'Inativar' : 'Ativar'}>
                        <input
                          type="checkbox"
                          checked={member.isActive}
                          onChange={() =>
                            toggleStaffActiveMutation.mutate({ staffId: member.id, isActive: !member.isActive })
                          }
                        />
                        <span className={styles.slider} />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'spaces' && (
        <div className={styles.detailsCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18 }}>Espaços de Eventos</h2>
            <button className={styles.buttonPrimary} style={{ height: 36 }} onClick={openCreateSpaceModal}>
              <FiPlus size={16} />
              <span>Cadastrar Espaço</span>
            </button>
          </div>

          {eventSpaces.length === 0 ? (
            <div className={styles.emptyState}>Nenhum espaço de evento cadastrado ainda.</div>
          ) : (
            eventSpaces.map((space) => (
              <div key={space.id} className={styles.spaceCard}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{space.name}</h3>
                  <p style={{ fontSize: 14, color: 'var(--color-gray-500)', marginTop: 8 }}>
                    Capacidade: <strong>Até {space.capacity} pessoas</strong>
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--color-gray-500)', marginTop: 4 }}>
                    Dias Disponíveis: <strong>{space.availableDays}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{ color: 'var(--color-gold)' }} onClick={() => openEditSpaceModal(space)} title="Editar">
                    <FiEdit2 size={16} />
                  </button>
                  <button style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteSpace(space)} title="Excluir">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Novo Colaborador */}
      {isStaffModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Novo Colaborador</h2>
              <button className={styles.closeButton} onClick={closeStaffModal}>
                <FiX size={24} />
              </button>
            </div>

            {staffDevLink ? (
              <div>
                <div className={styles.successPanel}>
                  <p><strong>Colaborador cadastrado com sucesso!</strong></p>
                  <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--color-gray-600)' }}>
                    Envie o link abaixo para a pessoa definir a própria senha.
                  </p>
                </div>
                <div className={styles.devLinkBox}>
                  <p style={{ fontWeight: 700, marginBottom: '8px' }}>
                    🧪 Modo dev — sem envio de e-mail real ainda:
                  </p>
                  <Link href={staffDevLink} style={{ color: 'var(--color-gold)' }}>
                    {staffDevLink}
                  </Link>
                </div>
                <div style={{ display: 'flex', marginTop: 24 }}>
                  <button className={styles.buttonPrimary} style={{ flex: 1, justifyContent: 'center' }} onClick={closeStaffModal}>
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitStaff((data) => createStaffMutation.mutate(data))}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome</label>
                  <input className={styles.formInput} autoFocus {...registerStaff('name')} />
                  {staffErrors.name && <span className={styles.errorText}>{staffErrors.name.message}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>E-mail</label>
                  <input className={styles.formInput} {...registerStaff('email')} />
                  {staffErrors.email && <span className={styles.errorText}>{staffErrors.email.message}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cargo</label>
                  <input className={styles.formInput} placeholder="Ex: Gerente do Salão" {...registerStaff('position')} />
                </div>

                {staffModalError && (
                  <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 16 }}>{staffModalError}</p>
                )}

                <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                  <button
                    type="button"
                    className={styles.buttonPrimary}
                    style={{ flex: 1, backgroundColor: 'var(--color-gray-200)', color: 'var(--color-black)' }}
                    onClick={closeStaffModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.buttonPrimary}
                    style={{ flex: 1, justifyContent: 'center' }}
                    disabled={createStaffMutation.isPending}
                  >
                    {createStaffMutation.isPending ? 'Salvando...' : 'Salvar Colaborador'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Cadastrar/Editar Espaço de Evento */}
      {isSpaceModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingSpace ? 'Editar Espaço' : 'Cadastrar Espaço'}</h2>
              <button className={styles.closeButton} onClick={closeSpaceModal}>
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitSpace((data) => saveSpaceMutation.mutate(data))}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome do Espaço</label>
                <input className={styles.formInput} placeholder="Ex: Salão Privativo" autoFocus {...registerSpace('name')} />
                {spaceErrors.name && <span className={styles.errorText}>{spaceErrors.name.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Capacidade (pessoas)</label>
                <input type="number" className={styles.formInput} {...registerSpace('capacity')} />
                {spaceErrors.capacity && <span className={styles.errorText}>{spaceErrors.capacity.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dias Disponíveis</label>
                <input className={styles.formInput} placeholder="Ex: Segunda a Quinta" {...registerSpace('availableDays')} />
                {spaceErrors.availableDays && <span className={styles.errorText}>{spaceErrors.availableDays.message}</span>}
              </div>

              {spaceModalError && (
                <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 16 }}>{spaceModalError}</p>
              )}

              <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  style={{ flex: 1, backgroundColor: 'var(--color-gray-200)', color: 'var(--color-black)' }}
                  onClick={closeSpaceModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.buttonPrimary}
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={saveSpaceMutation.isPending}
                >
                  {saveSpaceMutation.isPending ? 'Salvando...' : 'Salvar Espaço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
