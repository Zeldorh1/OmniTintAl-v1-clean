// client/src/screens/premium/AR360PreviewScreen.tsx
// FINAL · 360° HAIR PREVIEW · PREMIUM-GATED · NO VECTOR-ICONS
// - GLView + ThreeJS
// - Upload photo → mapped onto face mesh
// - Swipe to rotate model with inertia
// - One-time FeatureGuideOverlay tips
// - PremiumContext gate + PremiumGate screen routing (PremiumNavigator: "PremiumGate")

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
  PixelRatio,
  Alert,
} from "react-native";
import { GLView } from "expo-gl";
import { Asset } from "expo-asset";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { Icon } from "../../components/Icons";
import FeatureGuideOverlay, { hasSeenGuide } from "../../components/FeatureGuideOverlay";
import { usePremium } from "../../context/PremiumContext";

const { width } = Dimensions.get("window");

// ✅ Feature key for limiter / premium gate
const FEATURE_KEY = "ar360-preview";
const GUIDE_KEY = "@omnitintai:guide_ar360";

// ✅ Use RELATIVE requires (avoid Metro alias issues)
const hairModels = [
  require("../../../assets/hair/hair_short.glb"),
  require("../../../assets/hair/hair_long.glb"),
  require("../../../assets/hair/hair_bun.glb"),
];

const ASSET_CACHE: Map<string, any> = new Map();

class CachedGLTFLoader {
  private loader = new GLTFLoader();

  async load(uri: string) {
    if (ASSET_CACHE.has(uri)) return this.clone(ASSET_CACHE.get(uri));
    const gltf: any = await new Promise((resolve, reject) =>
      this.loader.load(uri, resolve, undefined, reject)
    );
    ASSET_CACHE.set(uri, gltf);
    return this.clone(gltf);
  }

  private clone(gltf: any) {
    return {
      ...gltf,
      scene: gltf.scene.clone(true),
      scenes: gltf.scenes.map((s: any) => s.clone(true)),
      animations: [...gltf.animations],
    };
  }
}
const gltfLoader = new CachedGLTFLoader();

export default function AR360PreviewScreen() {
  const navigation = useNavigation<any>();
  const { isPremium, usesLeft, hydrated, incrementUse } = usePremium();

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const modelRef = useRef<THREE.Object3D | null>(null);
  const faceMeshRef = useRef<THREE.Mesh | null>(null);

  const rafRef = useRef<number | null>(null);
  const inertiaRaf = useRef<number | null>(null);

  const textureRef = useRef<THREE.Texture | null>(null);
  const textureLoaderRef = useRef(new THREE.TextureLoader()).current;

  const [loading, setLoading] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentHair, setCurrentHair] = useState(0);

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showArrows, setShowArrows] = useState(true);

  const [showGuide, setShowGuide] = useState(false);

  const uploadScale = useRef(new Animated.Value(1)).current;
  const switchScale = useRef(new Animated.Value(1)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;

  const rotation = useRef(0);
  const velocity = useRef(0);

  // ──────────────────────────────────────────────────────────────
  // Premium gate check (on focus)
  // ──────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;

      if (!isPremium) {
        const left = usesLeft(FEATURE_KEY);
        if (left <= 0) {
          navigation.replace("PremiumGate", {
            feature: "360° Hair Preview",
            usesLeft: left,
          });
          return;
        }
      }
    }, [hydrated, isPremium, usesLeft, navigation])
  );

  // Count a free "use" once when user actually reaches the screen (non-premium)
  useEffect(() => {
    (async () => {
      if (!hydrated || isPremium) return;
      const left = usesLeft(FEATURE_KEY);
      if (left > 0) {
        await incrementUse(FEATURE_KEY);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ──────────────────────────────────────────────────────────────
  // Permissions
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch {}
    })();
  }, []);

  const animateButton = (scale: Animated.Value, toValue: number) => {
    Animated.spring(scale, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
      },
      onPanResponderMove: (_: any, g: any) => {
        if (!modelRef.current) return;
        modelRef.current.rotation.y = rotation.current + g.dx * 0.0035;
        velocity.current = g.vx * 0.0035;
      },
      onPanResponderRelease: () => {
        if (!modelRef.current) return;
        rotation.current = modelRef.current.rotation.y;

        const loop = () => {
          if (!modelRef.current) return;
          rotation.current += velocity.current;
          modelRef.current.rotation.y = rotation.current;
          velocity.current *= 0.96;

          if (Math.abs(velocity.current) > 0.0005) {
            inertiaRaf.current = requestAnimationFrame(loop);
          }
        };

        inertiaRaf.current = requestAnimationFrame(loop);
      },
    })
  ).current;

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert("Photo error", String(e?.message || e));
    }
  };

  const setupLighting = (scene: THREE.Scene) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 4, 2);

    const rim = new THREE.DirectionalLight(0x88ccff, 0.6);
    rim.position.set(-3, 2, -2);

    scene.add(key, rim);
  };

  const loadFace = (scene: THREE.Scene) => {
    const geo = new THREE.SphereGeometry(1, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd7b8 });
    const mesh = new THREE.Mesh(geo, mat);
    faceMeshRef.current = mesh;
    scene.add(mesh);
  };

  const disposeObject = (obj: THREE.Object3D) => {
    obj.traverse((o: any) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m: any) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
  };

  const applyTexture = async (uri: string) => {
    if (!faceMeshRef.current) return;

    if (textureRef.current) {
      textureRef.current.dispose?.();
      textureRef.current = null;
    }

    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      textureLoaderRef.load(uri, resolve, undefined, reject);
    });

    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = texture;

    // @ts-ignore
    faceMeshRef.current.material.map = texture;
    // @ts-ignore
    faceMeshRef.current.material.needsUpdate = true;
  };

  // Swap hair model
  useEffect(() => {
    const load = async () => {
      if (!sceneRef.current) return;
      setLoading(true);

      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
        disposeObject(modelRef.current);
        modelRef.current = null;
      }

      const asset = Asset.fromModule(hairModels[currentHair]);
      await asset.downloadAsync();
      const gltf = await gltfLoader.load(asset.uri);
      const model = gltf.scene;

      model.position.set(0, 0.1, 0);
      model.scale.set(1.1, 1.1, 1.1);

      sceneRef.current.add(model);
      modelRef.current = model;

      velocity.current = 0;
      setLoading(false);
    };

    load();
  }, [currentHair]);

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: w, drawingBufferHeight: h } = gl;

    const renderer = new THREE.WebGLRenderer({ context: gl, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(2, PixelRatio.get()));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    setupLighting(scene);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 3;
    cameraRef.current = camera;

    loadFace(scene);

    // Initial hair
    const asset = Asset.fromModule(hairModels[0]);
    await asset.downloadAsync();
    const gltf = await gltfLoader.load(asset.uri);
    const model = gltf.scene;

    model.position.set(0, 0.1, 0);
    model.scale.set(1.1, 1.1, 1.1);

    scene.add(model);
    modelRef.current = model;

    if (photoUri) await applyTexture(photoUri);

    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      gl.endFrameEXP();
      rafRef.current = requestAnimationFrame(animate);
    };

    setLoading(false);
    animate();
  };

  // When photo changes, apply it
  useEffect(() => {
    if (photoUri) applyTexture(photoUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUri]);

  // Fade arrows after a few seconds
  useEffect(() => {
    if (!loading && showArrows) {
      const t = setTimeout(() => {
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowArrows(false));
      }, 2500);

      return () => clearTimeout(t);
    }
  }, [loading, showArrows, arrowOpacity]);

  // One-time guide after onboarding closes
  useEffect(() => {
    (async () => {
      if (showOnboarding) return;
      try {
        const seen = await hasSeenGuide(GUIDE_KEY);
        if (!seen) setShowGuide(true);
      } catch {}
    })();
  }, [showOnboarding]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (modelRef.current) disposeObject(modelRef.current);
      if (faceMeshRef.current) disposeObject(faceMeshRef.current);
      if (textureRef.current) textureRef.current.dispose?.();

      rendererRef.current?.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      modelRef.current = null;
      faceMeshRef.current = null;
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Onboarding
  // ──────────────────────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <LinearGradient colors={["#0B0B0B", "#000000"]} style={styles.onboardingContainer}>
        <View style={styles.onboardingCard}>
          <View style={styles.onboardingBadge}>
            <Icon name="sparkles" size={14} color="#fff" />
            <Text style={styles.onboardingBadgeTxt}>360° PREVIEW</Text>
          </View>

          <Text style={styles.onboardingTitle}>Discover Your Perfect Look</Text>
          <Text style={styles.onboardingDescription}>
            Upload a photo, swipe to rotate, and tap Next Hairstyle to switch styles.
          </Text>

          <TouchableOpacity
            style={styles.onboardingButton}
            onPress={() => setShowOnboarding(false)}
            activeOpacity={0.9}
          >
            <Text style={styles.onboardingButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // Main UI
  // ──────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={["#1e1e1e", "#000000"]} style={styles.container}>
      <FeatureGuideOverlay
        storageKey={GUIDE_KEY}
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        title="Pro tips for 360° Hair Preview"
        bullets={[
          "Swipe left/right to rotate your hairstyle in 360°.",
          "Upload a clear, front-facing photo for the best fit.",
          "Tap Next Hairstyle to cycle through looks instantly.",
          "Great lighting = better realism in preview.",
        ]}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>360° Hair Preview</Text>
      </View>

      <View style={styles.glContainer} {...panResponder.panHandlers}>
        <GLView style={styles.glView} onContextCreate={onContextCreate} />

        {showArrows && (
          <Animated.View style={[styles.arrowContainer, { opacity: arrowOpacity }]}>
            <View style={styles.arrowPill}>
              <Icon name="chevronLeft" size={38} color="#fff" />
            </View>
            <View style={styles.arrowPill}>
              <Icon name="chevronRight" size={38} color="#fff" />
            </View>
          </Animated.View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your style…</Text>
        </View>
      )}

      <View style={styles.controls}>
        <Animated.View style={{ transform: [{ scale: uploadScale }] }}>
          <TouchableOpacity
            style={styles.btn}
            onPressIn={() => animateButton(uploadScale, 0.95)}
            onPressOut={() => animateButton(uploadScale, 1)}
            onPress={pickImage}
            activeOpacity={0.9}
          >
            <Icon name="camera" size={22} color="#000" />
            <Text style={styles.btnText}>Upload Photo</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: switchScale }] }}>
          <TouchableOpacity
            style={styles.btn}
            onPressIn={() => animateButton(switchScale, 0.95)}
            onPressOut={() => animateButton(switchScale, 1)}
            onPress={() => setCurrentHair((p) => (p + 1) % hairModels.length)}
            activeOpacity={0.9}
          >
            <Icon name="reset" size={22} color="#000" />
            <Text style={styles.btnText}>Next Hairstyle</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ✅ Minimal “not medical / not treatment” note */}
      <Text style={styles.disclaimer}>
        Previews are cosmetic simulations only. OmniTintAI does not diagnose, treat, or provide medical advice.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },

  glContainer: { flex: 1, position: "relative" },
  glView: { flex: 1 },

  arrowContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  arrowPill: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  controls: {
    position: "absolute",
    bottom: 52,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  btnText: { color: "#000", fontWeight: "600", fontSize: 16, marginLeft: 8 },

  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  loadingText: { color: "#fff", fontSize: 18, marginTop: 16 },

  disclaimer: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    color: "rgba(255,255,255,0.70)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  // Onboarding
  onboardingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },
  onboardingCard: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  onboardingBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  onboardingBadgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  onboardingTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 14 },
  onboardingDescription: { color: "#D1D5DB", fontSize: 15, lineHeight: 21, marginTop: 10 },

  onboardingButton: {
    marginTop: 18,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  onboardingButtonText: { color: "#000", fontSize: 16, fontWeight: "900" },
});
