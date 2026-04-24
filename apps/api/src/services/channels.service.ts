import { channelsRepo, type ChannelCreate, type ContextCreate } from '../repositories/channels.repo'

class ChannelsService {
  listContexts(userId: string) { return channelsRepo.listContexts(userId) }
  createContext(userId: string, data: ContextCreate) { return channelsRepo.createContext(userId, data) }
  updateContext(userId: string, id: string, data: Partial<ContextCreate>) { return channelsRepo.updateContext(id, userId, data) }
  deleteContext(userId: string, id: string) { return channelsRepo.deleteContext(id, userId) }

  listChannels(userId: string) { return channelsRepo.listChannels(userId) }
  createChannel(userId: string, data: ChannelCreate) { return channelsRepo.createChannel(userId, data) }
  updateChannel(userId: string, id: string, data: Partial<ChannelCreate>) { return channelsRepo.updateChannel(id, userId, data) }
  deleteChannel(userId: string, id: string) { return channelsRepo.deleteChannel(id, userId) }

  seedDefaults(userId: string) { return channelsRepo.seedDefaults(userId) }
}

export const channelsService = new ChannelsService()
