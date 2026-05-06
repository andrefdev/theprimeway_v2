import { SafeAreaView } from 'react-native-safe-area-context';
import { FeatureGate } from '@/features/feature-flags/FeatureGate';
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt';
import { FEATURES } from '@repo/shared/constants';
import { ChatPanel } from '@features/ai/components/ChatPanel';

function AiChatScreenContent() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ChatPanel />
    </SafeAreaView>
  );
}

export default function AiChatScreen() {
  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <AiChatScreenContent />
    </FeatureGate>
  );
}
