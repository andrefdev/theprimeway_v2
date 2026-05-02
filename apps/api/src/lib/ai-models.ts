import { deepseek } from '@ai-sdk/deepseek'
import type { LanguageModel } from 'ai'

export const chatModel: LanguageModel = deepseek('deepseek-chat')

export const taskModel: LanguageModel = deepseek('deepseek-chat')

export const fastModel: LanguageModel = deepseek('deepseek-chat')
