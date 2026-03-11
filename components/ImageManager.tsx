"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Upload, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing-client";
import { useAuth } from "@/contexts/AuthContext";

interface ImageManagerProps {
  images: string[];
  onImagesChange: (newImages: string[]) => void;
}

const TARGET_SIZE_BYTES = 100 * 1024; // 100 KB
const MAX_DIMENSION = 1920;

/**
 * Compress an image File using the Canvas API.
 * Reduces quality and/or dimensions iteratively until the blob is under
 * TARGET_SIZE_BYTES. Always returns a File so it can be passed to startUpload.
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Determine initial dimensions, capping at MAX_DIMENSION.
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file); // canvas unsupported — skip compression

      const tryCompress = (w: number, h: number, quality: number) => {
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);

            if (blob.size <= TARGET_SIZE_BYTES || (quality <= 0.3 && w <= 400)) {
              // Good enough — wrap back into a File preserving the original name.
              const compressed = new File([blob], file.name, { type: "image/jpeg" });
              resolve(compressed);
              return;
            }

            // Still too large: reduce quality first, then shrink dimensions.
            if (quality > 0.3) {
              tryCompress(w, h, parseFloat((quality - 0.1).toFixed(1)));
            } else {
              const scale = 0.75;
              tryCompress(Math.round(w * scale), Math.round(h * scale), 0.7);
            }
          },
          "image/jpeg",
          quality,
        );
      };

      tryCompress(width, height, 0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // if loading fails just pass original through
    };

    img.src = objectUrl;
  });
}

const ImageManager = ({ images, onImagesChange }: ImageManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { user } = useAuth();

  // Keep a ref so the upload callback always sees the latest images array,
  // even though useUploadThing memoises its options from the first render.
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const { startUpload } = useUploadThing("imageUploader", {
    headers: async () => {
      const token = user ? await user.getIdToken() : null;
      return token ? { Authorization: `Bearer ${token}` } : ({} as HeadersInit);
    },
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      if (res && res.length > 0) {
        // Use ufsUrl (current API); fall back to url for older versions.
        const newUrls = res.map((f) => f.ufsUrl ?? f.url).filter(Boolean);
        // Use imagesRef so we always append to the current list,
        // not the stale list captured when the hook was first initialised.
        onImagesChange([...imagesRef.current, ...newUrls]);
        toast.success(`${res.length} image(s) uploaded successfully`);
      }
    },
    onUploadError: (error) => {
      setIsUploading(false);
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success("Image removed");
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot the FileList before resetting the input (resetting empties the live FileList).
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";
    setIsUploading(true);

    try {
      // Compress every file to < 100 KB before uploading so we stay well within
      // Firestore document limits and reduce bandwidth.
      const compressed = await Promise.all(files.map(compressImage));
      const savings = files.reduce((acc, f, i) => acc + (f.size - compressed[i].size), 0);
      if (savings > 0) {
        console.info(
          `[ImageManager] Compressed ${files.length} image(s), saved ${(savings / 1024).toFixed(1)} KB`,
        );
      }
      await startUpload(compressed);
    } catch (err) {
      setIsUploading(false);
      toast.error("Failed to compress images");
      console.error("Compression error:", err);
    }
    // isUploading is reset inside onClientUploadComplete / onUploadError
  };

  return (
    <div className="space-y-4">
      {/* Current Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group cursor-move overflow-hidden ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
            >
              <div className="aspect-square relative">
                <img
                  src={image}
                  alt={`Venue image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 bg-black/60 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white" />
                </div>

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    Primary
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <div className="p-8 text-center">
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-colors ${
              isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Images
              </>
            )}
          </label>
          <p className="text-sm text-gray-500 mt-4">
            Drag to reorder • First image will be the primary display
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Supported formats: JPG, PNG, GIF (Max 5MB each)
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ImageManager;
