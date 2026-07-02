import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, X, ScanLine, Check } from "lucide-react-native";
import { colors } from "@/constants/colors";

type LineItem = { id: number; name: string; date: string; amount: number };
type Category = { id: number; name: string; budget: number; items: LineItem[] };
type IncomeSource = { id: number; name: string; amount: number };
type ReceiptItem = {
  id: number;
  raw: string;
  resolvedName: string;
  price: number | null;
  status: "known" | "ai_guess" | "unknown";
  category: string;
};

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "Housing", budget: 0, items: [] },
  { id: 2, name: "Food", budget: 0, items: [] },
  { id: 3, name: "Insurance", budget: 0, items: [] },
  { id: 4, name: "Savings", budget: 0, items: [] },
  { id: 5, name: "Transportation", budget: 0, items: [] },
  { id: 6, name: "Personal", budget: 0, items: [] },
  { id: 7, name: "Recreation", budget: 0, items: [] },
  { id: 8, name: "Utilities", budget: 0, items: [] },
  { id: 9, name: "Giving", budget: 0, items: [] },
  { id: 10, name: "Miscellaneous", budget: 0, items: [] },
];

const INITIAL_INCOME: IncomeSource[] = [];

// Placeholder data shown while the receipt-scanning feature isn't wired up
// to real OCR yet. Swap this out once /scan produces real ReceiptItem[].
const MOCK_RECEIPT_ITEMS: ReceiptItem[] = [
  { id: 1, raw: "TRDR MKT ORG EGGS", resolvedName: "Organic Eggs", price: 5.49, status: "known", category: "Food" },
  { id: 2, raw: "TRDR MKT OJ 64OZ", resolvedName: "Orange Juice", price: 4.29, status: "known", category: "Food" },
  { id: 3, raw: "GRANBAR CHOC 6PK", resolvedName: "Granola Bars", price: 2.72, status: "ai_guess", category: "Food" },
  { id: 4, raw: "MISC 0294", resolvedName: "", price: null, status: "unknown", category: "Miscellaneous" },
];

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [income] = useState<IncomeSource[]>(INITIAL_INCOME);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editNames, setEditNames] = useState<Record<number, string>>({});
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[] | undefined>(undefined);

  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalSpent = categories.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.amount, 0), 0);
  const remaining = totalIncome - totalSpent;

  function toggleExpand(id: number) {
    if (editMode) return;
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function enterEdit() {
    const names: Record<number, string> = {};
    categories.forEach((c) => { names[c.id] = c.name; });
    setEditNames(names);
    setEditMode(true);
    setExpanded([]);
  }

  function saveEdit() {
    setCategories((prev) =>
      prev.map((c) => ({ ...c, name: editNames[c.id] ?? c.name }))
    );
    setEditMode(false);
    setAddingCat(false);
    setNewCatName("");
  }

  function deleteCategory(id: number) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setEditNames((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    const id = Date.now();
    setCategories((prev) => [...prev, { id, name: newCatName.trim(), budget: 0, items: [] }]);
    setEditNames((prev) => ({ ...prev, [id]: newCatName.trim() }));
    setNewCatName("");
    setAddingCat(false);
  }

  function openReceiptScan() {
    setReceiptItems(MOCK_RECEIPT_ITEMS);
    setShowReceipt(true);
  }

  function confirmReceipt() {
    setShowReceipt(false);
    setReceiptItems(undefined);
  }

  const catSpent = (cat: Category) => cat.items.reduce((s, i) => s + i.amount, 0);
  const isOver = (cat: Category) => catSpent(cat) > cat.budget && cat.budget > 0;

  // ── BUDGET SCREEN ──────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>This month</Text>
              {editMode ? (
                <Pressable style={styles.doneButton} onPress={saveEdit}>
                  <Check size={11} strokeWidth={2.5} color={colors.primaryForeground} />
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.editButton} onPress={enterEdit}>
                  <Pencil size={11} strokeWidth={2} color={colors.foreground} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>
              )}
            </View>

            {/* Income section */}
            <View style={styles.incomeCard}>
              <Text style={styles.incomeLabel}>Income</Text>
              {income.map((src) => (
                <View key={src.id} style={styles.incomeRow}>
                  <Text style={styles.incomeRowText}>{src.name}</Text>
                  <Text style={styles.incomeRowAmount}>{fmt(src.amount)}</Text>
                </View>
              ))}
              <View style={styles.incomeTotalRow}>
                <Text style={styles.incomeTotalLabel}>Total</Text>
                <Text style={styles.incomeTotalAmount}>{fmt(totalIncome)}</Text>
              </View>
            </View>

            {/* Categories label */}
            <Text style={styles.sectionLabel}>Categories</Text>

            {/* Category list */}
            <View style={styles.categoryList}>
              {categories.map((cat) => {
                const s = catSpent(cat);
                const over = isOver(cat);
                const isOpen = expanded.includes(cat.id);

                if (editMode) {
                  return (
                    <View key={cat.id} style={styles.editRow}>
                      <TextInput
                        value={editNames[cat.id] ?? cat.name}
                        onChangeText={(text) =>
                          setEditNames((prev) => ({ ...prev, [cat.id]: text }))
                        }
                        style={styles.editRowInput}
                      />
                      <Pressable
                        onPress={() => deleteCategory(cat.id)}
                        hitSlop={8}
                        style={styles.editRowDelete}
                      >
                        <Trash2 size={13} strokeWidth={1.8} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  );
                }

                return (
                  <View key={cat.id}>
                    <Pressable
                      onPress={() => toggleExpand(cat.id)}
                      style={[
                        styles.categoryRow,
                        over
                          ? styles.categoryRowOver
                          : isOpen
                          ? styles.categoryRowOpen
                          : styles.categoryRowClosed,
                      ]}
                    >
                      <Text style={[styles.categoryName, over && styles.textDestructive]}>
                        {cat.name}
                        {over ? " *" : ""}
                      </Text>
                      <View style={styles.categoryRowRight}>
                        <View style={styles.categoryAmounts}>
                          <Text style={[styles.categoryAmount, over && styles.textDestructive]}>
                            {fmt(s)}
                          </Text>
                          <Text style={[styles.categoryBudget, over && styles.textDestructiveMuted]}>
                            {" "}/ {fmt(cat.budget)}
                          </Text>
                        </View>
                        {cat.items.length > 0 &&
                          (isOpen ? (
                            <ChevronUp size={12} color={colors.mutedForeground} />
                          ) : (
                            <ChevronDown size={12} color={colors.mutedForeground} />
                          ))}
                      </View>
                    </Pressable>

                    {isOpen && cat.items.length > 0 && (
                      <View style={styles.itemsPanel}>
                        {cat.items.map((item, idx) => (
                          <View
                            key={item.id}
                            style={[
                              styles.itemRow,
                              idx > 0 && styles.itemRowDivider,
                            ]}
                          >
                            <Text style={styles.itemRowText}>
                              {item.name}
                              <Text style={styles.itemRowDot}> · </Text>
                              {item.date}
                            </Text>
                            <Text style={styles.itemRowText}>{fmt(item.amount)}</Text>
                          </View>
                        ))}
                        <Pressable style={styles.addItemButton}>
                          <Plus size={10} strokeWidth={2.5} color={colors.mutedForeground} />
                          <Text style={styles.addItemButtonText}>Add item</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Add category row — edit mode */}
              {editMode &&
                (addingCat ? (
                  <View style={styles.addCatRow}>
                    <TextInput
                      autoFocus
                      value={newCatName}
                      onChangeText={setNewCatName}
                      onSubmitEditing={addCategory}
                      placeholder="Category name"
                      placeholderTextColor={colors.mutedForeground}
                      style={styles.addCatInput}
                    />
                    <Pressable onPress={addCategory}>
                      <Text style={styles.addCatConfirm}>Add</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { setAddingCat(false); setNewCatName(""); }}
                      hitSlop={8}
                    >
                      <X size={13} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.addCatButton} onPress={() => setAddingCat(true)}>
                    <Plus size={12} strokeWidth={2} color={colors.mutedForeground} />
                    <Text style={styles.addCatButtonText}>Add category</Text>
                  </Pressable>
                ))}

              {/* Remaining row */}
              {!editMode && (
                <View style={styles.remainingRow}>
                  <Text style={styles.remainingLabel}>Remaining after categories</Text>
                  <Text style={[styles.remainingAmount, remaining < 0 && styles.textDestructive]}>
                    {remaining < 0
                      ? `${fmt(Math.abs(remaining))} over`
                      : fmt(remaining)}
                  </Text>
                </View>
              )}
            </View>

            {/* Scan receipt button */}
            {!editMode && (
              <Pressable style={styles.scanButton} onPress={openReceiptScan}>
                <ScanLine size={15} color={colors.primaryForeground} />
                <Text style={styles.scanButtonText}>Scan receipt</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* ── RECEIPT MODAL ─────────────────────────────────────────────────── */}
        <Modal
          visible={showReceipt}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReceipt(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowReceipt(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Review receipt</Text>
                <Pressable onPress={() => setShowReceipt(false)} hitSlop={8}>
                  <X size={15} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <Text style={styles.modalSubtitle}>
                {"Trader's Market · $12.50 · 4 items"}
              </Text>

              {/* Scrollable item list */}
              <ScrollView style={styles.modalList}>
                {(receiptItems ?? []).map((item) => {
                  if (item.status === "known") {
                    return (
                      <View key={item.id} style={styles.knownItem}>
                        <View>
                          <Text style={styles.knownItemName}>{item.resolvedName}</Text>
                          <Text style={styles.knownItemMeta}>{item.category} · recognized</Text>
                        </View>
                        <Text style={styles.knownItemPrice}>
                          {item.price != null ? `$${item.price.toFixed(2)}` : "—"}
                        </Text>
                      </View>
                    );
                  }

                  if (item.status === "ai_guess") {
                    return (
                      <View key={item.id} style={styles.guessItem}>
                        <View style={styles.guessItemTop}>
                          <View style={styles.guessItemMain}>
                            <Text style={styles.guessItemRaw} numberOfLines={1}>
                              {`"${item.raw}"`}
                            </Text>
                            <TextInput
                              value={item.resolvedName}
                              onChangeText={(text) =>
                                setReceiptItems((prev) =>
                                  prev?.map((r) =>
                                    r.id === item.id ? { ...r, resolvedName: text } : r
                                  )
                                )
                              }
                              style={styles.guessItemInput}
                            />
                          </View>
                          <Text style={styles.guessItemPrice}>
                            {item.price != null ? `$${item.price.toFixed(2)}` : "—"}
                          </Text>
                        </View>
                        <View style={styles.guessItemBottom}>
                          <Text style={styles.guessItemLabel}>AI guess · category:</Text>
                          <CategoryPicker
                            categories={categories}
                            value={item.category}
                            onChange={(value) =>
                              setReceiptItems((prev) =>
                                prev?.map((r) => (r.id === item.id ? { ...r, category: value } : r))
                              )
                            }
                            variant="warn"
                          />
                        </View>
                      </View>
                    );
                  }

                  // unknown
                  return (
                    <View key={item.id} style={styles.unknownItem}>
                      <View style={styles.guessItemTop}>
                        <View style={styles.guessItemMain}>
                          <Text style={styles.guessItemRaw} numberOfLines={1}>
                            {`"${item.raw}"`}
                          </Text>
                          <TextInput
                            value={item.resolvedName}
                            onChangeText={(text) =>
                              setReceiptItems((prev) =>
                                prev?.map((r) =>
                                  r.id === item.id ? { ...r, resolvedName: text } : r
                                )
                              )
                            }
                            placeholder="Unidentified"
                            placeholderTextColor={colors.mutedForeground}
                            style={styles.unknownItemInput}
                          />
                        </View>
                        <Text style={styles.unknownItemPrice}>—</Text>
                      </View>
                      <View style={styles.guessItemBottom}>
                        <Text style={styles.unknownItemLabel}>No guess · category:</Text>
                        <CategoryPicker
                          categories={categories}
                          value={item.category}
                          onChange={(value) =>
                            setReceiptItems((prev) =>
                              prev?.map((r) => (r.id === item.id ? { ...r, category: value } : r))
                            )
                          }
                          variant="over"
                        />
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <Text style={styles.modalFootnote}>
                Items left blank save as &quot;unidentified&quot;
              </Text>
              <Pressable style={styles.primaryButton} onPress={confirmReceipt}>
                <Text style={styles.primaryButtonText}>Confirm and save</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Native dropdown for picking a category (Android: compact dropdown;
// iOS: inline wheel — swap for a modal-based picker if that's too tall).
function CategoryPicker({
  categories,
  value,
  onChange,
  variant,
}: {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  variant: "warn" | "over";
}) {
  return (
    <View
      style={[
        styles.categoryPicker,
        variant === "warn" ? styles.categoryPickerWarn : styles.categoryPickerOver,
      ]}
    >
      <Picker
        selectedValue={value}
        onValueChange={(itemValue) => onChange(itemValue)}
        mode="dropdown"
        dropdownIconColor={colors.mutedForeground}
        style={styles.categoryPickerControl}
        itemStyle={styles.categoryPickerItem}
      >
        {categories.map((c) => (
          <Picker.Item key={c.id} label={c.name} value={c.name} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 28, paddingBottom: 48 },
  content: { width: "100%", maxWidth: 320, alignSelf: "center" },

  primaryButton: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 2,
  },
  primaryButtonText: { fontSize: 13, fontWeight: "500", color: colors.primaryForeground },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  doneButtonText: { fontSize: 11, fontWeight: "500", color: colors.primaryForeground },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: { fontSize: 11, fontWeight: "500", color: colors.foreground },

  incomeCard: {
    borderWidth: 1,
    borderColor: colors.incomeBorder,
    backgroundColor: colors.incomeBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  incomeLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.incomeText,
    marginBottom: 10,
  },
  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  incomeRowText: { fontSize: 13, color: colors.foreground },
  incomeRowAmount: { fontSize: 13, fontWeight: "500", color: colors.foreground },
  incomeTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.incomeBorder,
    marginTop: 10,
    paddingTop: 8,
  },
  incomeTotalLabel: { fontSize: 13, fontWeight: "500", color: colors.incomeText },
  incomeTotalAmount: { fontSize: 13, fontWeight: "600", color: colors.incomeText },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.mutedForeground,
    marginBottom: 10,
  },

  categoryList: { gap: 6 },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editRowInput: {
    flex: 1,
    fontSize: 13,
    color: colors.foreground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 2,
  },
  editRowDelete: { padding: 4 },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryRowClosed: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  categoryRowOpen: {
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.card,
  },
  categoryRowOver: {
    borderWidth: 1,
    borderColor: colors.overBorder,
    backgroundColor: colors.overBg,
    borderRadius: 12,
  },
  categoryName: { fontSize: 13, fontWeight: "500", color: colors.foreground },
  categoryRowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryAmounts: { flexDirection: "row", alignItems: "baseline" },
  categoryAmount: { fontSize: 13, fontWeight: "500", color: colors.foreground },
  categoryBudget: { fontSize: 11, color: colors.mutedForeground },

  textDestructive: { color: colors.destructive },
  textDestructiveMuted: { color: colors.destructive, opacity: 0.6 },

  itemsPanel: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  itemRowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  itemRowText: { fontSize: 12, color: colors.mutedForeground },
  itemRowDot: { color: colors.border },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
    paddingBottom: 2,
  },
  addItemButtonText: { fontSize: 11, color: colors.mutedForeground },

  addCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  addCatInput: { flex: 1, fontSize: 13, color: colors.foreground },
  addCatConfirm: { fontSize: 11, fontWeight: "500", color: colors.foreground },
  addCatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addCatButtonText: { fontSize: 12, color: colors.mutedForeground },

  remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  remainingLabel: { fontSize: 11, color: colors.mutedForeground },
  remainingAmount: { fontSize: 13, fontWeight: "500", color: colors.foreground },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  scanButtonText: { fontSize: 13, fontWeight: "500", color: colors.primaryForeground },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  modalTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  modalSubtitle: { fontSize: 11, color: colors.mutedForeground, marginBottom: 12 },
  modalList: { maxHeight: 288 },
  modalFootnote: {
    fontSize: 10,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 12,
  },

  knownItem: {
    borderWidth: 1,
    borderColor: colors.incomeBorder,
    backgroundColor: colors.incomeBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  knownItemName: { fontSize: 13, fontWeight: "500", color: colors.foreground },
  knownItemMeta: { fontSize: 10, color: colors.incomeText },
  knownItemPrice: { fontSize: 13, fontWeight: "500", color: colors.foreground },

  guessItem: {
    borderWidth: 1,
    borderColor: colors.warnBorder,
    backgroundColor: colors.warnBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  guessItemTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  guessItemMain: { flex: 1, minWidth: 0 },
  guessItemRaw: { fontSize: 10, color: colors.mutedForeground, marginBottom: 4 },
  guessItemInput: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.foreground,
    borderBottomWidth: 1,
    borderBottomColor: colors.warnBorder,
    paddingBottom: 2,
  },
  guessItemPrice: { fontSize: 13, fontWeight: "500", color: colors.foreground, marginLeft: 12, marginTop: 16 },
  guessItemBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  guessItemLabel: { fontSize: 10, color: colors.warnText },

  unknownItem: {
    borderWidth: 1,
    borderColor: colors.overBorder,
    backgroundColor: colors.overBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  unknownItemInput: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.foreground,
    borderBottomWidth: 1,
    borderBottomColor: colors.overBorder,
    paddingBottom: 2,
  },
  unknownItemPrice: { fontSize: 13, color: colors.mutedForeground, marginLeft: 12, marginTop: 16 },
  unknownItemLabel: { fontSize: 10, color: colors.destructive, opacity: 0.7 },

  categoryPicker: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: "center",
    overflow: "hidden",
  },
  categoryPickerWarn: { borderColor: colors.warnBorder },
  categoryPickerOver: { borderColor: colors.overBorder },
  categoryPickerControl: { height: 32, color: colors.foreground },
  categoryPickerItem: { fontSize: 13, color: colors.foreground },
});
