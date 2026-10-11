import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { GlassCard } from './GlassCard';
import { colors } from './theme';

export type PhotoValue = string | null | undefined;
export function VehiclePhotoPicker({ value, onChange }: { value: PhotoValue; onChange: (value: PhotoValue) => void }) {
  const choose = async (source: 'camera' | 'library') => {
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Нужно разрешение', source === 'camera' ? 'Разрешите доступ к камере в настройках телефона.' : 'Разрешите доступ к фотографиям в настройках телефона.'); return; }
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    try { const jpeg = await ImageManipulator.manipulateAsync(result.assets[0].uri, [], { compress: 0.86, format: ImageManipulator.SaveFormat.JPEG }); onChange(jpeg.uri); } catch { Alert.alert('Не удалось подготовить фото', 'Попробуйте выбрать другое изображение.'); }
  };
  return <GlassCard style={styles.card}>{value ? <Image source={value} contentFit="cover" style={styles.preview} /> : <View style={styles.placeholder}><Text style={styles.placeholderIcon}>▧</Text><Text style={styles.placeholderText}>Фотография транспорта</Text></View>}<View style={styles.actions}><Pressable onPress={() => void choose('library')} style={styles.action}><Text style={styles.actionText}>{value ? 'Заменить' : 'Из галереи'}</Text></Pressable><Pressable onPress={() => void choose('camera')} style={styles.action}><Text style={styles.actionText}>Камера</Text></Pressable>{value ? <Pressable onPress={() => onChange(null)} style={styles.remove}><Text style={styles.removeText}>Удалить</Text></Pressable> : null}</View></GlassCard>;
}
const styles = StyleSheet.create({ card:{marginTop:14,padding:10},preview:{height:185,width:'100%',borderRadius:14},placeholder:{height:132,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(19,55,97,.38)'},placeholderIcon:{fontSize:28,color:'#74b4ff'},placeholderText:{fontSize:12,color:'#9bb7d8',marginTop:8},actions:{flexDirection:'row',gap:8,marginTop:10},action:{flex:1,alignItems:'center',paddingVertical:10,borderRadius:11,backgroundColor:'rgba(54,127,233,.3)'},actionText:{fontSize:12,color:'#dceeff',fontWeight:'800'},remove:{justifyContent:'center',paddingHorizontal:8},removeText:{fontSize:12,color:colors.danger,fontWeight:'800'} });
