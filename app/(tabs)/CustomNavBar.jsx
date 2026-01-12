import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function CustomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const candy =  AsyncStorage.getItem("candy");

  const navItems = [
    { 
      id: 0, 
      icon: require("../../assets/icons/puzzle.png"),
      route: '/test1',
      title: 'Khóa học',
    },
    { 
      id: 1, 
      icon: require("../../assets/icons/property.png"),
      route: '/home/vocab-list',
      title: 'Trang chủ'
    },
    { 
      id: 2, 
      icon: require("../../assets/icons/teddy-bear 1.png"),
      route: '/test2',
      title: 'Luyện tập'
    },
  ];

  return (
    <View style={styles.rightNavBar} pointerEvents="box-none">
      {/* Các nav buttons */}
      <View style={styles.container}>
        <View style={styles.navGroup}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.route);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navButton,
                  isActive && styles.activeNavButton,
                ]}
                onPress={() => {
                  if (item.route === '/home/vocab-list') {
                    router.replace('/home/vocab-list');
                  } else {
                    router.push(item.route);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <Image source={item.icon} style={styles.icon} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* My Candies Button */}
      <TouchableOpacity 
        style={styles.candiesWrapper}
        onPress={() => router.push('/profile')}
      >
        <Image
          source={require("../../assets/icons/candy.png")}
          style={styles.icon}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{ candy}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  rightNavBar: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  container: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#FFF7CC",
    marginBottom: 20,
  },
  navGroup: {
    flexDirection: "column",
    alignItems: "center",
  },
  navButton: {
    width: 58,
    height: 58,
    backgroundColor: "#F8B6B6",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
  },
  activeNavButton: {
    backgroundColor: "#F06A6A",
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  candiesWrapper: {
    backgroundColor: "#FFF1C1",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 80,
  },
  candyText: {
    fontSize: 11,
    marginTop: 4,
    color: "#F06F7F",
    fontWeight: "600",
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#EF3349",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});



