import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const BAR_HEIGHT = 76;
const CAMERA_SIZE = 56;
// How far the camera button rises above the bar. It sits inside the wrapper (not outside it):
// on Android a touch outside the parent's bounds never reaches the child.
const CAMERA_RISE = 26;
const CAMERA_ROUTE = 'photo';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: CAMERA_RISE, backgroundColor: colors.paper }}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            height: BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const title = descriptors[route.key]?.options.title ?? route.name;

          function press() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          }

          if (route.name === CAMERA_ROUTE) {
            return (
              <View key={route.key} style={styles.item}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={title}
                  accessibilityState={{ selected: focused }}
                  onPress={press}
                  style={({ pressed }) => [
                    styles.camera,
                    { backgroundColor: colors.stamp, borderColor: colors.paper },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.lens, { borderColor: colors.onStamp }]} />
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={press}
              style={styles.item}
            >
              <Text
                style={[styles.label, { color: focused ? colors.lantern : colors.paper }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <View style={[styles.mark, focused && { backgroundColor: colors.lantern }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  label: { fontFamily: fonts.stamp, fontSize: 12, lineHeight: 16 },
  // Not color alone: the active tab also gets an underline.
  mark: { marginTop: 4, width: 18, height: 2 },
  camera: {
    position: 'absolute',
    top: -CAMERA_RISE - 4,
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: CAMERA_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lens: { width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
  pressed: { opacity: 0.85 },
});
