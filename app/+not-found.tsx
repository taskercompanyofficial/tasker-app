import { Link, Stack } from 'expo-router'
import { StyleSheet, Text, View, Image } from 'react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Page Not Found' }} />
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/not-found.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          Sorry, we couldn't find the page you're looking for.
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Home</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  image: {
    width: 280,
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    maxWidth: 300,
  },
  link: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#F43F5E',
    borderRadius: 12,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  linkText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
})
