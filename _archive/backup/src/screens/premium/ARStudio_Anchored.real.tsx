
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, FlatList, Pressable, TextInput, Image } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { makeAnchorProvider, maybeFaceDetector } from '@/utils/ar/anchors';
import { useOverlayGestures, OverlayGestureContainer } from '@/utils/ar/engine';
import stylesCatalog from '../data/styles.json';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type StyleItem = { id:string; name:string; category:string; overlay?:string };

const CATEGORIES = ['All','Dreads/Locs','Braids','Curls','Fades','Short Cuts','Long','Medium','Short'];

export default function ARStudio_Anchored(){
  const [perm, setPerm] = useState<boolean | null>(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState<StyleItem | null>(null);

  const providerRef = useRef(makeAnchorProvider());
  const g = useOverlayGestures();

  // derived transforms from anchors
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const rot = useSharedValue(0);

  const autoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + 0 },
      { translateY: ty.value + 0 },
      { scale: scale.value },
      { rotateZ: `${rot.value}rad` }
    ]
  }));

  useEffect(() => { (async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setPerm(status === 'granted');
    await providerRef.current.start();
    return () => { providerRef.current.stop(); };
  })(); }, []);

  // Update transforms from anchors at ~20 FPS
  useEffect(() => {
    const id = setInterval(() => {
      const box = providerRef.current.getFaceBox();
      const a = providerRef.current.getAnchors();
      if (!box || !a.forehead || !a.templeL || !a.templeR) return;

      // base position: forehead
      const targetX = a.forehead.x - 160; // center minus half overlay width
      const targetY = a.crown ? a.crown.y - 40 : a.forehead.y - 60;
      tx.value = withTiming(targetX, { duration: 120 });
      ty.value = withTiming(targetY, { duration: 120 });

      // scale: proportional to temple distance
      const dx = (a.templeR.x - a.templeL.x);
      const dist = Math.max(80, Math.abs(dx));
      const s = dist / 180; // tuned constant for overlay width 320
      scale.value = withTiming(s, { duration: 120 });

      // rotation: tilt based on temples slope
      const dy = (a.templeR.y - a.templeL.y);
      const angle = Math.atan2(dy, dx);
      rot.value = withTiming(angle * 0.8, { duration: 120 });
    }, 50);
    return () => clearInterval(id);
  }, []);

  const list = useMemo(()=>{
    const q = query.toLowerCase();
    return (stylesCatalog as any as StyleItem[]).filter(s => {
      const matchQ = !q || (s.name + ' ' + s.category).toLowerCase().includes(q);
      const matchC = cat === 'All' || s.category === cat;
      return matchQ && matchC;
    });
  }, [query, cat]);

  if (perm === null) return <SafeAreaView><Text>Requesting camera permission…</Text></SafeAreaView>;
  if (perm === false) return <SafeAreaView><Text>No camera access</Text></SafeAreaView>;

  const FaceDetector = maybeFaceDetector;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#000' }}>
      {/* Top search & category strip */}
      <View style={{ padding: 10, backgroundColor: '#fff' }}>
        <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:'#f3f4f6', borderRadius: 12, paddingHorizontal: 10, marginBottom: 8 }}>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search hairstyles (dreads, braids, curls…)" style={{ flex:1, padding:8 }} />
          <Pressable onPress={()=>setQuery('dreads')}><Text>🎤</Text></Pressable>
        </View>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i)=>i}
          renderItem={({ item }) => (
            <Pressable onPress={()=>setCat(item)} style={{ paddingVertical:6, paddingHorizontal:12, backgroundColor: item===cat ? '#111' : '#e5e7eb', borderRadius: 999, marginRight: 8 }}>
              <Text style={{ color: item===cat ? '#fff' : '#111', fontWeight:'700' }}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Camera preview with FaceDetector if available */}
      <View style={{ flex: 1 }}>
        {FaceDetector ? (
          <Camera
            style={StyleSheet.absoluteFill}
            type={CameraType.front}
            onFacesDetected={(providerRef.current as any).onFacesDetected}
            faceDetectorSettings={{
              mode: FaceDetector.FaceDetectorMode.fast,
              detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
              runClassifications: FaceDetector.FaceDetectorClassifications.none
            }}
          />
        ) : (
          <Camera style={StyleSheet.absoluteFill} type={CameraType.front} />
        )}

        {selected && (
          <OverlayGestureContainer gesture={g.composed}>
            <Animated.View style={[{ position:'absolute', width: 320, height: 240 }, autoStyle]}>
              <Image source={require('../../assets/images/locs_highbun.png')} style={{ width: '100%', height: '100%', resizeMode:'contain' }} />
            </Animated.View>
          </OverlayGestureContainer>
        )}
      </View>

      {/* Bottom picker */}
      <View style={{ backgroundColor:'#fff', paddingVertical: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={list}
          keyExtractor={(i)=>i.id}
          renderItem={({ item }) => (
            <Pressable onPress={()=>setSelected(item)} style={{ padding:8, marginHorizontal:6, backgroundColor:'#f9fafb', borderRadius: 10, alignItems:'center' }}>
              <View style={{ width:64, height:48, backgroundColor:'#e5e7eb', borderRadius:8, marginBottom:4, justifyContent:'center', alignItems:'center' }}>
                <Text style={{ fontSize:10 }}>{item.category.split('/')[0]}</Text>
              </View>
              <Text numberOfLines={1} style={{ maxWidth:80 }}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
