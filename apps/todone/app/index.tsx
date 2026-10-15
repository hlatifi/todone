import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import {
  CreateTaskInteractor,
  ListTasksInteractor,
  ToggleTaskInteractor,
  TaskItemDTO,
  CreateTaskResponseDTO,
  ListTasksResponseDTO,
  ToggleTaskResponseDTO,
} from "@todone/core";
import { InMemoryTaskGateway } from "@todone/adapters";

// Singleton gateway instance for in-memory session persistence
const taskGateway = new InMemoryTaskGateway();
const listTasksInteractor = new ListTasksInteractor(taskGateway);
const createTaskInteractor = new CreateTaskInteractor(taskGateway);
const toggleTaskInteractor = new ToggleTaskInteractor(taskGateway);

type FilterType = "all" | "active" | "completed";

export default function HomeScreen() {
  const [tasks, setTasks] = useState<TaskItemDTO[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    listTasksInteractor.execute(
      { filter: "all" },
      {
        presentSuccess(response: ListTasksResponseDTO) {
          setTasks(response.tasks);
          setLoading(false);
          setErrorMessage(null);
        },
        presentError(error: Error) {
          setErrorMessage(error.message);
          setLoading(false);
        },
      }
    );
  }, []);

  useEffect(() => {
    // Seed initial demo tasks on first load if empty
    taskGateway.findAll().then((existing) => {
      if (existing.length === 0) {
        createTaskInteractor.execute(
          {
            title: "Scaffold Clean Architecture Monorepo",
            description: "packages/core + packages/adapters setup",
          },
          {
            presentSuccess() {
              createTaskInteractor.execute(
                {
                  title: "Initialize Expo Router Client",
                  description: "apps/todone with iOS, Android & PWA support",
                },
                {
                  presentSuccess() {
                    fetchTasks();
                  },
                  presentError() {
                    fetchTasks();
                  },
                }
              );
            },
            presentError() {
              fetchTasks();
            },
          }
        );
      } else {
        fetchTasks();
      }
    });
  }, [fetchTasks]);

  const handleCreateTask = useCallback(() => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setErrorMessage(null);

    createTaskInteractor.execute(
      { title: trimmed },
      {
        presentSuccess(_response: CreateTaskResponseDTO) {
          setNewTitle("");
          setSubmitting(false);
          fetchTasks();
        },
        presentError(error: Error) {
          setErrorMessage(error.message);
          setSubmitting(false);
        },
      }
    );
  }, [newTitle, fetchTasks]);

  const handleToggleTask = useCallback(
    (id: string) => {
      toggleTaskInteractor.execute(
        { id },
        {
          presentSuccess(_response: ToggleTaskResponseDTO) {
            fetchTasks();
          },
          presentError(error: Error) {
            setErrorMessage(error.message);
          },
        }
      );
    },
    [fetchTasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    });
  }, [tasks, filter]);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  const platformLabel = Platform.select({
    ios: "iOS Native",
    android: "Android Native",
    web: "Web PWA",
    default: "Native",
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <View style={styles.badgeRow}>
            <View style={styles.platformBadge}>
              <Text style={styles.platformBadgeText}>{platformLabel}</Text>
            </View>
            <View style={styles.archBadge}>
              <Text style={styles.archBadgeText}>Clean Architecture</Text>
            </View>
          </View>
          <Text style={styles.heading}>Organize your focus.</Text>
          <Text style={styles.subheading}>
            Decoupled domain use cases driving cross-platform UI.
          </Text>
        </View>

        {/* Metrics Bar */}
        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalCount}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: "#38bdf8" }]}>
              {activeCount}
            </Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: "#4ade80" }]}>
              {completedCount}
            </Text>
            <Text style={styles.metricLabel}>Done</Text>
          </View>
        </View>

        {/* Input Form */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="What needs to be done?"
            placeholderTextColor="#64748b"
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={handleCreateTask}
            returnKeyType="done"
            editable={!submitting}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              (!newTitle.trim() || submitting) && styles.addButtonDisabled,
            ]}
            onPress={handleCreateTask}
            disabled={!newTitle.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Filters */}
        <View style={styles.filterRow}>
          {(["all", "active", "completed"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.filterTab,
                filter === mode && styles.filterTabActive,
              ]}
              onPress={() => setFilter(mode)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === mode && styles.filterTabTextActive,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task List */}
        {loading && tasks.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tasks in this view</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.taskItem,
                  item.completed && styles.taskItemCompleted,
                ]}
                onPress={() => handleToggleTask(item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.completed && styles.checkboxCompleted,
                  ]}
                >
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.taskTextWrapper}>
                  <Text
                    style={[
                      styles.taskTitle,
                      item.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text style={styles.taskDescription}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Architecture Proof Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            @todone/core ➔ @todone/adapters ➔ apps/todone
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  content: {
    flex: 1,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroSection: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  platformBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  platformBadgeText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "600",
  },
  archBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  archBadgeText: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "600",
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  metricsCard: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20,
    alignItems: "center",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f8fafc",
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#1f2937",
  },
  inputContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f8fafc",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  errorBanner: {
    backgroundColor: "#7f1d1d",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: "#1e293b",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  filterTabTextActive: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 24,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 10,
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  taskTextWrapper: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    color: "#f8fafc",
    fontWeight: "500",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
  },
  taskDescription: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  footer: {
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  footerText: {
    fontSize: 11,
    color: "#475569",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
