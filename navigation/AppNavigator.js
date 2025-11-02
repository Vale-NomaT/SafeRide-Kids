import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import AddChildScreen from '../screens/AddChildScreen';
import EditChildScreen from '../screens/EditChildScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  console.log('AppNavigator is rendering...');
  
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4A90E2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'SafeRide Kids - Login',
          headerShown: false, // Hide header for login screen
        }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'SafeRide Kids',
          headerLeft: null, // Prevent going back to login
        }}
      />
      <Stack.Screen 
        name="AddChild" 
        component={AddChildScreen}
        options={{
          title: 'Add Child',
        }}
      />
      <Stack.Screen 
        name="EditChild" 
        component={EditChildScreen}
        options={{
          title: 'Edit Child',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;