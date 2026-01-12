import { childAPI } from "@/service/childAPI";
import { reportAPI } from "@/service/reportAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const StatItem = ({ color, icon, label, value }) => {
  return (
    <View style={[styles.statItem, { backgroundColor: color }]}>
      <View style={styles.statIcon}>{icon}</View>
      <View style={styles.statTextBox}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
};

const ProfileReportScreen = () => {
  const router = useRouter();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [reportsByChild, setReportsByChild] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const selectChild = async (childId, listOverride) => {
    const list = listOverride || children;
    if (!list.length || !childId) return;

    setActiveChildId(childId);
    await AsyncStorage.setItem("childId", String(childId));

    if (!reportsByChild[childId]) {
      try {
        const data = await reportAPI.getChildReport(childId);
        setReportsByChild((prev) => ({
          ...prev,
          [childId]: data || null,
        }));
      } catch (error) {
        console.error("change child report error:", error);
      }
    }
  };

  const loadChildrenAndReport = async () => {
    try {
      setLoading(true);
      const list = await childAPI.getChild();
      setChildren(list);

      let childId = activeChildId;
      if (!childId && list.length > 0) {
        childId = list[0].mrid;
      }
      if (childId) {
        await selectChild(childId, list);
      }
    } catch (error) {
      console.error("loadChildrenAndReport error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildrenAndReport();
  }, []);

  const displayChild = (() => {
    if (!children.length || !activeChildId) return null;
    return children.find((c) => c.mrid === activeChildId) || children[0];
  })();

  const report = activeChildId ? reportsByChild[activeChildId] : null;

  const formatJoined = (joinedDate) => {
    if (!joinedDate) return "--/----";
    const d = new Date(joinedDate);
    if (Number.isNaN(d.getTime())) return "--/----";
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${month.toString().padStart(2, "0")}/${year}`;
  };

  const joinedDisplay = formatJoined(
    report?.joinedDate || displayChild?.createdDate
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F9FF" }}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require("../../assets/icons/Arrow-left.png")} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Báo cáo học tập</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Child info card */}
        <View style={styles.childCard}>
          <View style={styles.childRow}>
            <View style={styles.childAvatarWrapper}>
              <Image
                style={styles.childAvatar}
                source={
                  displayChild?.profileUrl
                    ? { uri: displayChild.profileUrl }
                    : require("../../assets/images/profile-1.png")
                }
              />
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>
                {displayChild?.fullName || "Chưa chọn bé"}
              </Text>
              <Text style={styles.childJoined}>
                Đã tham gia: {joinedDisplay}
              </Text>
            </View>
          </View>

          {children.length > 1 && (
            <TouchableOpacity
              style={styles.switchProfileButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.switchProfileText}>Đổi hồ sơ</Text>
              <Svg
                width="12"
                height="7"
                viewBox="0 0 12 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <Path
                  d="M1 1L6 6L11 1"
                  stroke="#333"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statGrid}>
            <StatItem
              color="#E5F6D5"
              icon={
                <Svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M5 5H19V19H5V5Z"
                    stroke="#4CAF50"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M9 9H15V15H9V9Z" fill="#4CAF50" />
                </Svg>
              }
              label="Topic đã hoàn thành"
              value={report?.totalTopicsCompleted ?? 0}
            />
            <StatItem
              color="#FFEFD5"
              icon={
                <Svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M12 8V12L14 14"
                    stroke="#FF9800"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3Z"
                    stroke="#FF9800"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              label="Phút đã học (tổng)"
              value={report?.totalMinutesAll ?? 0}
            />
            <StatItem
              color="#FDE7F3"
              icon={
                <Svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M5 5H19V19H5V5Z"
                    stroke="#EC407A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M8 9H16"
                    stroke="#EC407A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M8 13H13"
                    stroke="#EC407A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              label="Vocab đã hoàn thành"
              value={report?.totalVocabCompleted ?? 0}
            />
            <StatItem
              color="#E3F2FD"
              icon={
                <Svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M12 8V12L14 14"
                    stroke="#2196F3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3Z"
                    stroke="#2196F3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              label="Phút đã học (7 ngày)"
              value={report?.totalMinutesLast7Days ?? 0}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom sheet chọn hồ sơ */}
      <Modal
        transparent
        visible={showPicker}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Đổi hồ sơ</Text>
            <ScrollView
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {children.map((child) => {
                const r = reportsByChild[child.mrid];
                const joined = formatJoined(r?.joinedDate);
                const isActive = child.mrid === activeChildId;
                return (
                  <TouchableOpacity
                    key={child.mrid}
                    style={[
                      styles.modalChildRow,
                      isActive && styles.modalChildRowActive,
                    ]}
                    onPress={async () => {
                      setShowPicker(false);
                      await selectChild(child.mrid);
                    }}
                  >
                    <View style={styles.modalAvatarWrapper}>
                      <Image
                        style={styles.modalAvatar}
                        source={
                          child.profileUrl
                            ? { uri: child.profileUrl }
                            : require("../../assets/images/profile-1.png")
                        }
                      />
                    </View>
                    <View style={styles.modalChildInfo}>
                      <Text style={styles.modalChildName}>
                        {child.fullName}
                      </Text>
                      <Text style={styles.modalChildJoined}>
                        Đã tham gia: {joined}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.modalRadio,
                        isActive && styles.modalRadioActive,
                      ]}
                    >
                      {isActive && <View style={styles.modalRadioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20,
  },
  childCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  childAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FFB700",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202244",
  },
  childJoined: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  switchProfileButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  switchProfileText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202244",
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  statItem: {
    width: "48%",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statTextBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: "#555",
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#202244",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalHandle: {
    alignSelf: "center",
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202244",
    textAlign: "center",
    marginBottom: 16,
  },
  modalChildRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  modalChildRowActive: {
    backgroundColor: "#F2F5FF",
  },
  modalAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFB700",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalChildInfo: {
    flex: 1,
  },
  modalChildName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202244",
  },
  modalChildJoined: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },
  modalRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C0C0C0",
    justifyContent: "center",
    alignItems: "center",
  },
  modalRadioActive: {
    borderColor: "#4CAF50",
  },
  modalRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
});

export default ProfileReportScreen;
