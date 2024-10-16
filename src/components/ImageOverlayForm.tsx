import React, { useState } from "react";

export interface ImageOverlay {
  file: File;
  fileName: string;
  x: number;
  y: number;
  startTime: number;
  endTime: number;
}

interface ImageOverlayFormProps {
  onAddImageOverlay: (imageOverlay: ImageOverlay) => void;
}

const ImageOverlayForm = ({ onAddImageOverlay }: ImageOverlayFormProps) => {
  const [imageOverlay, setImageOverlay] = useState<Partial<ImageOverlay>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageOverlay((prev) => ({ ...prev, file, fileName: file.name }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setImageOverlay((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageOverlay.file && imageOverlay.fileName) {
      onAddImageOverlay(imageOverlay as ImageOverlay);
      // 입력 필드 초기화
      setImageOverlay({});
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Image:
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </label>
      <label>
        X:
        <input
          type="number"
          name="x"
          value={imageOverlay.x || ""}
          onChange={handleChange}
        />
      </label>
      <button type="submit">이미지 오버레이 추가</button>
    </form>
  );
};

export default ImageOverlayForm;
