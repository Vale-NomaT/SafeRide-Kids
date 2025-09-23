import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const AddChildScreen = ({ navigation }) => {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      dateOfBirth: new Date(),
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch form values
  const watchedValues = watch();

  // Web-compatible date picker handler
  const handleDateChange = (event) => {
    if (Platform.OS === 'web') {
      const date = new Date(event.target.value);
      setValue('dateOfBirth', date);
    }
  };

  // Web-compatible image picker
  const handleImagePicker = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setSelectedImage(event.target.result);
            setValue('photo_url', event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // For mobile, you would use react-native-image-picker
      Alert.alert('Image Picker', 'Image picker not available on this platform');
    }
  };

  // Web-compatible location handler
  const handleLocationSelect = (type) => {
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const coordinates = [longitude, latitude];
            
            if (type === 'home') {
              setValue('home_coordinates', coordinates);
              setValue('home_address', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            } else if (type === 'school') {
              setValue('school_coordinates', coordinates);
              setValue('school_address', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
            
            Alert.alert('Location Set', `${type} location has been set to your current position`);
          },
          (error) => {
            Alert.alert('Location Error', 'Could not get your location. Please enter address manually.');
          }
        );
      } else {
        Alert.alert('Location Error', 'Geolocation is not supported by this browser.');
      }
    } else {
      setCurrentMapType(type);
      setShowMapModal(true);
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        navigation.navigate('Login');
        return;
      }

      // Prepare data
      const childData = {
        ...data,
        dateOfBirth: data.dateOfBirth.toISOString().split('T')[0], // Format as YYYY-MM-DD
      };

      // Submit to API
      const response = await axios.post(
        'http://localhost:8000/api/children',
        childData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 201) {
        Alert.alert('Success', 'Child added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error adding child:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add child');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Child</Text>
      </View>

      <View style={styles.form}>
        {/* Child Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Child's Name *</Text>
          <Controller
            control={control}
            name="name"
            rules={{ required: 'Name is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter child's full name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
        </View>

        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              style={{
                padding: 15,
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                fontSize: 16,
                backgroundColor: '#fff',
              }}
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]}
            />
          ) : (
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>
                {watchedValues.dateOfBirth.toDateString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photo</Text>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={handleImagePicker}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoButtonText}>+ Add Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Allergies */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Allergies</Text>
          <Controller
            control={control}
            name="allergies"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="List any allergies or medical conditions"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
              />
            )}
          />
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any additional information about your child"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
              />
            )}
          />
        </View>

        {/* Home Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Home Address *</Text>
          <Controller
            control={control}
            name="home_address"
            rules={{ required: 'Home address is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.home_address && styles.inputError]}
                placeholder="Enter home address"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => handleLocationSelect('home')}
          >
            <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
          </TouchableOpacity>
          {errors.home_address && <Text style={styles.errorText}>{errors.home_address.message}</Text>}
        </View>

        {/* School Information */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>School Name</Text>
          <Controller
            control={control}
            name="school_name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter school name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>School Address</Text>
          <Controller
            control={control}
            name="school_address"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter school address"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => handleLocationSelect('school')}
          >
            <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Adding Child...' : 'Add Child'}
          </Text>
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
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 5,
  },
  photoButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#666',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddChildScreen;