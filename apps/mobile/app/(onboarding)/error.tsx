import { ErrorState } from '@/shared/components/feedback/ErrorState';

export default function OnboardingError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return <ErrorState message={error?.message} onRetry={retry} />;
}
