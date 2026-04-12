import { useState, useEffect } from 'react';
import { Screen, ScreenContent } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { PillTabs } from '@/shared/components/ui/pill-tabs';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { VisionCard } from '@/features/goals/components/VisionCard';
import { ThreeYearGoalCard } from '@/features/goals/components/ThreeYearGoalCard';
import { ProgressRing } from '@/features/gamification/components/ProgressRing';
import {
  useVisions,
  useThreeYearGoals,
  useAnnualGoals,
  useQuarterlyGoals,
  useWeeklyGoals,
  useHealthSnapshots,
  useCreateHealthSnapshot,
  useFocusLinks,
} from '@/features/goals/hooks/useGoals';
import { PILLARS } from '@/shared/constants/pillars';
import {
  Plus,
  Target,
  X,
  Heart,
  Compass,
  Info,
  ChevronRight,
  CheckCircle2,
  Crosshair,
  Calendar,
  Activity,
  DollarSign,
  Repeat2,
  ListChecks,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Link,
} from 'lucide-react-native';
import { PageHeader } from '@features/personalization/components/PageHeader';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThreeYearGoal } from '@shared/types/models';
import type { HealthSnapshot } from '@/features/goals/services/goalsService';

const EXAMPLE_DISMISSED_KEY = 'goals_example_dismissed';

type GoalTab = 'roadmap' | 'outcomes' | 'quarterly' | 'health';

export default function GoalsScreen() {
  const { t } = useTranslation('features.goals');
  const { t: tCommon } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<GoalTab>('roadmap');

  const TABS = [
    { key: 'roadmap', label: t('roadmap') },
    { key: 'outcomes', label: 'Outcomes' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'health', label: 'Health' },
  ];

  const {
    data: visions,
    isLoading: visionsLoading,
    isError: visionsError,
    refetch: refetchVisions,
  } = useVisions();

  const {
    data: threeYearGoals,
    isLoading: threeYearGoalsLoading,
    isError: threeYearGoalsError,
    refetch: refetchThreeYearGoals,
  } = useThreeYearGoals();

  const isLoading = visionsLoading || threeYearGoalsLoading;
  const isError = visionsError || threeYearGoalsError;

  if (isLoading) {
    return (
      <Screen>
        <PageHeader sectionId="goals" title={t('roadmap')} />
        <LoadingOverlay message={tCommon('actions.loading')} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <PageHeader sectionId="goals" title={t('roadmap')} />
        <ErrorState
          onRetry={() => {
            refetchVisions();
            refetchThreeYearGoals();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader sectionId="goals" title={t('roadmap')} />

      <View className="px-4 py-2">
        <PillTabs
          tabs={TABS}
          activeKey={activeTab}
          onTabPress={(key) => setActiveTab(key as GoalTab)}
        />
      </View>

      {activeTab === 'roadmap' && (
        <RoadmapTab visions={visions} threeYearGoals={threeYearGoals} t={t} />
      )}
      {activeTab === 'outcomes' && <OutcomesTab t={t} />}
      {activeTab === 'quarterly' && <QuarterlyTab t={t} />}
      {activeTab === 'health' && <HealthTab />}
    </Screen>
  );
}

// ── Roadmap Tab ───────────────────────────────
function RoadmapTab({
  visions,
  threeYearGoals,
  t,
}: {
  visions: any;
  threeYearGoals: any;
  t: (k: string) => string;
}) {
  const [exampleDismissed, setExampleDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(EXAMPLE_DISMISSED_KEY).then((value) => {
      setExampleDismissed(value === 'true');
    });
  }, []);

  const dismissExample = () => {
    setExampleDismissed(true);
    AsyncStorage.setItem(EXAMPLE_DISMISSED_KEY, 'true');
  };

  const vision = visions?.[0];
  const hasData = !!vision || (threeYearGoals && threeYearGoals.length > 0);
  const showExample = !hasData && !exampleDismissed;

  const goalsByArea = new Map(
    (threeYearGoals ?? []).map((g: any) => [g.area, g])
  );

  const pillarGrid: ThreeYearGoal[] = PILLARS.map(
    (config) =>
      goalsByArea.get(config.area) ?? {
        id: `stub-${config.area}`,
        area: config.area,
        title: t(`areas.${config.area}`),
        annualGoals: [],
      }
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <ScreenContent>
        {showExample && (
          <View className="mb-6">
            <Pressable
              onPress={dismissExample}
              className="mb-4 flex-row items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
            >
              <Icon as={Info} size={18} className="mt-0.5 text-primary" />
              <Text className="flex-1 text-sm leading-5 text-foreground/80">
                {t('exampleData.banner')}
              </Text>
              <Icon as={X} size={16} className="text-muted-foreground" />
            </Pressable>

            <View className="mb-4 overflow-hidden rounded-xl border border-dashed border-primary/30 bg-card">
              <View className="h-1 bg-primary/50" />
              <View className="p-5">
                <View className="mb-3 flex-row items-center gap-2">
                  <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon as={Compass} size={18} className="text-primary" />
                  </View>
                  <Text className="text-base font-semibold text-card-foreground">{t('primeVision')}</Text>
                </View>
                <Text className="mb-1 text-lg font-bold text-card-foreground">
                  {t('exampleData.visionTitle')}
                </Text>
                <Text className="text-sm leading-5 text-muted-foreground">
                  {t('exampleData.visionNarrative')}
                </Text>
              </View>
            </View>

            <View className="overflow-hidden rounded-xl border border-dashed border-rose-400/30 bg-card p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-rose-400/15">
                  <Icon as={Heart} size={18} className="text-rose-400" />
                </View>
                <Text className="text-sm font-semibold text-card-foreground">
                  {t('exampleData.pillarTitle')}
                </Text>
              </View>

              <View className="ml-5 border-l-2 border-muted pl-4">
                <View className="mb-2">
                  <Text className="text-sm font-medium text-card-foreground">
                    {t('exampleData.outcomeTitle')}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {t('exampleData.outcomeDescription')}
                  </Text>
                </View>

                <View className="ml-3 flex-row items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <Icon as={ChevronRight} size={14} className="text-muted-foreground" />
                  <Text className="text-xs font-medium text-foreground">
                    {t('exampleData.focusTitle')}
                  </Text>
                </View>
              </View>
            </View>

            <Button variant="outline" className="mt-4" onPress={dismissExample}>
              <Text className="text-sm text-muted-foreground">{t('exampleData.dismiss')}</Text>
            </Button>
          </View>
        )}

        {vision ? (
          <VisionCard vision={vision} className="mb-6" />
        ) : (
          !showExample && (
            <EmptyState
              icon={Target}
              title={t('primeVision')}
              description={t('description')}
              actionLabel={t('vision.form.create')}
              onAction={() => router.push('/(app)/(tabs)/goals/vision' as any)}
              className="mb-6 rounded-xl border border-dashed border-border bg-card py-8"
            />
          )
        )}

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">{t('primePillars')}</Text>
          <Text className="text-xs text-muted-foreground">6 {t('area')}</Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {pillarGrid.map((goal) => (
            <ThreeYearGoalCard key={goal.id} threeYearGoal={goal} className="w-[48%] flex-grow" />
          ))}
        </View>
      </ScreenContent>
    </ScrollView>
  );
}

// ── Outcomes Tab ──────────────────────────────
function OutcomesTab({ t }: { t: (k: string) => string }) {
  const { data: annualGoals, isLoading } = useAnnualGoals();
  const { data: threeYearGoals } = useThreeYearGoals();

  const threeYearGoalMap = new Map(
    (threeYearGoals ?? []).map((g: any) => [g.id, g])
  );

  if (isLoading) return <LoadingOverlay />;

  if (!annualGoals || annualGoals.length === 0) {
    return (
      <View className="flex-1 px-4 pt-8">
        <EmptyState
          icon={Crosshair}
          title="No annual goals yet"
          description="Create annual goals under your three-year goals to define what you want to achieve."
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-3">
        {(annualGoals as any[]).map((goal, index) => {
          const threeYearGoal = threeYearGoalMap.get(goal.threeYearGoalId);
          return (
            <Animated.View key={goal.id} entering={FadeInDown.delay(index * 50).duration(300)}>
              <View className="rounded-xl border border-border bg-card p-4">
                {/* ThreeYearGoal badge */}
                {threeYearGoal && (
                  <Text className="mb-1 text-xs font-medium text-primary">
                    {threeYearGoal.title}
                  </Text>
                )}
                <Text className="text-sm font-semibold text-foreground">{goal.title}</Text>
                {goal.description && (
                  <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                    {goal.description}
                  </Text>
                )}
                {goal.targetDate && (
                  <Text className="mt-1.5 text-xs text-muted-foreground">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </Text>
                )}

                {/* QuarterlyGoals under this annual goal */}
                {goal.quarterlyGoals && goal.quarterlyGoals.length > 0 && (
                  <View className="mt-3 gap-2 border-t border-border pt-3">
                    {goal.quarterlyGoals.map((quarterly: any) => (
                      <View key={quarterly.id} className="flex-row items-center gap-2">
                        <Icon
                          as={quarterly.status === 'completed' ? CheckCircle2 : ChevronRight}
                          size={14}
                          className={quarterly.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}
                        />
                        <Text
                          className={`flex-1 text-xs font-medium ${
                            quarterly.status === 'completed'
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        >
                          {quarterly.title}
                        </Text>
                        {quarterly.progress != null && (
                          <Text className="text-xs text-muted-foreground">{quarterly.progress}%</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Focus Links Row (Part 3) ───────────────────
function FocusLinksRow({ focusId }: { focusId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: links, isLoading } = useFocusLinks(focusId);

  const taskCount = links?.tasks?.length ?? 0;
  const habitCount = links?.habits?.length ?? 0;
  const total = taskCount + habitCount;

  if (isLoading || total === 0) return null;

  return (
    <View className="mt-3 border-t border-border pt-3">
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        className="flex-row items-center gap-2"
      >
        <Icon as={Link} size={12} className="text-muted-foreground" />
        <View className="flex-1 flex-row items-center gap-2">
          {taskCount > 0 && (
            <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
              <Icon as={ListChecks} size={10} className="text-primary" />
              <Text className="text-2xs font-medium text-primary">{taskCount} tasks</Text>
            </View>
          )}
          {habitCount > 0 && (
            <View className="flex-row items-center gap-1 rounded-full bg-info/10 px-2 py-0.5">
              <Icon as={Repeat2} size={10} className="text-info" />
              <Text className="text-2xs font-medium text-info">{habitCount} habits</Text>
            </View>
          )}
        </View>
        <Icon
          as={expanded ? ChevronUp : ChevronDown}
          size={14}
          className="text-muted-foreground"
        />
      </Pressable>

      {expanded && (
        <View className="mt-2 gap-1.5">
          {(links?.tasks ?? []).map((task) => (
            <View key={task.id} className="flex-row items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
              <Icon as={ListChecks} size={12} className="text-primary" />
              <Text className="flex-1 text-xs text-foreground" numberOfLines={1}>
                {task.title}
              </Text>
              {task.status === 'completed' && (
                <Icon as={CheckCircle2} size={12} className="text-green-500" />
              )}
            </View>
          ))}
          {(links?.habits ?? []).map((habit) => (
            <View key={habit.id} className="flex-row items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
              <Icon as={Repeat2} size={12} className="text-info" />
              <Text className="flex-1 text-xs text-foreground" numberOfLines={1}>
                {habit.title}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Quarterly Tab ─────────────────────────────
function QuarterlyTab({ t }: { t: (k: string) => string }) {
  const { data: weeklyGoals, isLoading } = useWeeklyGoals();
  const { data: quarterlyGoals } = useQuarterlyGoals();

  const getCurrentQuarter = () => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q} ${now.getFullYear()}`;
  };

  if (isLoading) return <LoadingOverlay />;

  const allQuarterlyGoals = quarterlyGoals ?? [];
  const activeQuarterlyGoals = (allQuarterlyGoals as any[]).filter((g) => g.status !== 'completed');
  const completedQuarterlyGoals = (allQuarterlyGoals as any[]).filter((g) => g.status === 'completed');

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Quarter header */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View className="mb-4 flex-row items-center gap-2">
          <Icon as={Calendar} size={18} className="text-primary" />
          <Text className="text-lg font-bold text-foreground">{getCurrentQuarter()}</Text>
        </View>
      </Animated.View>

      {/* Active QuarterlyGoals */}
      <Animated.View entering={FadeInDown.delay(50).duration(300)}>
        <Text className="mb-2 text-sm font-semibold text-foreground">
          Active Goals ({activeQuarterlyGoals.length})
        </Text>
        {activeQuarterlyGoals.length === 0 ? (
          <EmptyState
            icon={Crosshair}
            title="No active quarterly goals"
            description="Add quarterly goals under your annual goals to track progress."
          />
        ) : (
          <View className="gap-3">
            {activeQuarterlyGoals.map((goal: any) => (
              <View key={goal.id} className="rounded-xl border border-border bg-card p-4">
                <Text className="text-sm font-semibold text-foreground">{goal.title}</Text>
                {goal.description && (
                  <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                    {goal.description}
                  </Text>
                )}

                {/* Progress bar */}
                <View className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">Progress</Text>
                    <Text className="text-xs font-medium text-foreground">
                      {goal.progress ?? 0}%
                    </Text>
                  </View>
                  <View className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(goal.progress ?? 0, 100)}%` }}
                    />
                  </View>
                </View>

                {/* Key results */}
                {goal.keyResults && goal.keyResults.length > 0 && (
                  <View className="mt-3 gap-1.5 border-t border-border pt-3">
                    <Text className="text-xs font-medium text-muted-foreground">Key Results</Text>
                    {goal.keyResults.map((kr: any, idx: number) => (
                      <View key={idx} className="flex-row items-center gap-2">
                        <Icon
                          as={kr.completed ? CheckCircle2 : ChevronRight}
                          size={12}
                          className={kr.completed ? 'text-green-500' : 'text-muted-foreground'}
                        />
                        <Text className="flex-1 text-xs text-foreground">{kr.title}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* QuarterlyGoal Links (Part 3) */}
                <FocusLinksRow focusId={goal.id} />
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Completed QuarterlyGoals */}
      {completedQuarterlyGoals.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mt-6">
          <Text className="mb-2 text-sm font-semibold text-foreground">
            Completed ({completedQuarterlyGoals.length})
          </Text>
          <View className="gap-2">
            {completedQuarterlyGoals.slice(0, 5).map((goal: any) => (
              <View key={goal.id} className="flex-row items-center gap-2 rounded-xl border border-border bg-card/50 p-3">
                <Icon as={CheckCircle2} size={16} className="text-green-500" />
                <Text className="flex-1 text-sm text-muted-foreground line-through">
                  {goal.title}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Weekly Goals */}
      {weeklyGoals && (weeklyGoals as any[]).length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).duration(300)} className="mt-6">
          <Text className="mb-2 text-sm font-semibold text-foreground">
            Weekly Goals
          </Text>
          <View className="gap-2">
            {(weeklyGoals as any[]).map((wg: any) => (
              <View key={wg.id} className="flex-row items-center gap-2 rounded-xl border border-border bg-card p-3">
                <Icon
                  as={wg.status === 'completed' ? CheckCircle2 : Target}
                  size={16}
                  className={wg.status === 'completed' ? 'text-green-500' : 'text-primary'}
                />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{wg.title}</Text>
                  {wg.focusTitle && (
                    <Text className="text-xs text-muted-foreground">Focus: {wg.focusTitle}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ── Health Tab (Part 2) ────────────────────────
function ScoreCard({
  label,
  score,
  icon,
  color,
}: {
  label: string;
  score: number;
  icon: any;
  color: string;
}) {
  return (
    <View className="flex-1 items-center rounded-xl border border-border bg-card p-3">
      <View
        className="mb-2 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon as={icon} size={16} style={{ color }} />
      </View>
      <Text className="text-xl font-bold text-foreground">{score}</Text>
      <Text className="mt-0.5 text-center text-2xs text-muted-foreground">{label}</Text>
      <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

function HealthTab() {
  const { data: snapshots, isLoading, refetch } = useHealthSnapshots();
  const { mutate: createSnapshot, isPending } = useCreateHealthSnapshot();

  const latest: HealthSnapshot | undefined = snapshots?.[0] as HealthSnapshot | undefined;

  if (isLoading) return <LoadingOverlay />;

  if (!latest) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <EmptyState
          icon={Activity}
          title="Run your first health check"
          description="Generate a health snapshot to see how balanced your life areas are across finances, habits, tasks, and goals."
          actionLabel="Generate Health Report"
          onAction={() => createSnapshot()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Overall score ring */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View className="mb-6 items-center rounded-2xl border border-border bg-card py-6">
          <Text className="mb-4 text-sm font-semibold text-muted-foreground">Overall Health Score</Text>
          <View className="relative items-center justify-center">
            <ProgressRing
              progress={latest.overallScore / 100}
              size={120}
              strokeWidth={8}
              color="hsl(246, 97%, 52%)"
            />
            <View className="absolute items-center">
              <Text className="text-3xl font-bold text-foreground">{latest.overallScore}</Text>
              <Text className="text-xs text-muted-foreground">/ 100</Text>
            </View>
          </View>
          <Text className="mt-3 text-xs text-muted-foreground">
            {new Date(latest.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </Animated.View>

      {/* 2x2 score grid */}
      <Animated.View entering={FadeInDown.delay(60).duration(300)} className="mb-6">
        <Text className="mb-3 text-sm font-semibold text-foreground">Area Scores</Text>
        <View className="gap-3">
          <View className="flex-row gap-3">
            <ScoreCard
              label="Finances"
              score={latest.financesScore}
              icon={DollarSign}
              color="hsl(142, 71%, 45%)"
            />
            <ScoreCard
              label="Habits"
              score={latest.habitsScore}
              icon={Repeat2}
              color="hsl(217, 91%, 60%)"
            />
          </View>
          <View className="flex-row gap-3">
            <ScoreCard
              label="Tasks"
              score={latest.tasksScore}
              icon={ListChecks}
              color="hsl(38, 92%, 50%)"
            />
            <ScoreCard
              label="Goals"
              score={latest.goalsScore}
              icon={Target}
              color="hsl(246, 97%, 52%)"
            />
          </View>
        </View>
      </Animated.View>

      {/* Insights */}
      {latest.insights && latest.insights.length > 0 && (
        <Animated.View entering={FadeInDown.delay(120).duration(300)} className="mb-6">
          <View className="mb-3 flex-row items-center gap-2">
            <Icon as={Lightbulb} size={16} className="text-warning" />
            <Text className="text-sm font-semibold text-foreground">Insights</Text>
          </View>
          <View className="rounded-xl border border-border bg-card p-4 gap-2.5">
            {latest.insights.map((insight, idx) => (
              <View key={idx} className="flex-row items-start gap-2.5">
                <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
                <Text className="flex-1 text-sm leading-5 text-foreground">{insight}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Recommendations */}
      {latest.recommendations && latest.recommendations.length > 0 && (
        <Animated.View entering={FadeInDown.delay(180).duration(300)} className="mb-6">
          <View className="mb-3 flex-row items-center gap-2">
            <Icon as={Sparkles} size={16} className="text-primary" />
            <Text className="text-sm font-semibold text-foreground">Recommendations</Text>
          </View>
          <View className="rounded-xl border border-border bg-card p-4 gap-3">
            {latest.recommendations.map((rec, idx) => (
              <View key={idx} className="flex-row items-start gap-2.5">
                <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                  <Text className="text-2xs font-bold text-primary">{idx + 1}</Text>
                </View>
                <Text className="flex-1 text-sm leading-5 text-foreground">{rec}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Regenerate button */}
      <Animated.View entering={FadeInDown.delay(240).duration(300)}>
        <Button
          onPress={() => createSnapshot()}
          disabled={isPending}
          className="w-full"
        >
          <View className="flex-row items-center gap-2">
            <Icon as={Activity} size={16} className="text-primary-foreground" />
            <Text className="font-semibold text-primary-foreground">
              {isPending ? 'Generating...' : 'Generate Health Report'}
            </Text>
          </View>
        </Button>
      </Animated.View>
    </ScrollView>
  );
}
