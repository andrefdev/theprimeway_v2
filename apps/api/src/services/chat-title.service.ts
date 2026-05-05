import { generateText } from 'ai'
import { fastModel } from '../lib/ai-models'
import { chatRepo } from '../repositories/chat.repo'

const SYSTEM = `You generate short conversation titles. Output ONLY 3 to 5 words. No quotes, no period, no prefix like "Title:". Match the language of the conversation.`

class ChatTitleService {
  async generate(userId: string, threadId: string): Promise<void> {
    try {
      const thread = await chatRepo.findThreadById(userId, threadId)
      if (!thread || thread.title) return

      const { user, assistant } = await chatRepo.getFirstUserAndAssistantMessages(threadId)
      if (!user) return

      const prompt = [
        `User: ${user.content.slice(0, 500)}`,
        assistant ? `Assistant: ${assistant.content.slice(0, 500)}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      const result = await generateText({
        model: fastModel,
        system: SYSTEM,
        prompt,
      })

      const cleaned = result.text
        .trim()
        .replace(/^["'`]+|["'`]+$/g, '')
        .replace(/\.$/, '')
        .slice(0, 100)

      if (!cleaned) return
      await chatRepo.renameThread(userId, threadId, cleaned)
    } catch (err) {
      console.error('[chat-title] generation failed', err)
    }
  }
}

export const chatTitleService = new ChatTitleService()
