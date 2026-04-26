import { Pressable, View, type PressableProps } from 'react-native';
import { TextClassContext } from '@/shared/components/ui/text';
import { cn } from '@/shared/utils';

type PressableCardProps = PressableProps & React.RefAttributes<View>;

function PressableCard({ className, ...props }: PressableCardProps) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <Pressable
        className={cn(
          'bg-card border-border rounded-2xl border p-4 shadow-sm shadow-black/5 active:opacity-80',
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { PressableCard };
