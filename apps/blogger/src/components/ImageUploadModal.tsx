"use client";

import { useState, useCallback, useRef } from "react";
import { Modal, Button, Group, Stack, SegmentedControl, Alert, Text } from "@mantine/core";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { readFileAsDataURL, processAndPack, type CropArea } from "../lib/image";

interface ImageUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onInsert: (url: string, alt: string) => void;
}

const ASPECTS: Record<string, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
};

export default function ImageUploadModal({ opened, onClose, onInsert }: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectKey, setAspectKey] = useState<string>("16:9");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    setError(null);
    setFile(f);
    try {
      const dataUrl = await readFileAsDataURL(f);
      setImageSrc(dataUrl);
    } catch {
      setError("无法读取图片");
    }
  };

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const upload = async (useCrop: boolean) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const cropArea: CropArea | null = useCrop ? croppedAreaPixels : null;
      const finalFile = await processAndPack(file, cropArea);
      const formData = new FormData();
      formData.append("file", finalFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `上传失败 (${res.status})`);
      }
      const { url } = (await res.json()) as { url: string };
      const alt = file.name.replace(/\.[a-zA-Z0-9]+$/, "");
      onInsert(url, alt);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="插入图片" size="lg">
      <Stack gap="md">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} hidden />
        {!imageSrc ? (
          <Button onClick={() => inputRef.current?.click()}>选择图片</Button>
        ) : (
          <>
            <div style={{ position: "relative", height: 320, background: "#000", borderRadius: 4 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECTS[aspectKey]}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <Group justify="space-between">
              <SegmentedControl
                size="xs"
                value={aspectKey}
                onChange={setAspectKey}
                data={["16:9", "4:3", "1:1"]}
              />
              <Text size="xs" c="dimmed">
                缩放
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ marginLeft: 8, verticalAlign: "middle" }}
                />
              </Text>
            </Group>
            <Group justify="apart">
              <Button variant="subtle" onClick={() => inputRef.current?.click()}>
                重新选择
              </Button>
              <Group>
                <Button variant="default" loading={uploading} onClick={() => upload(false)}>
                  直接上传
                </Button>
                <Button loading={uploading} onClick={() => upload(true)}>
                  裁剪并上传
                </Button>
              </Group>
            </Group>
          </>
        )}
        {error && <Alert color="red">{error}</Alert>}
      </Stack>
    </Modal>
  );
}
