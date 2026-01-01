// 1. Elite Design Tokens
const COLORS = {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#10b981',
    danger: '#f43f5e',
    bgDeep: '#0f172a',
    bgSurface: '#1e293b',
    textVibrant: '#f8fafc',
    textSoft: '#94a3b8',
    textDim: '#64748b',
    borderGlass: 'rgba(255, 255, 255, 0.1)',
};

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [memories, setMemories] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [view, setView] = useState('home'); // home, dashboard, profile
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([{ role: 'bot', content: 'Hello! I am your Echo Assistant. Ready to reconstruct.' }]);

    useEffect(() => {
        checkAuth();
        OfflineSync.init();
    }, []);

    const checkAuth = async () => {
        const token = await AsyncStorage.getItem('em_token');
        if (token) {
            setIsLoggedIn(true);
            loadMemories();
        }
    };

    const loadMemories = async () => {
        const local = await AsyncStorage.getItem('em_memories_cache');
        if (local) setMemories(JSON.parse(local));
        try {
            const data = await ApiClient.getMemories();
            setMemories(data);
            await AsyncStorage.setItem('em_memories_cache', JSON.stringify(data));
        } catch (e) {
            console.log("Offline mode: Using cached memories");
        }
    };

    const sendChat = async () => {
        if (!chatInput.trim()) return;
        const userMsg = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        try {
            const response = await ApiClient.chat(chatInput);
            setChatMessages(prev => [...prev, { role: 'bot', content: response.reply }]);
        } catch (e) {
            Alert.alert("Neural link error.");
        }
    };

    // --- Sub-Components ---
    const TopNav = () => (
        <View style={styles.topNav}>
            <Text style={styles.logoText}>EchoMemory</Text>
            <View style={styles.navLinks}>
                <TouchableOpacity onPress={() => setView('home')} style={styles.navItem}><Text style={[styles.navText, view === 'home' && styles.navActive]}>Home</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setView('dashboard')} style={styles.navItem}><Text style={[styles.navText, view === 'dashboard' && styles.navActive]}>Explorer</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setView('profile')} style={styles.navItem}><Text style={[styles.navText, view === 'profile' && styles.navActive]}>Identity</Text></TouchableOpacity>
            </View>
        </View>
    );

    const HeroSection = () => (
        <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Your Memories,{"\n"}Perfectly Reclaimed.</Text>
            <Text style={styles.heroSubtitle}>Neural link active. Your narrative reconstruction is synchronized and secure.</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => setView('dashboard')}>
                <Text style={styles.heroBtnText}>View Memory Stream</Text>
            </TouchableOpacity>
        </View>
    );

    const ChatbotOverlay = () => (
        <View style={styles.chatWindow}>
            <View style={styles.chatHeader}>
                <Text style={styles.chatHeaderTitle}>Assistant</Text>
                <TouchableOpacity onPress={() => setIsChatOpen(false)}><Text style={styles.closeChat}>&times;</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.chatMessages}>
                {chatMessages.map((m, i) => (
                    <View key={i} style={[styles.msg, m.role === 'user' ? styles.userMsg : styles.botMsg]}>
                        <Text style={styles.msgText}>{m.content}</Text>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
                <View style={styles.inputWrap}>
                    <Text style={styles.chatInputPlaceholder}>{chatInput ? '' : 'Type inquiry...'}</Text>
                    <TouchableOpacity style={{ width: '100%' }}>
                        {/* TextInput would go here, using View for simulation */}
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.sendBtn} onPress={sendChat}>
                    <Text style={styles.sendBtnText}>→</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!isLoggedIn) {
        return (
            <SafeAreaView style={styles.authContainer}>
                <Text style={styles.logoTextBig}>EchoMemory</Text>
                <Text style={styles.subtitle}>Synchronize your cognitive cloud.</Text>
                <TouchableOpacity style={styles.btnElite} onPress={() => setIsLoggedIn(true)}>
                    <Text style={styles.btnText}>Unlock Console</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TopNav />
            <ScrollView contentContainerStyle={styles.mainContent}>
                {view === 'home' && (
                    <View>
                        <HeroSection />
                        <View style={styles.statusGrid}>
                            <View style={styles.statusCard}>
                                <Text style={styles.cardLabel}>Neural Status</Text>
                                <Text style={styles.cardVal}>Active</Text>
                            </View>
                            <View style={styles.statusCard}>
                                <Text style={styles.cardLabel}>Encryption</Text>
                                <Text style={styles.cardVal}>AES-256</Text>
                            </View>
                        </View>
                    </View>
                )}

                {view === 'dashboard' && (
                    <View style={styles.dashboardView}>
                        <Text style={styles.viewTitle}>Memory Stream</Text>
                        {memories.map((m, i) => (
                            <View key={i} style={styles.memoryCard}>
                                <Text style={styles.memoryType}>{m.source_type.toUpperCase()}</Text>
                                <Text style={styles.memoryNarrative}>{m.narrative_text}</Text>
                                <View style={styles.confidenceBar}>
                                    <View style={[styles.confidenceFill, { width: `${m.confidence_score * 100}%` }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {view === 'profile' && (
                    <View style={styles.profileView}>
                        <Text style={styles.viewTitle}>Identity</Text>
                        <View style={styles.profileCard}>
                            <Text style={styles.profileName}>Narrative User</Text>
                            <Text style={styles.profileEmail}>user@echomemory.ai</Text>
                        </View>
                        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await AsyncStorage.clear(); setIsLoggedIn(false); }}>
                            <Text style={styles.logoutText}>Exit System</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Bubble & Assistant */}
            {!isChatOpen && (
                <TouchableOpacity style={styles.chatBubble} onPress={() => setIsChatOpen(true)}>
                    <Text style={{ fontSize: 24, color: 'white' }}>💬</Text>
                </TouchableOpacity>
            )}
            {isChatOpen && <ChatbotOverlay />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDeep },
    authContainer: { flex: 1, backgroundColor: COLORS.bgDeep, justifyContent: 'center', alignItems: 'center', padding: 30 },
    logoTextBig: { fontSize: 42, fontWeight: '900', color: COLORS.textVibrant, marginBottom: 10 },
    subtitle: { fontSize: 18, color: COLORS.textSoft, marginBottom: 40, textAlign: 'center' },
    btnElite: { backgroundColor: COLORS.primary, paddingVertical: 18, paddingHorizontal: 50, borderRadius: 20, shadowColor: COLORS.primary, shadowRadius: 20, shadowOpacity: 0.3 },
    btnText: { color: 'white', fontWeight: '800', fontSize: 18 },

    topNav: { height: 80, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.borderGlass, backgroundColor: COLORS.bgSurface },
    logoText: { fontSize: 20, fontWeight: '900', color: COLORS.textVibrant },
    navLinks: { flexDirection: 'row' },
    navItem: { marginLeft: 15 },
    navText: { color: COLORS.textSoft, fontWeight: '600' },
    navActive: { color: COLORS.primary },

    mainContent: { padding: 20 },
    heroSection: { paddingTop: 40, paddingBottom: 60, alignItems: 'center' },
    heroTitle: { fontSize: 32, fontWeight: '900', color: COLORS.textVibrant, textAlign: 'center', lineHeight: 40 },
    heroSubtitle: { fontSize: 16, color: COLORS.textSoft, textAlign: 'center', marginTop: 15, marginBottom: 30 },
    heroBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15 },
    heroBtnText: { color: 'white', fontWeight: '700' },

    statusGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statusCard: { width: '48%', backgroundColor: COLORS.bgSurface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderGlass },
    cardLabel: { fontSize: 12, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1 },
    cardVal: { fontSize: 18, fontWeight: '700', color: COLORS.textVibrant, marginTop: 5 },

    dashboardView: { paddingTop: 20 },
    viewTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textVibrant, marginBottom: 20 },
    memoryCard: { backgroundColor: COLORS.bgSurface, padding: 25, borderRadius: 25, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderGlass },
    memoryType: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginBottom: 10 },
    memoryNarrative: { fontSize: 16, color: COLORS.textVibrant, lineHeight: 24 },
    confidenceBar: { height: 4, backgroundColor: COLORS.bgDeep, borderRadius: 10, marginTop: 20 },
    confidenceFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 10 },

    profileView: { paddingTop: 20 },
    profileCard: { backgroundColor: COLORS.bgSurface, padding: 30, borderRadius: 25, borderWidth: 1, borderColor: COLORS.borderGlass, marginBottom: 30 },
    profileName: { fontSize: 24, fontWeight: '800', color: COLORS.textVibrant },
    profileEmail: { fontSize: 16, color: COLORS.textSoft, marginTop: 5 },
    logoutBtn: { padding: 20, alignItems: 'center' },
    logoutText: { color: COLORS.danger, fontWeight: '700' },

    chatBubble: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, backgroundColor: COLORS.primary, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowRadius: 15, shadowOpacity: 0.5 },
    chatWindow: { position: 'absolute', bottom: 100, right: 20, left: 20, top: 100, backgroundColor: COLORS.bgSurface, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderGlass },
    chatHeader: { padding: 20, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatHeaderTitle: { color: 'white', fontWeight: '900', fontSize: 18 },
    closeChat: { color: 'white', fontSize: 28 },
    chatMessages: { flex: 1, padding: 20 },
    msg: { maxWidth: '85%', padding: 15, borderRadius: 20, marginBottom: 15 },
    userMsg: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
    botMsg: { alignSelf: 'flex-start', backgroundColor: COLORS.bgDeep, borderWidth: 1, borderColor: COLORS.borderGlass },
    msgText: { color: 'white' },
    chatInputRow: { padding: 15, flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: COLORS.borderGlass },
    inputWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', height: 50, borderRadius: 15, justifyContent: 'center', paddingHorizontal: 15 },
    chatInputPlaceholder: { color: COLORS.textDim },
    sendBtn: { width: 50, height: 50, backgroundColor: COLORS.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    sendBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});

export default App;
