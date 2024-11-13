import React, { useState, useEffect } from 'react';
import { FlatList, Modal, View, TextInput, Text, TouchableOpacity, Image, StyleSheet, Alert, ScrollView, Dimensions, ActivityIndicator, Button } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import DatePicker from 'react-native-date-picker';
import Header from './Header';
import { useNavigation } from '@react-navigation/native';
import config from '../../config';
import Contacts from 'react-native-contacts';
import ContactPicker from 'react-native-select-contact';


const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 75) / 3;

const AddInvoice = () => {
  const calanderLogo = require('../../assets/calendar.png');
  const closeLogo = require("../../assets/close.png");
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [receiptImages, setReceiptImages] = useState([]);
  const [designImages, setDesignImages] = useState([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [amountGiven, setAmountGiven] = useState('');
  const [invoice_number, setinvoice_number] = useState("");
  const [orderDate, setOrderDate] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [isOrderDateOpen, setOrderDateOpen] = useState(false);
  const [isDeliveryDateOpen, setDeliveryDateOpen] = useState(false);
  const [activity, setActivity] = useState(false);
  const phoneBook = require("../../assets/phonebook.png");
  const [modalVisible, setModalVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [search, setSearch] = useState('');


  useEffect(() => {
    if (search) {
      const filtered = contacts.filter(contact =>
        contact.displayName.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [search, contacts]);

  const handleReceiptImageSelection = () => {
    Alert.alert(
      'Choose an option',
      '',
      [
        { text: 'Camera', onPress: openReceiptCamera },
        { text: 'Gallery', onPress: pickReceiptImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const pickReceiptImage = () => {
    ImagePicker.openPicker({
      multiple: true,
      cropping: true,
    }).then(images => {
      setReceiptImages(prevImages => [...prevImages, ...images]);
    }).catch(error => console.log('Error picking receipt images:', error));
  };

  const openReceiptCamera = () => {
    ImagePicker.openCamera({
      cropping: true,
    }).then(image => {
      setReceiptImages(prevImages => [...prevImages, image]);
    }).catch(error => console.log('Error opening camera:', error));
  };

  const handleDesignImageSelection = () => {
    Alert.alert(
      'Choose an option',
      '',
      [
        { text: 'Camera', onPress: openDesignCamera },
        { text: 'Gallery', onPress: pickDesignImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const pickDesignImage = () => {
    ImagePicker.openPicker({
      multiple: true,
      cropping: true,
    }).then(images => {
      setDesignImages(prevImages => [...prevImages, ...images]);
    }).catch(error => console.log('Error picking design images:', error));
  };

  const openDesignCamera = () => {
    ImagePicker.openCamera({
      cropping: true,
    }).then(image => {
      setDesignImages(prevImages => [...prevImages, image]);
    }).catch(error => console.log('Error opening camera:', error));
  };

  const handleRemoveImage = (setImageList, index) => {
    setImageList(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setActivity(true);
    const apiURL = config.BASE_URL + 'insertInvoice.php';
    const formData = new FormData();

    formData.append('name', name);
    formData.append('mobile', mobile);
    formData.append('address', address);
    formData.append('description', description);
    formData.append('totalAmount', totalAmount);
    formData.append('amountGiven', amountGiven);
    formData.append('invoice_number', invoice_number);
    formData.append('orderDate', orderDate.toISOString());
    formData.append('deliveryDate', deliveryDate.toISOString());

    receiptImages.forEach((image, index) => {
      formData.append('receiptImages[]', {
        uri: image.path,
        type: image.mime,
        name: `receipt_${Date.now()}_${index}.jpg`,
      });
    });

    designImages.forEach((image, index) => {
      formData.append('designImages[]', {
        uri: image.path,
        type: image.mime,
        name: `design_${Date.now()}_${index}.jpg`,
      });
    });

    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const result = await response.json();
      if (result.status === 'success') {
        setName("");
        setAddress("");
        setMobile("");
        setDescription("");
        setAmountGiven("");
        setTotalAmount("");
        setDesignImages([]);
        setReceiptImages([]);
        navigation.navigate('InvoiceHome');
        Alert.alert('Success', 'Invoice submitted successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit invoice');
      console.error(error);
    } finally {
      setActivity(false);
    }
  };

  const openPhoneBook = async () => {
    const permission = await Contacts.requestPermission();
    if (permission === 'authorized') {
      Contacts.getAll()
        .then((contactsList) => {
          const sortedContacts = contactsList.sort((a, b) => 
            a.displayName.localeCompare(b.displayName)
          );
          setContacts(sortedContacts);
          setFilteredContacts(contactsList);
          setModalVisible(true);
        })
        .catch((error) => {
          console.warn('Error fetching contacts:', error);
        });
    } else {
      Alert.alert('Permission Denied', 'Cannot access contacts without permission.');
    }
  };

  const selectContact = (contact) => {
    if (contact.phoneNumbers.length > 0) {
      setMobile(contact.phoneNumbers[0].number.replace(/[^0-9+]/g, ''));
      setModalVisible(false);
    } else {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
    }
  };

  const renderContactItem = ({ item }) => (
    item.phoneNumbers.length > 0 ?
      <TouchableOpacity
        onPress={() => selectContact(item)}
        style={{
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderColor: '#ddd',
          width: '100%',
        }}
      >
        <Text style={{ fontSize: 16, color: "black" }}>{item.displayName}</Text>
        {item.phoneNumbers.length > 0 && (
          <Text style={{ color: '#666' }}>{item.phoneNumbers[0].number}</Text>
        )}
      </TouchableOpacity>
      :
      <></>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <TextInput
            placeholder="Invoice Number"
            value={invoice_number}
            onChangeText={setinvoice_number}
            style={styles.input}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <View style={{
            height: 50,
            borderColor: '#d4af37',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            marginBottom: 15,
            backgroundColor: '#f0f0f0',
            color: '#333',
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: 'center'
          }}>
            <TextInput
              placeholder="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="number-pad"
              maxLength={15}
              placeholderTextColor="#999"
              style={{ width: "85%", color: "black" }}
            />
            <TouchableOpacity onPress={openPhoneBook} style={{ width: "15%", justifyContent: "center", alignItems: "center", borderColor: "gray", borderLeftWidth: 1 }}>
              <Image source={phoneBook} style={{ height: 35, width: 35 }} />
            </TouchableOpacity>
          </View>


          <TextInput
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            placeholderTextColor="#999"
            multiline
          />
          <TextInput
            placeholder="Total Amount"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Amount Given"
            value={amountGiven}
            onChangeText={setAmountGiven}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#999"
            multiline
          />



          <TouchableOpacity onPress={() => setOrderDateOpen(true)} style={{ backgroundColor: "#f0f0f0", padding: 10, marginVertical: 10, borderRadius: 7, borderColor: "#d4af37", borderWidth: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }} >
              {orderDate ? <Text style={{ color: "black", fontWeight: "600" }}>{orderDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}</Text> : <Text style={{ color: "gray" }}>Eg. 20/12/2024 (Order)</Text>}
              <Image source={calanderLogo} style={{ height: 25, width: 25 }} />
            </View>
          </TouchableOpacity>

          <DatePicker
            modal
            title={"Select Order Date"}
            theme='dark'
            mode='date'
            open={isOrderDateOpen}
            date={orderDate || new Date()}
            onConfirm={(date) => {
              setOrderDateOpen(false);
              setOrderDate(date);
            }}
            onCancel={() => {
              setOrderDateOpen(false);
            }}
          />

          <TouchableOpacity onPress={() => setDeliveryDateOpen(true)} style={{ backgroundColor: "#f0f0f0", padding: 10, marginVertical: 10, borderRadius: 7, borderColor: "#d4af37", borderWidth: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }} >
              {deliveryDate ? <Text style={{ color: "black", fontWeight: "600" }}>{deliveryDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}</Text> : <Text style={{ color: "gray" }}>Eg. 20/12/2024 (Delivery)</Text>}
              <Image source={calanderLogo} style={{ height: 25, width: 25 }} />
            </View>
          </TouchableOpacity>

          <DatePicker
            modal
            title={"Select Delivery Date"}
            mode='date'
            theme='dark'
            open={isDeliveryDateOpen}
            date={deliveryDate || new Date()}
            onConfirm={(date) => {
              setDeliveryDateOpen(false);
              setDeliveryDate(date);
            }}
            onCancel={() => {
              setDeliveryDateOpen(false);
            }}
          />

          <TouchableOpacity style={styles.imagePicker} onPress={handleReceiptImageSelection}>
            <Text style={styles.imagePickerText}>Upload Receipt Images</Text>
          </TouchableOpacity>

          <View style={styles.imageList}>
            {receiptImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.path }} style={styles.image} />
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveImage(setReceiptImages, index)}>
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.imagePicker} onPress={handleDesignImageSelection}>
            <Text style={styles.imagePickerText}>Upload Design Images</Text>
          </TouchableOpacity>
          <View style={styles.imageList}>
            {designImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.path }} style={styles.image} />
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveImage(setDesignImages, index)}>
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>

        {activity && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '80%',
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 20,
              maxHeight: "80%"

            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: "gray" }}>Select Contact</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Image source={closeLogo} style={{ height: 30, width: 30 }} />
              </TouchableOpacity>

            </View>

            <TextInput
              placeholder="Search contacts"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={"gray"}
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 15,
                borderColor: '#ddd',
                borderWidth: 1,
                borderRadius: 8,
                backgroundColor: '#f0f0f0',
                color: "black"
              }}
            />

            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.recordID}
              renderItem={renderContactItem}
            />


          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  input: {
    height: 50,
    borderColor: '#d4af37',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  imagePicker: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#d4af37',
    borderRadius: 8,
    marginBottom: 5,
  },
  imagePickerText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  imageContainer: {
    position: 'relative',
    margin: 5,
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    borderColor: '#d4af37',
    borderWidth: 1,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddInvoice;
