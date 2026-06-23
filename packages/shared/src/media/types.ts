// Provider-agnostic media interface.
//
// Video → Mux, images → Supabase Storage (decided; see open-decisions). These types
// are isomorphic so app code can speak in terms of uploads/playback without knowing
// the vendor. The concrete implementation that holds vendor SDKs + secrets lives in
// @reelworx/shared/server (server-only). Schema mirrors this with `videoProvider`
// and `videoAssetId`, so swapping a provider never requires a migration.

export type VideoProvider = 'mux' | 'cloudinary';

/** A short-lived direct-upload target handed to the client so large video never
 *  proxies through our server. */
export interface DirectUpload {
  uploadId: string;
  uploadUrl: string;
  provider: VideoProvider;
}

/** Resolved playback handles for a processed video asset. */
export interface VideoPlayback {
  assetId: string;
  playbackId: string;
  hlsUrl: string; // adaptive stream for native players (expo-video / web)
  thumbnailUrl: string;
  posterUrl: string;
}

export interface ImageUploadResult {
  path: string;
  publicUrl: string;
}

export interface MediaService {
  /** Create a direct-upload URL for a video (intro video, Reel footage). */
  createVideoUpload(opts?: { corsOrigin?: string }): Promise<DirectUpload>;
  /** Resolve playback info once an upload has been processed into an asset. */
  getVideoPlayback(assetId: string): Promise<VideoPlayback>;
  /** Build a playback bundle directly from a known playback id (no API call). */
  playbackFromId(assetId: string, playbackId: string): VideoPlayback;
  /** Create a signed URL the client can PUT an image to (profile photo, thumbnail). */
  createImageUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ uploadUrl: string; token: string; path: string }>;
  /** Public URL for a stored image. */
  getImagePublicUrl(bucket: string, path: string): string;
}
