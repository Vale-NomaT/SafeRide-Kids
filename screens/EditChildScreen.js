import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getToken } from '../services/api.js';
// For mobile image picker
import * as ImagePicker from 'expo-image-picker';
// For date picker
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const EditChildScreen = ({ navigation, route }) => {
  const { childId } = route.params;
  const [loading, setLoading] = useState(true);
  
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      date_of_birth: new Date(),
      photo_url: '',
      allergies: '',
      notes: '',
      home_address: '',
      home_coordinates: [],
      school_name: '',
      school_address: '',
      school_coordinates: [],
    },
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [currentMapType, setCurrentMapType] = useState('');

  // Fetch child data when component mounts
  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/children/${childId}`);
        const childData = response.data;
        
        // Set form values with existing child data
        setValue('name', childData.name);
        setValue('allergies', childData.allergies || '');
        setValue('notes', childData.notes || '');
        setValue('home_address', childData.home_address);
        setValue('home_coordinates', childData.home_coordinates || []);
        setValue('school_name', childData.school_name);
        setValue('school_address', childData.school_address);
        setValue('school_coordinates', childData.school_coordinates || []);
        setValue('photo_url', childData.photo_url || '');
        
        // Handle date conversion
        if (childData.date_of_birth) {
          setValue('date_of_birth', new Date(childData.date_of_birth));
        }
      } catch (error) {
        console.error('Error fetching child data:', error);
        Alert.alert('Error', 'Failed to load child information');
      } finally {
        setLoading(false);
      }
    };

    fetchChildData();
  }, [childId, setValue]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('date_of_birth', selectedDate);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a photo.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setValue('photo_url', result.assets[0].uri);
    }
  };

  const getLocationCoordinates = async (type) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant location permissions to use this feature.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      if (type === 'home') {
        setValue('home_coordinates', [longitude, latitude]);
        Alert.alert('Success', 'Home coordinates updated successfully!');
      } else if (type === 'school') {
        setValue('school_coordinates', [longitude, latitude]);
        Alert.alert('Success', 'School coordinates updated successfully!');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location coordinates');
    }
  };

  const onSubmit = async (data) => {
    try {
      // Calculate age from date of birth
      const age = calculateAge(data.date_of_birth);
      
      // Format date to ISO string for API
      const formattedData = {
        ...data,
        age,
        date_of_birth: data.date_of_birth.toISOString().split('T')[0],
      };
      
      // Update child data
      await api.put(`/children/${childId}`, formattedData);
      
      Alert.alert(
        'Success',
        'Child information updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating child:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update child information';
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading child information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Child Information</Text>
        <Text style={styles.headerSubtitle}>Update your child's details</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Child's Name */}
        <Text style={styles.label}>Child's Full Name *</Text>
        <Controller
          control={control}
          rules={{
            required: 'Child name is required',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter child's full name"
            />
          )}
          name="name"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        {/* Date of Birth */}
        <Text style={styles.label}>Date of Birth *</Text>
        <TouchableOpacity
          style={[styles.input, styles.dateInput]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{watch('date_of_birth').toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={watch('date_of_birth')}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Child's Photo */}
        <Text style={styles.label}>Child's Photo (Optional)</Text>
        <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
          {watch('photo_url') ? (
            <Image source={{ uri: watch('photo_url') }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Home Address */}
        <Text style={styles.label}>Home Address *</Text>
        <Controller
          control={control}
          rules={{
            required: 'Home address is required',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.home_address && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter home address"
              multiline
            />
          )}
          name="home_address"
        />
        {errors.home_address && <Text style={styles.errorText}>{errors.home_address.message}</Text>}
        
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => getLocationCoordinates('home')}
        >
          <Text style={styles.locationButtonText}>Use Current Location for Home</Text>
        </TouchableOpacity>

        {/* School Information */}
        <Text style={styles.label}>School Name *</Text>
        <Controller
          control={control}
          rules={{
            required: 'School name is required',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.school_name && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter school name"
            />
          )}
          name="school_name"
        />
        {errors.school_name && <Text style={styles.errorText}>{errors.school_name.message}</Text>}

        <Text style={styles.label}>School Address *</Text>
        <Controller
          control={control}
          rules={{
            required: 'School address is required',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.school_address && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter school address"
              multiline
            />
          )}
          name="school_address"
        />
        {errors.school_address && <Text style={styles.errorText}>{errors.school_address.message}</Text>}
        
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => getLocationCoordinates('school')}
        >
          <Text style={styles.locationButtonText}>Use Current Location for School</Text>
        </TouchableOpacity>

        {/* Additional Information */}
        <Text style={styles.label}>Allergies (Optional)</Text>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter allergies information"
              multiline
            />
          )}
          name="allergies"
        />

        <Text style={styles.label}>Additional Notes (Optional)</Text>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter any additional notes"
              multiline
              numberOfLines={4}
            />
          )}
          name="notes"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitButtonText}>Update Child Information</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#e1e1e1',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#888',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default EditChildScreen;