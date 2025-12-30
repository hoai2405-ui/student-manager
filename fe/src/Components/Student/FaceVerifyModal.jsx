import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Modal, Space, Spin, Typography, message } from "antd";
import * as faceapi from "face-api.js";

const { Text } = Typography;

const MODEL_URL = "/models";

async function loadModelsOnce() {
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

async function imageToDescriptor(imageSrc) {
  const img = await faceapi.fetchImage(imageSrc);
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor || null;
}

async function videoToDescriptor(videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor || null;
}

export default function FaceVerifyModal({
  open,
  onCancel,
  onVerified,
  referenceImage,
  title = "Xác thực khuôn mặt",
  threshold = 0.55,
  mode = "verify", // 'verify' (compare with referenceImage) | 'enroll' (capture descriptor only)
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [modelsLoading, setModelsLoading] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const [referenceDescriptor, setReferenceDescriptor] = useState(null);

  const canVerify = useMemo(() => {
    if (mode === "enroll") return true;
    return referenceImage ? Boolean(referenceDescriptor) : true;
  }, [mode, referenceImage, referenceDescriptor]);

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
    }
    streamRef.current = null;

    const v = videoRef.current;
    if (v) {
      v.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
    } catch (e) {
      setError(
        e?.message ||
          "Không mở được camera. Hãy cấp quyền camera và dùng HTTPS khi lên VPS."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      setModelsLoading(true);
      setError(null);
      try {
        await loadModelsOnce();
        if (cancelled) return;

        if (mode !== "enroll") {
          if (!referenceImage) {
            setReferenceDescriptor(null);
            return;
          }

          const desc = await imageToDescriptor(referenceImage);
          if (cancelled) return;

          if (!desc) {
            setError("Không nhận diện được khuôn mặt trong ảnh chân dung mẫu.");
            return;
          }

          setReferenceDescriptor(desc);
        }
      } catch (e) {
        setError(e?.message || "Không tải được model nhận diện khuôn mặt.");
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [open, referenceImage, mode]);

  useEffect(() => {
    if (!open) return;
    if (modelsLoading) return;

    startCamera();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modelsLoading]);

  const handleVerify = async () => {
    if (!videoRef.current) return;
    setVerifying(true);
    setError(null);

    try {
      const v = videoRef.current;

      const attempts = 3;
      let bestDistance = Number.POSITIVE_INFINITY;
      let bestLiveDesc = null;

      for (let i = 0; i < attempts; i++) {
        // small delay between attempts
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 250));
        // eslint-disable-next-line no-await-in-loop
        const liveDesc = await videoToDescriptor(v);
        if (!liveDesc) continue;

        if (mode === "enroll" || !referenceDescriptor) {
          bestLiveDesc = liveDesc;
          break;
        }

        const distance = faceapi.euclideanDistance(referenceDescriptor, liveDesc);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestLiveDesc = liveDesc;
        }
      }

      if (!bestLiveDesc) {
        setError("Không nhận diện được khuôn mặt từ camera. Hãy nhìn thẳng vào camera.");
        return;
      }

      if (mode === "enroll") {
        message.success("Đã chụp ảnh mẫu");
        onVerified?.({ descriptor: Array.from(bestLiveDesc) });
        return;
      }

      if (!referenceDescriptor) {
        onVerified?.({ descriptor: Array.from(bestLiveDesc) });
        return;
      }

      if (bestDistance <= threshold) {
        message.success("Xác thực thành công");
        onVerified?.({ distance: bestDistance, descriptor: Array.from(bestLiveDesc) });
      } else {
        setError(`Xác thực thất bại (độ lệch ${bestDistance.toFixed(3)}).`);
      }
    } catch (e) {
      setError(e?.message || "Xác thực thất bại.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            onClick={handleVerify}
            loading={verifying}
            disabled={modelsLoading || cameraLoading || !canVerify}
          >
            Xác thực
          </Button>
        </Space>
      }
      width={520}
      destroyOnHidden
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {modelsLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Spin /> <Text>Đang tải model...</Text>
          </div>
        ) : null}

        {error ? <Alert type="error" showIcon message={error} /> : null}

        <div
          style={{
            width: "100%",
            aspectRatio: "4/3",
            background: "#000",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            playsInline
            muted
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text type="secondary">Ngưỡng: {threshold}</Text>
          {cameraLoading ? <Text>Đang mở camera...</Text> : null}
        </div>
      </div>
    </Modal>
  );
}
