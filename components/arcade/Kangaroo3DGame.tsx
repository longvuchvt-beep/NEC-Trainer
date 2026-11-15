"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import {
  Heart,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  CheckCircle2,
  XCircle,
  Play,
  BookmarkPlus,
} from "lucide-react";
import {
  extractReflexMicroQuestions,
  ArcadeReflexQuestion,
} from "../../lib/arcade/question-extractor";
import { addUserXp } from "../../lib/auth/auth-store";

interface Kangaroo3DGameProps {
  exams?: any[];
  onSaveVocab?: (item: {
    word: string;
    meaning: string;
    collocations?: string;
    example?: string;
  }) => void;
}

interface FloatingXpPopup {
  id: number;
  text: string;
  subtext: string;
  isPositive: boolean;
}

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "Collocation", label: "Cụm từ" },
  { id: "Phrasal Verb", label: "Cụm động từ" },
  { id: "Idiom", label: "Thành ngữ" },
  { id: "Word Formation", label: "Từ loại" },
];

function playSynthTone(
  type: "jump" | "splash" | "streak",
  enabled: boolean
): void {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "jump") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "streak") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.28);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // ignore audio errors
  }
}

export default function Kangaroo3DGame({
  exams = [],
  onSaveVocab,
}: Kangaroo3DGameProps) {
  const [category, setCategory] = useState<string>("ALL");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [roundSeed, setRoundSeed] = useState<number>(1);

  const questions = useMemo(() => {
    const pool = extractReflexMicroQuestions(exams, category);
    if (pool.length === 0) return extractReflexMicroQuestions([], "ALL");
    const copy = [...pool];
    let s = roundSeed * 987654321;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }, [exams, category, roundSeed]);

  const [qIndex, setQIndex] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [hopsCount, setHopsCount] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(10000);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<"correct" | "wrong" | null>(null);
  const [missedItems, setMissedItems] = useState<ArcadeReflexQuestion[]>([]);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [xpPopups, setXpPopups] = useState<FloatingXpPopup[]>([]);

  // 3D Animation State Ref shared with requestAnimationFrame loop
  const animRef = useRef<{
    state: "idle" | "jumping" | "splashing";
    progress: number; // 0..1
    startPillarIndex: number;
    targetPillarIndex: number;
    jumpSpan: number; // 1 for normal hop, 2 for streak super-leap
    cameraX: number;
    shakeIntensity: number;
    sinkFactor: number; // 0..1 based on timer running out
  }>({
    state: "idle",
    progress: 0,
    startPillarIndex: 0,
    targetPillarIndex: 0,
    jumpSpan: 1,
    cameraX: 0,
    shakeIntensity: 0,
    sinkFactor: 0,
  });

  const mountRef = useRef<HTMLDivElement | null>(null);
  const currentQuestion = questions[qIndex % Math.max(1, questions.length)];
  const QUESTION_DURATION_MS = 10000;

  // Keep sinkFactor updated from timeLeftMs
  useEffect(() => {
    const ratio = 1 - Math.max(0, Math.min(1, timeLeftMs / QUESTION_DURATION_MS));
    animRef.current.sinkFactor = ratio * 0.55;
  }, [timeLeftMs]);

  const pushXpPopup = useCallback(
    (text: string, subtext: string, isPositive: boolean) => {
      const id = Date.now() + Math.random();
      setXpPopups((prev) => [...prev.slice(-2), { id, text, subtext, isPositive }]);
      setTimeout(() => {
        setXpPopups((prev) => prev.filter((p) => p.id !== id));
      }, 1100);
    },
    []
  );

  // Advance to next question smoothly
  const advanceNextQuestion = useCallback(() => {
    setSelectedOptionIdx(null);
    setAnswerFeedback(null);
    setTimeLeftMs(QUESTION_DURATION_MS);
    setQIndex((prev) => prev + 1);
  }, []);

  // Handle Answer Selection
  const handleSelectAnswer = useCallback(
    (optIndex: number) => {
      if (gameOver || selectedOptionIdx !== null || !currentQuestion) return;
      setSelectedOptionIdx(optIndex);

      const isCorrect = optIndex === currentQuestion.correctIndex;
      if (isCorrect) {
        const nextStreak = streak + 1;
        const isSuperLeap = nextStreak > 0 && nextStreak % 5 === 0;
        const span = isSuperLeap ? 2 : 1;
        const gainedXp = isSuperLeap ? 200 : 100 + Math.min(50, streak * 10);

        setAnswerFeedback("correct");
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setScore((s) => s + gainedXp);
        setHopsCount((h) => h + span);
        addUserXp(gainedXp);

        playSynthTone(isSuperLeap ? "streak" : "jump", soundEnabled);
        pushXpPopup(
          `+${gainedXp} XP`,
          isSuperLeap ? "Nhảy kép x2" : currentQuestion.correctText,
          true
        );

        // Trigger 3D Parabolic Jump
        const curPillar = animRef.current.targetPillarIndex;
        animRef.current.state = "jumping";
        animRef.current.progress = 0;
        animRef.current.startPillarIndex = curPillar;
        animRef.current.targetPillarIndex = curPillar + span;
        animRef.current.jumpSpan = span;

        setTimeout(() => {
          advanceNextQuestion();
        }, 460);
      } else {
        setAnswerFeedback("wrong");
        setStreak(0);
        setMissedItems((prev) =>
          prev.some((m) => m.id === currentQuestion.id)
            ? prev
            : [currentQuestion, ...prev].slice(0, 12)
        );
        playSynthTone("splash", soundEnabled);
        pushXpPopup(
          `Đáp án: ${currentQuestion.correctLetter}`,
          currentQuestion.correctText,
          false
        );

        // Trigger 3D Splash & Camera Shake
        animRef.current.state = "splashing";
        animRef.current.progress = 0;
        animRef.current.shakeIntensity = 0.32;

        const nextLives = lives - 1;
        setLives(nextLives);

        setTimeout(() => {
          if (nextLives <= 0) {
            setGameOver(true);
          } else {
            animRef.current.state = "idle";
            animRef.current.progress = 0;
            advanceNextQuestion();
          }
        }, 680);
      }
    },
    [
      gameOver,
      selectedOptionIdx,
      currentQuestion,
      streak,
      lives,
      soundEnabled,
      pushXpPopup,
      advanceNextQuestion,
    ]
  );

  // 100ms Timer Tick
  useEffect(() => {
    if (gameOver || selectedOptionIdx !== null) return;
    const interval = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 100) {
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver, selectedOptionIdx]);

  // Trigger timeout splash when timeLeftMs hits 0
  useEffect(() => {
    if (timeLeftMs === 0 && !gameOver && selectedOptionIdx === null) {
      handleSelectAnswer(-1);
    }
  }, [timeLeftMs, gameOver, selectedOptionIdx, handleSelectAnswer]);

  // Keyboard shortcuts (1-4 or A-D)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOver || selectedOptionIdx !== null) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const key = e.key.toUpperCase();
      if (key === "1" || key === "A") handleSelectAnswer(0);
      else if (key === "2" || key === "B") handleSelectAnswer(1);
      else if (key === "3" || key === "C") handleSelectAnswer(2);
      else if (key === "4" || key === "D") handleSelectAnswer(3);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameOver, selectedOptionIdx, handleSelectAnswer]);

  // Initialize Three.js 3D River, Hexagonal Pillars, Low-Poly Kangaroo & Particles
  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === "undefined") return;

    const width = container.clientWidth || 390;
    const height = container.clientHeight || 260;

    const PILLAR_SPACING = 3.4;
    const TOTAL_PILLARS = 18;
    let frameId = 0;

    // Build Low-Poly Kangaroo Group helper
    const buildLowPolyKangaroo = () => {
      const group = new THREE.Group();

      const furMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // warm amber-brown kangaroo coat
        roughness: 0.65,
      });
      const bellyMat = new THREE.MeshStandardMaterial({
        color: 0xfde68a, // soft cream belly
        roughness: 0.75,
      });
      const darkMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
      });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.92, 0.58), furMat);
      torso.position.set(0, 0.78, 0);
      torso.rotation.z = -0.12;
      group.add(torso);

      // Belly pouch
      const belly = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.64, 0.44), bellyMat);
      belly.position.set(0.3, 0.72, 0);
      belly.rotation.z = -0.12;
      group.add(belly);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.44, 0.44), furMat);
      head.position.set(0.22, 1.38, 0);
      group.add(head);

      // Snout
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.28), furMat);
      snout.position.set(0.54, 1.32, 0);
      group.add(snout);

      // Nose tip
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), darkMat);
      nose.position.set(0.71, 1.35, 0);
      group.add(nose);

      // Eyes
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), darkMat);
      eyeL.position.set(0.42, 1.44, 0.18);
      const eyeR = eyeL.clone();
      eyeR.position.z = -0.18;
      group.add(eyeL, eyeR);

      // Tall Ears
      const earGeo = new THREE.BoxGeometry(0.14, 0.46, 0.12);
      const earL = new THREE.Mesh(earGeo, furMat);
      earL.position.set(0.08, 1.72, 0.15);
      earL.rotation.z = 0.18;
      const earR = new THREE.Mesh(earGeo, furMat);
      earR.position.set(0.08, 1.72, -0.15);
      earR.rotation.z = 0.18;
      group.add(earL, earR);

      // Muscular Hind Legs + Feet
      const thighGeo = new THREE.BoxGeometry(0.34, 0.48, 0.22);
      const legL = new THREE.Mesh(thighGeo, furMat);
      legL.position.set(-0.04, 0.36, 0.24);
      const legR = new THREE.Mesh(thighGeo, furMat);
      legR.position.set(-0.04, 0.36, -0.24);

      const footGeo = new THREE.BoxGeometry(0.58, 0.14, 0.2);
      const footL = new THREE.Mesh(footGeo, furMat);
      footL.position.set(0.14, 0.08, 0.24);
      const footR = new THREE.Mesh(footGeo, furMat);
      footR.position.set(0.14, 0.08, -0.24);
      group.add(legL, legR, footL, footR);

      // Front Paws
      const armGeo = new THREE.BoxGeometry(0.28, 0.14, 0.14);
      const armL = new THREE.Mesh(armGeo, furMat);
      armL.position.set(0.38, 0.94, 0.22);
      armL.rotation.z = -0.3;
      const armR = armL.clone();
      armR.position.z = -0.22;
      group.add(armL, armR);

      // Long Counter-Balancing Tail
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.18, 0.18), furMat);
      tail.position.set(-0.62, 0.44, 0);
      tail.rotation.z = 0.28;
      group.add(tail);

      return group;
    };

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
    } catch {
      renderer = null;
    }

    if (renderer) {
      // ======================================================================
      // THREE.JS WEBGL 3D SCENE
      // ======================================================================
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0c4a6e);
      scene.fog = new THREE.FogExp2(0x0c4a6e, 0.032);

      const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 120);
      camera.position.set(2.2, 4.6, 8.2);
      camera.lookAt(2.2, 1.0, 0);

      const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x082f49, 1.15);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
      dirLight.position.set(8, 14, 10);
      scene.add(dirLight);

      // Animated 3D Water Plane
      const waterGeo = new THREE.PlaneGeometry(180, 50, 64, 24);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.28,
        metalness: 0.15,
        flatShading: true,
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(20, -0.35, 0);
      scene.add(waterMesh);

      // 3D Hexagonal Stepping Pillars Pool
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.8,
        flatShading: true,
      });
      const topCapMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.55,
        flatShading: true,
      });

      const pillars: Array<{ group: THREE.Group; logicalIndex: number }> = [];
      for (let i = 0; i < TOTAL_PILLARS; i++) {
        const pGroup = new THREE.Group();
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(1.08, 0.88, 2.2, 6),
          stoneMat
        );
        col.position.y = -0.5;
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(1.16, 1.08, 0.28, 6),
          topCapMat
        );
        cap.position.y = 0.65;
        pGroup.add(col, cap);
        pGroup.position.set(i * PILLAR_SPACING, 0, 0);
        scene.add(pGroup);
        pillars.push({ group: pGroup, logicalIndex: i });
      }

      // 3D Kangaroo + Ground Shadow + Landing Ring Ripple
      const kangaroo = buildLowPolyKangaroo();
      kangaroo.position.set(0, 0.8, 0);
      scene.add(kangaroo);

      const shadowMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.62, 18),
        new THREE.MeshBasicMaterial({
          color: 0x020617,
          transparent: true,
          opacity: 0.35,
        })
      );
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, 0.81, 0);
      scene.add(shadowMesh);

      const rippleMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });
      const rippleMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1.15, 24),
        rippleMat
      );
      rippleMesh.rotation.x = -Math.PI / 2;
      rippleMesh.position.set(0, 0.82, 0);
      scene.add(rippleMesh);

      // 3D Splash Droplets
      const dropletMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        roughness: 0.2,
      });
      const droplets: Array<{ mesh: THREE.Mesh; vx: number; vy: number; vz: number }> = [];
      for (let i = 0; i < 14; i++) {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), dropletMat);
        drop.visible = false;
        scene.add(drop);
        const angle = (i / 14) * Math.PI * 2;
        droplets.push({
          mesh: drop,
          vx: Math.cos(angle) * 2.2,
          vy: 3.5 + (i % 3) * 0.9,
          vz: Math.sin(angle) * 2.2,
        });
      }

      let rippleTimer = 0;
      let lastTime = performance.now();

      const animate = (now: number) => {
        frameId = requestAnimationFrame(animate);
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        const elapsed = now * 0.001;

        const st = animRef.current;

        // 1. Animate 3D Water Waves
        const posAttr = waterGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vy = posAttr.getY(i);
          const waveZ =
            Math.sin(vx * 0.45 + elapsed * 2.4) * 0.12 +
            Math.cos(vy * 0.55 + elapsed * 1.9) * 0.08;
          posAttr.setZ(i, waveZ);
        }
        posAttr.needsUpdate = true;
        waterMesh.position.x = st.cameraX + 12;

        // 2. Recycle Pillars Ahead of Camera
        const minLogicalNeeded = Math.max(0, st.targetPillarIndex - 2);
        for (const p of pillars) {
          if (p.logicalIndex < minLogicalNeeded) {
            const maxIdx = Math.max(...pillars.map((item) => item.logicalIndex));
            p.logicalIndex = maxIdx + 1;
          }
          const isCurrentPillar = p.logicalIndex === st.targetPillarIndex;
          const floatOffset = Math.sin(elapsed * 2.2 + p.logicalIndex * 0.9) * 0.05;
          const sinkOffset =
            isCurrentPillar && st.state === "idle"
              ? -st.sinkFactor
              : isCurrentPillar && st.state === "splashing"
              ? -1.25 * st.progress
              : 0;
          p.group.position.set(
            p.logicalIndex * PILLAR_SPACING,
            floatOffset + sinkOffset,
            0
          );
        }

        // 3. Kangaroo Parabolic Jump / Idle Breathing / Splash
        if (st.state === "jumping") {
          st.progress = Math.min(1, st.progress + dt * 2.5);
          const t = st.progress;
          const startX = st.startPillarIndex * PILLAR_SPACING;
          const endX = st.targetPillarIndex * PILLAR_SPACING;
          const curX = startX + (endX - startX) * t;
          const peakH = st.jumpSpan > 1 ? 2.8 : 1.95;
          // Parabolic trajectory: y = 4 * h * t * (1 - t)
          const arcY = 4 * peakH * t * (1 - t);

          kangaroo.position.set(curX, 0.8 + arcY, 0);
          kangaroo.rotation.z = -Math.sin(t * Math.PI) * 0.35;
          kangaroo.scale.set(
            1 + Math.sin(t * Math.PI) * 0.08,
            1 - Math.cos(t * Math.PI * 2) * 0.08,
            1
          );

          shadowMesh.position.set(curX, 0.81, 0);
          const shadowScale = Math.max(0.35, 1 - arcY * 0.25);
          shadowMesh.scale.set(shadowScale, shadowScale, 1);

          if (st.progress >= 1) {
            st.state = "idle";
            st.progress = 0;
            kangaroo.rotation.z = 0;
            kangaroo.scale.set(1, 1, 1);
            rippleTimer = 1.0;
            rippleMesh.position.set(endX, 0.82, 0);
          }
        } else if (st.state === "splashing") {
          st.progress = Math.min(1, st.progress + dt * 2.1);
          const curX = st.targetPillarIndex * PILLAR_SPACING;
          kangaroo.position.set(curX, 0.8 - st.progress * 1.65, 0);
          kangaroo.rotation.z = st.progress * 0.65;
          shadowMesh.visible = false;

          for (const d of droplets) {
            d.mesh.visible = true;
            const t = st.progress * 0.65;
            d.mesh.position.set(
              curX + d.vx * t,
              0.2 + d.vy * t - 4.9 * t * t,
              d.vz * t
            );
          }
        } else {
          const curX = st.targetPillarIndex * PILLAR_SPACING;
          const breathe = Math.sin(elapsed * 4.2) * 0.04;
          kangaroo.position.set(curX, 0.8 - st.sinkFactor + breathe, 0);
          kangaroo.rotation.z = 0;
          kangaroo.scale.set(1, 1 + breathe * 0.8, 1);
          shadowMesh.visible = true;
          shadowMesh.position.set(curX, 0.81 - st.sinkFactor, 0);
          shadowMesh.scale.set(1, 1, 1);
          for (const d of droplets) d.mesh.visible = false;
        }

        // 4. Landing Ring Ripple
        if (rippleTimer > 0) {
          rippleTimer = Math.max(0, rippleTimer - dt * 2.2);
          const rScale = 1 + (1 - rippleTimer) * 0.85;
          rippleMesh.scale.set(rScale, rScale, 1);
          rippleMat.opacity = rippleTimer * 0.7;
        } else {
          rippleMat.opacity = 0;
        }

        // 5. Smooth Camera Tracking + Shake
        const desiredCamX = kangaroo.position.x + 1.8;
        st.cameraX += (desiredCamX - st.cameraX) * Math.min(1, dt * 8);
        if (st.shakeIntensity > 0) {
          st.shakeIntensity = Math.max(0, st.shakeIntensity - dt * 0.8);
        }
        const shakeX = (Math.random() - 0.5) * st.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * st.shakeIntensity;

        camera.position.set(st.cameraX + shakeX, 4.4 + shakeY, 8.0);
        camera.lookAt(st.cameraX + 0.5, 1.0, 0);

        renderer.render(scene, camera);
      };

      frameId = requestAnimationFrame(animate);

      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth || 390;
        const h = container.clientHeight || 260;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", handleResize);
        renderer?.dispose();
      };
    }

    // ========================================================================
    // HARDWARE-ACCELERATED 2D/3D CANVAS FALLBACK (IF HEADLESS / NO WEBGL)
    // ========================================================================
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.innerHTML = "";
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let lastTime = performance.now();
    const renderFallback = (now: number) => {
      frameId = requestAnimationFrame(renderFallback);
      if (!ctx) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const st = animRef.current;

      if (st.state === "jumping") {
        st.progress = Math.min(1, st.progress + dt * 2.5);
        if (st.progress >= 1) {
          st.state = "idle";
          st.progress = 0;
        }
      } else if (st.state === "splashing") {
        st.progress = Math.min(1, st.progress + dt * 2.1);
      }

      const w = canvas.width;
      const h = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0c4a6e");
      grad.addColorStop(1, "#0284c7");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw 3D isometric hexagonal pillars
      const basePillarX = w * 0.28;
      const stepPx = 110;
      for (let i = 0; i < 4; i++) {
        const px = basePillarX + i * stepPx;
        const py = h * 0.68 + (i === 0 ? st.sinkFactor * 28 : 0);
        ctx.fillStyle = "#475569";
        ctx.fillRect(px - 34, py, 68, 70);
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.ellipse(px, py, 36, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw 3D Kangaroo silhouette on parabolic curve
      const t = st.state === "jumping" ? st.progress : 0;
      const kx = basePillarX + t * stepPx;
      const ky =
        h * 0.65 -
        4 * 65 * t * (1 - t) +
        (st.state === "splashing" ? st.progress * 45 : st.sinkFactor * 28);

      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(kx, ky - 22, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(kx - 6, ky - 52, 8, 20);
      ctx.fillRect(kx + 4, ky - 52, 8, 20);
    };

    frameId = requestAnimationFrame(renderFallback);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleRestart = () => {
    setLives(3);
    setScore(0);
    setStreak(0);
    setHopsCount(0);
    setGameOver(false);
    setSelectedOptionIdx(null);
    setAnswerFeedback(null);
    setMissedItems([]);
    setTimeLeftMs(QUESTION_DURATION_MS);
    setRoundSeed((s) => s + 1);
    setQIndex(0);
    animRef.current = {
      state: "idle",
      progress: 0,
      startPillarIndex: 0,
      targetPillarIndex: 0,
      jumpSpan: 1,
      cameraX: 0,
      shakeIntensity: 0,
      sinkFactor: 0,
    };
  };

  const handleSaveMissedWord = (q: ArcadeReflexQuestion) => {
    if (!onSaveVocab || savedIds[q.id]) return;
    onSaveVocab({
      word: q.targetTerm || q.correctText,
      meaning: q.shortTip,
      collocations: q.category,
      example: q.stem.replace(/_{2,}/g, q.correctText),
    });
    setSavedIds((prev) => ({ ...prev, [q.id]: true }));
  };

  const timePercent = Math.max(
    0,
    Math.min(100, (timeLeftMs / QUESTION_DURATION_MS) * 100)
  );
  const LETTERS = ["A", "B", "C", "D"];

  return (
    <div className="max-w-2xl mx-auto flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
      {/* ==================================================================== */}
      {/* TOP 55% OF SCREEN: 3D RIVER & KANGAROO VIEWPORT                      */}
      {/* ==================================================================== */}
      <div className="relative h-[42vh] min-h-[240px] max-h-[340px] w-full bg-sky-950 overflow-hidden select-none">
        <div ref={mountRef} className="w-full h-full" />

        {/* Top HUD Bar */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Lives & Hops */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/75 backdrop-blur-xs border border-white/10">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition ${
                  i < lives
                    ? "text-rose-500 fill-rose-500"
                    : "text-slate-600"
                }`}
              />
            ))}
            <span className="ml-1.5 text-xs font-bold text-white">
              {hopsCount} bước
            </span>
          </div>

          {/* Score & Streak */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/75 backdrop-blur-xs border border-white/10 text-xs font-bold text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>{streak}x</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/75 backdrop-blur-xs border border-white/10 text-xs font-bold text-emerald-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>{score} XP</span>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="w-8 h-8 rounded-xl bg-slate-950/75 backdrop-blur-xs border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition"
              aria-label="Âm thanh"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setQIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                category === cat.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "bg-slate-950/65 text-slate-200 hover:bg-slate-900/90 border border-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Non-blocking Floating +XP Popups */}
        <div className="absolute top-14 right-3 flex flex-col items-end gap-1.5 pointer-events-none">
          {xpPopups.map((p) => (
            <div
              key={p.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-xs transition-all ${
                p.isPositive
                  ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/90 border-rose-500/40 text-rose-200"
              }`}
            >
              <div>{p.text}</div>
              <div className="text-[10px] font-medium opacity-85">{p.subtext}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Smooth Timer Progress Bar */}
      <div className="h-1.5 w-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${
            timePercent > 50
              ? "bg-emerald-500"
              : timePercent > 25
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
          style={{ width: `${timePercent}%` }}
        />
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM 45% OF SCREEN: QUESTION CARD & 2x2 THUMB-FRIENDLY BUTTONS     */}
      {/* ==================================================================== */}
      {!gameOver && currentQuestion ? (
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3.5">
          {/* Question Header & Stem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>
                Câu {qIndex + 1} • {currentQuestion.category}
              </span>
              <span>{(timeLeftMs / 1000).toFixed(1)}s</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug min-h-[2.75rem]">
              {currentQuestion.stem}
            </p>
          </div>

          {/* 2x2 Thumb-Friendly Answer Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {currentQuestion.options.map((optText, idx) => {
              const isSelected = selectedOptionIdx === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;
              let btnStyle =
                "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 hover:border-indigo-500";

              if (selectedOptionIdx !== null) {
                if (isCorrectOption) {
                  btnStyle =
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200";
                } else if (isSelected && !isCorrectOption) {
                  btnStyle =
                    "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={selectedOptionIdx !== null}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`min-h-[58px] p-3 rounded-xl border-2 text-left flex items-center gap-2.5 transition transform active:scale-95 ${btnStyle}`}
                >
                  <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {LETTERS[idx]}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold leading-tight break-words">
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Instant Short Explanation Strip */}
          {answerFeedback && (
            <div
              className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                answerFeedback === "correct"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200"
              }`}
            >
              {answerFeedback === "correct" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="line-clamp-2">{currentQuestion.shortTip}</span>
            </div>
          )}
        </div>
      ) : (
        /* Game Over Summary Screen */
        <div className="p-5 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hoàn thành lượt nhảy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tổng điểm: {score} XP • Chuỗi cao nhất: {bestStreak}x • {hopsCount} bước nhảy
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestart}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Chơi lại</span>
            </button>
          </div>

          {missedItems.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Các câu cần lưu ý ({missedItems.length})
              </p>
              {missedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">
                      {item.correctText}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {item.shortTip}
                    </div>
                  </div>
                  {onSaveVocab && (
                    <button
                      type="button"
                      disabled={Boolean(savedIds[item.id])}
                      onClick={() => handleSaveMissedWord(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{savedIds[item.id] ? "Đã lưu" : "Lưu từ"}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
