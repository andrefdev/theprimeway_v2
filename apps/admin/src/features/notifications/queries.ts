import { useMutation } from '@tanstack/react-query'
import { sendPush, type SendPushInput } from './api'

export function useSendPush() {
  return useMutation({
    mutationFn: (input: SendPushInput) => sendPush(input),
  })
}
