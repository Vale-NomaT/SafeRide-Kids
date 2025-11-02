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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getToken } from '../services/api.js';
// For mobile image picker
import * as ImagePicker from 'expo-image-picker';
// For date picker
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
  const [currentMapType, setCurrentMapType] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Map related state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Watch form values
  const watchedValues = watch();

  // Web-compatible date picker handler
  const handleDateChange = (event) => {
    if (Platform.OS === 'web') {
      const date = new Date(event.target.value);
      setValue('date_of_birth', date);
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
            // Do not set photo_url here since backend requires http/https URL
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
          // Do not set photo_url to local file URI; backend expects http/https URL
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
      // Mobile: use expo-location to get current GPS position
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need location permission to set coordinates.');
            return;
          }
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = position.coords;
          const coordinates = [longitude, latitude];
          
          // Update map region
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          
          if (type === 'home') {
            setValue('home_coordinates', coordinates);
            setValue('home_address', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          } else if (type === 'school') {
            setValue('school_coordinates', coordinates);
            setValue('school_address', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
          Alert.alert('Location Set', `${type} location has been set to your current position`);
        } catch (err) {
          console.error('Location error:', err);
          Alert.alert('Location Error', 'Failed to get current location.');
        }
      })();
    }
  };
  
  // Open map for location selection
  const openMapSelector = (type) => {
    setCurrentMapType(type);
    setShowMapModal(true);
    
    // Try to get current location for initial map position
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = position.coords;
          
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      } catch (err) {
        console.error('Error getting initial map position:', err);
      }
    })();
  };
  
  // Handle map marker selection
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };
  
  // Save selected map location
  const saveMapLocation = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map first');
      return;
    }
    
    const { latitude, longitude } = selectedLocation;
    const coordinates = [longitude, latitude];
    
    // Get address from coordinates if possible
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      let addressText = '';
      if (addressResponse && addressResponse.length > 0) {
        const address = addressResponse[0];
        addressText = [
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ].filter(Boolean).join(', ');
      } else {
        addressText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      
      if (currentMapType === 'home') {
        setValue('home_coordinates', coordinates);
        setValue('home_address', addressText);
      } else if (currentMapType === 'school') {
        setValue('school_coordinates', coordinates);
        setValue('school_address', addressText);
      }
      
      setShowMapModal(false);
      setSelectedLocation(null);
      Alert.alert('Location Set', `${currentMapType} location has been set successfully`);
    } catch (error) {
      console.error('Error getting address:', error);
      
      // Fallback to coordinates if geocoding fails
      const addressText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      if (currentMapType === 'home') {
        setValue('home_coordinates', coordinates);
        setValue('home_address', addressText);
      } else if (currentMapType === 'school') {
        setValue('school_coordinates', coordinates);
        setValue('school_address', addressText);
      }
      
      setShowMapModal(false);
      setSelectedLocation(null);
      Alert.alert('Location Set', `${currentMapType} location has been set successfully`);
    }
  };


  // Submit form
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Get auth token from shared API storage
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        navigation.navigate('Login');
        return;
      }

      // Validate required coordinate fields
      if (!Array.isArray(data.home_coordinates) || data.home_coordinates.length < 2) {
        Alert.alert('Location Required', 'Please set Home location using "Use Current Location".');
        setIsSubmitting(false);
        return;
      }
      if (!Array.isArray(data.school_coordinates) || data.school_coordinates.length < 2) {
        Alert.alert('Location Required', 'Please set School location using "Use Current Location".');
        setIsSubmitting(false);
        return;
      }

      // Prepare data with backend field names
      const childData = {
        ...data,
        date_of_birth: data.date_of_birth instanceof Date
          ? data.date_of_birth.toISOString().split('T')[0]
          : data.date_of_birth,
      };

      // Remove photo_url if it's not an http/https URL
      if (!childData.photo_url || !/^https?:\/\//.test(childData.photo_url)) {
        delete childData.photo_url;
      }

      // Submit to API (Authorization handled by interceptor, but include header for safety)
      const response = await api.post(
        '/children/',
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

  // Map Modal Component
  const renderMapModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={showMapModal}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModalContainer}>
          <Text style={styles.mapTitle}>Select {currentMapType} Location</Text>
          
          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title={`Selected ${currentMapType} Location`}
              />
            )}
          </MapView>
          
          <View style={styles.mapButtonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => setShowMapModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={saveMapLocation}
            >
              <Text style={styles.buttonText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
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
      {renderMapModal()}

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
                {watchedValues.date_of_birth ? watchedValues.date_of_birth.toDateString() : 'Select Date'}
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
                  value={watchedValues.date_of_birth || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setValue('date_of_birth', selectedDate);
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
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity
              style={[styles.locationButton, {flex: 1, marginRight: 5}]}
              onPress={() => handleLocationSelect('home')}
            >
              <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.locationButton, {flex: 1, marginLeft: 5}]}
              onPress={() => openMapSelector('home')}
            >
              <Text style={styles.locationButtonText}>🗺️ Select on Map</Text>
            </TouchableOpacity>
          </View>
          {errors.home_address && <Text style={styles.errorText}>{errors.home_address.message}</Text>}
        </View>

        {/* School Information */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>School Name *</Text>
          <Controller
            control={control}
            name="school_name"
            rules={{ required: 'School name is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.school_name && styles.inputError]}
                placeholder="Enter school name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.school_name && <Text style={styles.errorText}>{errors.school_name.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>School Address *</Text>
          <Controller
            control={control}
            name="school_address"
            rules={{ required: 'School address is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.school_address && styles.inputError]}
                placeholder="Enter school address"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.school_address && <Text style={styles.errorText}>{errors.school_address.message}</Text>}
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity
              style={[styles.locationButton, {flex: 1, marginRight: 5}]}
              onPress={() => handleLocationSelect('school')}
            >
              <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.locationButton, {flex: 1, marginLeft: 5}]}
              onPress={() => openMapSelector('school')}
            >
              <Text style={styles.locationButtonText}>🗺️ Select on Map</Text>
            </TouchableOpacity>
          </View>
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
  // Map modal styles
  mapModalContainer: {
    flex: 1,
    padding: 20,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: height * 0.6,
    borderRadius: 10,
    marginBottom: 20,
  },
  mapButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default AddChildScreen;