import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { PostWithAuthor } from "@shared/schema";

const SOCIAL_MEDIA_BOTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'Googlebot',
  'bingbot',
  'Embedly',
  'Quora Link Preview',
  'Showyoubot',
  'outbrain',
  'vkShare',
  'W3C_Validator',
  'redditbot',
  'Applebot',
  'SkypeUriPreview',
];

function isSocialMediaBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return SOCIAL_MEDIA_BOTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeUrl(url: string): string {
  // First escape HTML entities in the URL
  const escaped = escapeHtml(url);
  // Validate URL scheme - only allow http/https
  try {
    const parsed = new URL(url, 'https://lumina.app');
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
  } catch {
    // If URL can't be parsed, just escape and return
  }
  return escaped;
}

function getFullMediaUrl(mediaUrl: string | null, req: Request): string | null {
  if (!mediaUrl) return null;
  
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'lumina.app';
  const baseUrl = `${protocol}://${host}`;
  
  if (mediaUrl.startsWith('http')) {
    return mediaUrl;
  }
  
  return `${baseUrl}${mediaUrl}`;
}

function generateOgHtml(post: PostWithAuthor, req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'lumina.app';
  const baseUrl = `${protocol}://${host}`;
  const postUrl = escapeUrl(`${baseUrl}/post/${post.id}`);
  
  const authorName = escapeHtml(post.author.displayName || post.author.username || 'Lumina User');
  const content = post.content ? escapeHtml(post.content.slice(0, 200)) : '';
  const description = content || `Check out this ${post.postType} by ${authorName} on Lumina!`;
  const title = content ? `${authorName}: "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"` : `${post.postType === 'video' ? 'Video' : 'Post'} by ${authorName}`;
  
  // Escape all URLs to prevent XSS
  const rawMediaUrl = getFullMediaUrl(post.mediaUrl, req);
  const rawThumbnailUrl = getFullMediaUrl(post.thumbnailUrl, req);
  const rawAuthorAvatar = getFullMediaUrl(post.author.avatarUrl, req);
  // Get hlsUrl for Mux videos (cast to access property not in type)
  const rawHlsUrl = (post as any).hlsUrl as string | null;
  
  const mediaUrl = rawMediaUrl ? escapeUrl(rawMediaUrl) : null;
  const authorAvatar = rawAuthorAvatar ? escapeUrl(rawAuthorAvatar) : null;
  
  // For Mux videos, extract playback ID and generate MP4 URL for Facebook compatibility
  // HLS URL format: https://stream.mux.com/{playbackId}.m3u8
  // MP4 URL format: https://stream.mux.com/{playbackId}/high.mp4
  let mp4Url: string | null = null;
  if (rawHlsUrl && rawHlsUrl.includes('stream.mux.com')) {
    const muxMatch = rawHlsUrl.match(/stream\.mux\.com\/([^/.]+)/);
    if (muxMatch && muxMatch[1]) {
      mp4Url = escapeUrl(`https://stream.mux.com/${muxMatch[1]}/high.mp4`);
    }
  }
  
  // For OG video, prefer MP4 (Facebook compatible) over HLS
  const videoStreamUrl = mp4Url || (rawHlsUrl ? escapeUrl(rawHlsUrl) : mediaUrl);
  
  const isVideo = post.postType === 'video';
  const ogType = isVideo ? 'video.other' : 'article';
  
  // For og:image, we need an actual image, not a video file
  // Priority: 1) explicit thumbnail, 2) for images: the media itself, 3) default og-image
  const defaultOgImage = escapeUrl(`${baseUrl}/og-image.png`);
  let imageUrl: string;
  
  if (rawThumbnailUrl) {
    // Use explicit thumbnail if available
    imageUrl = escapeUrl(rawThumbnailUrl);
  } else if (!isVideo && rawMediaUrl) {
    // For image posts, use the media URL as the og:image
    imageUrl = escapeUrl(rawMediaUrl);
  } else {
    // For videos without thumbnails, use default og-image
    imageUrl = defaultOgImage;
  }
  
  // Use MP4 type for Facebook compatibility (MP4 is preferred), HLS as fallback
  const videoType = mp4Url ? 'video/mp4' : (rawHlsUrl ? 'application/x-mpegURL' : 'video/mp4');
  
  let videoTags = '';
  if (isVideo && videoStreamUrl) {
    videoTags = `
    <meta property="og:video" content="${videoStreamUrl}" />
    <meta property="og:video:secure_url" content="${videoStreamUrl}" />
    <meta property="og:video:type" content="${videoType}" />
    <meta property="og:video:width" content="1280" />
    <meta property="og:video:height" content="720" />
    <meta name="twitter:card" content="player" />
    <meta name="twitter:player" content="${postUrl}" />
    <meta name="twitter:player:width" content="1280" />
    <meta name="twitter:player:height" content="720" />`;
  } else {
    videoTags = `
    <meta name="twitter:card" content="summary_large_image" />`;
  }
  
  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | Lumina</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="${escapeHtml(title)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Lumina" />
    ${videoTags}
    
    <!-- Twitter -->
    <meta name="twitter:url" content="${postUrl}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:site" content="@JoinLumina" />
    <meta name="twitter:creator" content="@${escapeHtml(post.author.username || '')}" />
    
    <!-- Article specific -->
    <meta property="article:author" content="${authorName}" />
    <meta property="article:published_time" content="${post.createdAt}" />
    
    <!-- Redirect to actual page for humans -->
    <meta http-equiv="refresh" content="0;url=${postUrl}" />
    <link rel="canonical" href="${postUrl}" />
    
    <link rel="icon" type="image/png" href="${baseUrl}/favicon.png" />
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        text-align: center;
      }
      .logo {
        font-size: 2rem;
        font-weight: bold;
        background: linear-gradient(90deg, #22c55e, #10b981);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
      }
      .message {
        color: #888;
        margin-bottom: 1.5rem;
      }
      .btn {
        display: inline-block;
        background: linear-gradient(90deg, #22c55e, #10b981);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
      }
      .author {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 1rem;
      }
      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #333;
      }
      .content {
        background: rgba(255,255,255,0.05);
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        text-align: left;
      }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Lumina</div>
        <div class="author">
            ${authorAvatar ? `<img src="${authorAvatar}" class="avatar" alt="${authorName}" />` : '<div class="avatar"></div>'}
            <strong>${authorName}</strong>
        </div>
        ${content ? `<div class="content">${escapeHtml(content)}</div>` : ''}
        <p class="message">Redirecting you to the post...</p>
        <a href="${postUrl}" class="btn">View on Lumina</a>
    </div>
</body>
</html>`;
}

export async function ogTagMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers['user-agent'];
  
  if (!isSocialMediaBot(userAgent)) {
    return next();
  }
  
  const postMatch = req.path.match(/^\/post\/([a-zA-Z0-9-]+)$/);
  
  if (!postMatch) {
    return next();
  }
  
  const postId = postMatch[1];
  
  try {
    const post = await storage.getPost(postId);
    
    if (!post) {
      return next();
    }
    
    const html = generateOgHtml(post, req);
    
    res.status(200)
      .set('Content-Type', 'text/html')
      .set('Cache-Control', 'public, max-age=3600')
      .send(html);
      
  } catch (error) {
    console.error('OG tag renderer error:', error);
    return next();
  }
}
