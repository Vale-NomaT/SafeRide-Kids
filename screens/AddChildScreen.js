import React, { useState } from 'react';
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
import { api } from '../services/api.js';
// For mobile image picker
import * as ImagePicker from 'expo-image-picker';
// For date picker
import DateTimePicker from '@react-native-community/datetimepicker';

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

  // Image picker implementation
  const handleImagePicker = async () => {
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
      // For mobile, use expo-image-picker
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need access to your photo library to select an image');
          return;
        }
        
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setSelectedImage(result.assets[0].uri);
          setValue('photo_url', result.assets[0].uri);
        }
      } catch (error) {
        console.error('Image picker error:', error);
        Alert.alert('Error', 'Failed to pick image');
      }
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
      const response = await api.post(
        '/children',
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
                {watchedValues.dateOfBirth ? watchedValues.dateOfBirth.toDateString() : 'Select Date'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mobile Date Picker Modal */}
        {Platform.OS !== 'web' && showDatePicker && (
          <Modal
            transparent={true}
            visible={showDatePicker}
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <DateTimePicker
                  value={watchedValues.dateOfBirth || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setValue('dateOfBirth', selectedDate);
                    }
                    setShowDatePicker(false);
                  }}
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

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
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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