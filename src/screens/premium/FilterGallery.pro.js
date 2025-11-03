import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ImageBackground } from 'react-native';
import filters from '@data/filters.json';
import { logAR } from '@utils/metrics';

export default function FilterGallery({ onSelect }) {
  const [active, setActive] = useState(null);
  return (
    <View style={{ flex:1, backgroundColor:'#000' }}>
      <FlatList
        data={filters}
        numColumns={2}
        contentContainerStyle={{ padding:10 }}
        keyExtractor={(i)=>i.id}
        renderItem={({item})=>(
          <Pressable
            onPress={()=>{
              if(item.premium){ /* future unlock logic */ return; }
              setActive(item.id);
              onSelect(item);
              logAR('filter_select',{id:item.id});
            }}
            style={{
              flex:1, margin:8, backgroundColor:item.premium?'#444':'#111',
              borderColor:active===item.id?'#0b5':'transparent',
              borderWidth:2, borderRadius:10, padding:10
            }}>
            <ImageBackground
              source={require('../../../assets/placeholder.png')}
              imageStyle={{ borderRadius:8 }}
              style={{ height:120, justifyContent:'flex-end' }}>
              <View style={{ backgroundColor:'#0007', padding:4, borderBottomLeftRadius:8, borderBottomRightRadius:8 }}>
                <Text style={{ color:'#fff', fontSize:12 }}>{item.name}</Text>
              </View>
            </ImageBackground>
          </Pressable>
        )}
      />
    </View>
  );
}
