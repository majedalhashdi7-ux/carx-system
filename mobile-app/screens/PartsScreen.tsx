// screens/PartsScreen.tsx - شاشة تصفح وطلب قطع الغيار للجوال
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, Image,
    StatusBar, Dimensions, Linking, Modal, ScrollView
} from 'react-native';
import { api } from '../lib/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Part {
    _id: string;
    name: string;
    nameAr?: string;
    partNumber?: string;
    category?: string;
    partType?: string;
    price: number;
    inStock?: boolean;
    stockQty?: number;
    carMake?: string;
    carModel?: string;
    img?: string;
    image?: string;
    images?: string[];
    description?: string;
}

const CATEGORIES = [
    { key: 'all', label: 'الجميع' },
    { key: 'Engine', label: 'المحركات' },
    { key: 'Brakes', label: 'الفرامل' },
    { key: 'Electrical', label: 'الكهرباء' },
    { key: 'Filters', label: 'الفلاتر' },
    { key: 'Body', label: 'الهيكل' },
];

export default function PartsScreen() {
    const [parts, setParts] = useState<Part[]>([]);
    const [filtered, setFiltered] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);

    useEffect(() => { loadParts(); }, []);

    useEffect(() => {
        filterParts();
    }, [parts, search, selectedCategory]);

    async function loadParts() {
        try {
            const res = await api.parts.getAll({ limit: '50' });
            const list = res.data?.parts || res.parts || res.data || [];
            setParts(list);
        } catch {
            setParts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function filterParts() {
        let list = [...parts];
        if (selectedCategory !== 'all') {
            list = list.filter(p => p.category === selectedCategory || p.partType === selectedCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.nameAr?.toLowerCase().includes(q) ||
                p.partNumber?.toLowerCase().includes(q) ||
                p.carMake?.toLowerCase().includes(q)
            );
        }
        setFiltered(list);
    }

    const formatPrice = (p: number) =>
        p ? p.toLocaleString('ar-SA') + ' ر.س' : 'اتصل للسعر';

    const handleOrderWhatsApp = (part: Part) => {
        const message = `مرحباً HM CAR، أرغب في طلب قطعة الغيار التالية:\n📌 الاسم: ${part.name}\n🔢 رقم القطعة: ${part.partNumber || '—'}\n💰 السعر: ${formatPrice(part.price)}`;
        const whatsappUrl = `https://wa.me/966500000000?text=${encodeURIComponent(message)}`;
        Linking.openURL(whatsappUrl).catch(() => {});
    };

    const renderPart = useCallback(({ item }: { item: Part }) => {
        const imageUri = item.img || item.image || (item.images && item.images[0]);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelectedPart(item)}
            >
                <View style={styles.imageContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.partImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.noImageBox}>
                            <Text style={styles.noImageEmoji}>⚙️</Text>
                        </View>
                    )}
                    {item.inStock !== false ? (
                        <View style={styles.stockBadge}>
                            <Text style={styles.stockBadgeText}>متوفر</Text>
                        </View>
                    ) : (
                        <View style={styles.outOfStockBadge}>
                            <Text style={styles.outOfStockText}>نفذت الكمية</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.partName} numberOfLines={1}>{item.nameAr || item.name}</Text>
                    {item.partNumber && (
                        <Text style={styles.partNumber} numberOfLines={1}>#{item.partNumber}</Text>
                    )}
                    <View style={styles.priceRow}>
                        <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
                        <TouchableOpacity
                            style={styles.orderBtn}
                            onPress={() => handleOrderWhatsApp(item)}
                        >
                            <Text style={styles.orderBtnText}>طلب</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>⚙️ HM CAR</Text>
                    </View>
                    <Text style={styles.headerTitle}>قطع الغيار والأكسسوارات</Text>
                </View>
                <Text style={styles.headerSubtitle}>قطع أصلية ومضمونة مع شحن لكافة المناطق</Text>

                {/* Search Input */}
                <View style={styles.searchBox}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="ابحث باسم القطعة أو رقمها أو الماركة..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={search}
                        onChangeText={setSearch}
                        textAlign="right"
                    />
                    <Text style={styles.searchIcon}>🔍</Text>
                </View>

                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.key}
                            style={[styles.catChip, selectedCategory === cat.key && styles.catChipActive]}
                            onPress={() => setSelectedCategory(cat.key)}
                        >
                            <Text style={[styles.catText, selectedCategory === cat.key && styles.catTextActive]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Parts List */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#c9a96e" />
                    <Text style={styles.loadingText}>جاري تحميل قطع الغيار...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id}
                    renderItem={renderPart}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadParts(); }}
                            tintColor="#c9a96e"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyEmoji}>📦</Text>
                            <Text style={styles.emptyTitle}>لا توجد قطع غيار مطابقة</Text>
                            <Text style={styles.emptySub}>جرب البحث باسم آخر أو اختيار فئة مختلفة</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal */}
            {selectedPart && (
                <Modal visible={!!selectedPart} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPart(null)}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>

                            <ScrollView>
                                <View style={styles.modalImageContainer}>
                                    {selectedPart.img || selectedPart.image ? (
                                        <Image source={{ uri: selectedPart.img || selectedPart.image }} style={styles.modalImage} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.modalNoImage}>
                                            <Text style={{ fontSize: 40 }}>⚙️</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.modalTitle}>{selectedPart.nameAr || selectedPart.name}</Text>
                                {selectedPart.partNumber && (
                                    <Text style={styles.modalPartNum}>رقم القطعة: #{selectedPart.partNumber}</Text>
                                )}

                                <View style={styles.modalPriceBox}>
                                    <Text style={styles.modalPrice}>{formatPrice(selectedPart.price)}</Text>
                                    <Text style={styles.modalStock}>
                                        {selectedPart.inStock !== false ? '✅ متوفر بالمخزون' : '❌ غير متوفر'}
                                    </Text>
                                </View>

                                {selectedPart.description ? (
                                    <View style={styles.descBox}>
                                        <Text style={styles.descTitle}>التفاصيل والمواصفات</Text>
                                        <Text style={styles.descText}>{selectedPart.description}</Text>
                                    </View>
                                ) : null}

                                <TouchableOpacity
                                    style={styles.modalOrderBtn}
                                    onPress={() => {
                                        const p = selectedPart;
                                        setSelectedPart(null);
                                        handleOrderWhatsApp(p);
                                    }}
                                >
                                    <Text style={styles.modalOrderBtnText}>💬 طلب القطعة عبر الواتساب</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#09090b', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    headerBadge: { backgroundColor: 'rgba(201,169,110,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
    headerBadgeText: { color: '#c9a96e', fontSize: 10, fontWeight: '800' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
    headerSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'right', marginBottom: 12 },
    searchBox: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, height: 44, marginBottom: 10 },
    searchInput: { flex: 1, color: '#fff', fontSize: 12 },
    searchIcon: { fontSize: 14, marginLeft: 8 },
    catScroll: { marginTop: 4 },
    catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    catChipActive: { backgroundColor: '#c9a96e', borderColor: '#c9a96e' },
    catText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
    catTextActive: { color: '#000', fontWeight: '900' },
    columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
    listContent: { paddingTop: 16, paddingBottom: 100 },
    card: { width: CARD_WIDTH, backgroundColor: '#0e0e11', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
    imageContainer: { width: '100%', height: 110, backgroundColor: '#18181b', position: 'relative' },
    partImage: { width: '100%', height: '100%' },
    noImageBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    noImageEmoji: { fontSize: 32 },
    stockBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
    stockBadgeText: { color: '#4ade80', fontSize: 9, fontWeight: '800' },
    outOfStockBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    outOfStockText: { color: '#f87171', fontSize: 9, fontWeight: '800' },
    cardContent: { padding: 10 },
    partName: { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 2 },
    partNumber: { color: 'rgba(255,255,255,0.3)', fontSize: 9, textAlign: 'right' },
    priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    priceText: { color: '#c9a96e', fontSize: 11, fontWeight: '900' },
    orderBtn: { backgroundColor: 'rgba(201,169,110,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
    orderBtnText: { color: '#c9a96e', fontSize: 10, fontWeight: '800' },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 },
    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
    emptySub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#121215', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    closeBtn: { alignSelf: 'flex-start', padding: 8 },
    closeBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 18 },
    modalImageContainer: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: '#000' },
    modalImage: { width: '100%', height: '100%' },
    modalNoImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'right' },
    modalPartNum: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'right', marginTop: 4 },
    modalPriceBox: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12 },
    modalPrice: { color: '#c9a96e', fontSize: 18, fontWeight: '900' },
    modalStock: { color: '#4ade80', fontSize: 12, fontWeight: '700' },
    descBox: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, marginBottom: 20 },
    descTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
    descText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 18, textAlign: 'right' },
    modalOrderBtn: { backgroundColor: '#c9a96e', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 20 },
    modalOrderBtnText: { color: '#000', fontSize: 14, fontWeight: '900' },
});
