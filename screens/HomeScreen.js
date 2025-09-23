import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { logout } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const navigateToAddChild = () => {
    navigation.navigate('AddChild');
  };

  const handleViewChildren = () => {
    // Placeholder for now - will be implemented later
    Alert.alert(
      'Coming Soon',
      'View Children feature will be available in the next update!'
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>SafeRide Kids</Text>
          <Text style={styles.subtitle}>Guardian Dashboard</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={navigateToAddChild}
            >
              <Text style={styles.primaryButtonText}>Add Child</Text>
              <Text style={styles.buttonSubtext}>Register a new child for transportation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewChildren}
            >
              <Text style={styles.secondaryButtonText}>View Children</Text>
              <Text style={styles.buttonSubtext}>Manage existing children profiles</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transportation Status</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>No active rides</Text>
              <Text style={styles.statusSubtext}>
                Your children are currently not on any scheduled rides
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <View style={styles.activityContainer}>
              <Text style={styles.activityText}>No recent activity</Text>
              <Text style={styles.activitySubtext}>
                Transportation history will appear here
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.logoutButton, loading && styles.buttonDisabled]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ff6b6b" />
            ) : (
              <Text style={styles.logoutButtonText}>Logout</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  cardContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  secondaryButton: {
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  activityContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;