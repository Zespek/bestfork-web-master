'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { EventType } from '@bestfork/shared'
import { getEvent, updateEvent } from '@/services/events.service'
import { listRestaurants } from '@/services/restaurants.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from '../new/new-event.module.css'

const editEventSchema = z
  .object({
    name: z.string().min(1, 'O nome do evento é obrigatório.'),
    restaurantId: z.string().min(1, 'Selecione um restaurante.'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Informe uma hora válida.'),
    capacity: z.coerce.number({ invalid_type_error: 'Informe um número válido.' }).int().positive('A capacidade deve ser maior que zero.'),
    type: z.nativeEnum(EventType),
    description: z.string().min(1, 'A descrição é obrigatória.'),
  })
  .refine((data) => !Number.isNaN(new Date(`${data.date}T${data.time}:00`).getTime()), {
    message: 'Informe uma data e hora válidas.',
    path: ['date'],
  })

type EditEventFormInputs = z.infer<typeof editEventSchema>

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const eventId = params.id as string
  const [formError, setFormError] = useState<string | null>(null)

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEvent(eventId),
  })

  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => listRestaurants(),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditEventFormInputs>({ resolver: zodResolver(editEventSchema) })

  // `useForm` não sabe esperar uma promise — só preenche quando os dados chegam.
  useEffect(() => {
    if (event) {
      reset({
        name: event.name,
        restaurantId: event.restaurantId,
        date: format(new Date(event.scheduledFor), 'yyyy-MM-dd'),
        time: format(new Date(event.scheduledFor), 'HH:mm'),
        capacity: event.capacity,
        type: event.type,
        description: event.description,
      })
    }
  }, [event, reset])

  const updateMutation = useMutation({
    mutationFn: (data: EditEventFormInputs) =>
      updateEvent(eventId, {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description,
        type: data.type,
        scheduledFor: new Date(`${data.date}T${data.time}:00`).toISOString(),
        capacity: data.capacity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      router.push('/events')
    },
    onError: (error) => {
      setFormError(extractErrorMessage(error, 'Não foi possível salvar as alterações. Tente novamente.'))
    },
  })

  const onSubmit = (data: EditEventFormInputs) => {
    setFormError(null)
    updateMutation.mutate(data)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/events" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Editar Evento
          </h1>
          <p className={styles.subtitle}>Atualize os dados do evento selecionado</p>
        </div>
      </div>

      <div className={styles.card}>
        {isLoading && <p style={{ color: 'var(--color-gray-500)' }}>Carregando evento...</p>}

        {isError && (
          <div className={styles.formError} role="alert">
            Não foi possível carregar este evento. Ele pode ter sido removido.
          </div>
        )}

        {event && (
          <form
            onSubmit={(e) => {
              // Limpa o erro de uma tentativa anterior — senão ele fica preso na
              // tela quando a validação client-side barra este novo envio.
              setFormError(null)
              void handleSubmit(onSubmit)(e)
            }}
          >
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Nome do Evento
                </label>
                <input type="text" id="name" className={styles.input} {...register('name')} />
                {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="restaurantId" className={styles.label}>
                  Restaurante (Casa)
                </label>
                <select id="restaurantId" className={styles.select} {...register('restaurantId')}>
                  <option value="">Selecione um restaurante...</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
                {errors.restaurantId && <span className={styles.errorText}>{errors.restaurantId.message}</span>}
              </div>
            </div>

            <div className={styles.rowThree}>
              <div className={styles.formGroup}>
                <label htmlFor="date" className={styles.label}>
                  Data
                </label>
                <input type="date" id="date" className={styles.input} {...register('date')} />
                {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="time" className={styles.label}>
                  Hora
                </label>
                <input type="time" id="time" className={styles.input} {...register('time')} />
                {errors.time && <span className={styles.errorText}>{errors.time.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="capacity" className={styles.label}>
                  Lotação / Vagas
                </label>
                <input type="number" id="capacity" className={styles.input} min="1" {...register('capacity')} />
                {errors.capacity && <span className={styles.errorText}>{errors.capacity.message}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="type" className={styles.label}>
                Tipo de Evento
              </label>
              <select id="type" className={styles.select} {...register('type')}>
                <option value={EventType.PUBLIC}>Público (Aberto a todos)</option>
                <option value={EventType.PRIVATE}>Privado (Fechado/Exclusivo)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Descrição do Evento
              </label>
              <textarea id="description" className={styles.textarea} {...register('description')} />
              {errors.description && <span className={styles.errorText}>{errors.description.message}</span>}
            </div>

            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}

            <div className={styles.formActions}>
              <Link href="/events" className={styles.buttonSecondary}>
                Cancelar
              </Link>
              <button type="submit" className={styles.buttonPrimary} disabled={updateMutation.isPending}>
                <FiSave size={18} />
                <span>{updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
