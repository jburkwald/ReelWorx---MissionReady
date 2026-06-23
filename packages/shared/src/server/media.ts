// Media service implementation — SERVER ONLY (holds vendor secrets).
//
// Video → Mux, images → Supabase Storage. Clients are constructed lazily so this
// module imports cleanly without env vars present; the error only surfaces when a
// method is actually called without credentials.

import Mux from '@mux/mux-node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  DirectUpload,
  ImageUploadResult,
  MediaService,
  VideoPlayback,
} from '../media/types';

let muxClient: Mux | null = null;
function mux(): Mux {
  if (!muxClient) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (!tokenId || !tokenSecret) {
      throw new Error('MUX_TOKEN_ID / MUX_TOKEN_SECRET are not set.');
    }
    muxClient = new Mux({ tokenId, tokenSecret });
  }
  return muxClient;
}

let supabaseClient: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.');
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

function muxPlayback(assetId: string, playbackId: string): VideoPlayback {
  return {
    assetId,
    playbackId,
    hlsUrl: `https://stream.mux.com/${playbackId}.m3u8`,
    thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
    posterUrl: `https://image.mux.com/${playbackId}/thumbnail.png?time=0`,
  };
}

export const media: MediaService = {
  async createVideoUpload(opts): Promise<DirectUpload> {
    const upload = await mux().video.uploads.create({
      cors_origin: opts?.corsOrigin ?? '*',
      new_asset_settings: { playback_policy: ['public'] },
    });
    if (!upload.url) throw new Error('Mux did not return an upload URL.');
    return { uploadId: upload.id, uploadUrl: upload.url, provider: 'mux' };
  },

  async getVideoPlayback(assetId): Promise<VideoPlayback> {
    const asset = await mux().video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) {
      throw new Error(`Mux asset ${assetId} has no playback id yet.`);
    }
    return muxPlayback(assetId, playbackId);
  },

  playbackFromId(assetId, playbackId): VideoPlayback {
    return muxPlayback(assetId, playbackId);
  },

  async createImageUploadUrl(bucket, path) {
    const { data, error } = await supabase()
      .storage.from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data) {
      throw new Error(`Supabase signed upload URL failed: ${error?.message}`);
    }
    return { uploadUrl: data.signedUrl, token: data.token, path: data.path };
  },

  getImagePublicUrl(bucket, path): string {
    return supabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },
};

export type { MediaService, DirectUpload, VideoPlayback, ImageUploadResult };
