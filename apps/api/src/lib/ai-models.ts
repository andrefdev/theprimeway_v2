import { anthropic } from '@ai-sdk/anthropic'
import { deepseek } from '@ai-sdk/deepseek'
import type { LanguageModel } from 'ai'

// Conversational assistant (tool use, streaming). Haiku chosen for low latency
// and reliable tool calling.
export const chatModel: LanguageModel = anthropic('claude-haiku-4-5')

// Background AI tasks: suggestions, categorization, structured generation,
// conflict detection, etc. DeepSeek V3 is ~10x cheaper than Claude Sonnet
// with solid generateObject support.
export const taskModel: LanguageModel = deepseek('deepseek-chat')

// Fast, low-latency structured outputs for simple estimates (e.g. timebox).
export const fastModel: LanguageModel = anthropic('claude-haiku-4-5')
