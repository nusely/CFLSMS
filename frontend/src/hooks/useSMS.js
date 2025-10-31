import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchHistory, sendSMS, refreshStatus } from '../api/smsService'
import { listScheduled, scheduleSMS, deleteScheduled } from '../api/schedulerService'

export function useSMSHistory() {
  return useQuery({ 
    queryKey: ['sms-history'], 
    queryFn: fetchHistory,
    staleTime: 60_000, // 1 minute - reduce refetch frequency
    refetchInterval: false, // Disable automatic polling
  })
}

export function useSendSMS() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: sendSMS,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-history'] })
    }
  })
}

export function useScheduleSMS() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: scheduleSMS,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled'] })
    }
  })
}

export function useScheduledList() {
  return useQuery({ 
    queryKey: ['scheduled'], 
    queryFn: listScheduled,
    staleTime: 60_000, // 1 minute - reduce refetch frequency
    refetchInterval: false, // Disable automatic polling
  })
}

export function useDeleteScheduled() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteScheduled,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled'] })
    }
  })
}

export function useRefreshStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: refreshStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-history'] })
    }
  })
}

