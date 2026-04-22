const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const fileType = require('file-type');

// Cloudinary is auto-configured from CLOUDINARY_URL env variable
// Fallback configuration for development
if (!process.env.CLOUDINARY_URL) {
  console.warn('CLOUDINARY_URL environment variable not set. Image uploads will not work.');
  console.log('Please create a .env file with your Cloudinary credentials:');
  console.log('CLOUDINARY_URL=cloudinary://YOUR_API_KEY:YOUR_API_SECRET@YOUR_CLOUD_NAME');
}


const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 

];

const MAX_FILE_SIZE = 5 * 1024 * 1024; 

class ImageService {
  constructor() {
    // Track images by room and user for cleanup
    this.userProfileImages = new Map(); // username -> { publicId, url, roomCode }
    this.mapImages = new Map(); // roomCode -> { publicId, url, createdBy }
    this.tempMapImages = new Map(); // roomCode -> { publicId, url, expiresAt }
  }

  // Enhanced file validation function
  async validateFileContent(buffer, mimetype) {
    try {
      // Verify file type using magic numbers
      const typeInfo = await fileType.fileTypeFromBuffer(buffer);
      
      console.log(`File validation - Declared MIME: ${mimetype}, Detected MIME: ${typeInfo?.mime}`);
      
      if (!typeInfo) {
        throw new Error('Invalid file format');
      }
      
      // Check if detected MIME type matches allowed types
      if (!ALLOWED_MIME_TYPES.includes(typeInfo.mime)) {
        throw new Error(`File type ${typeInfo.mime} not allowed`);
      }
      
      // Check if declared MIME type matches detected type (this was removed by user)
      if (mimetype !== typeInfo.mime) {
        console.log(`MIME type mismatch - Declared: ${mimetype}, Detected: ${typeInfo.mime}`);
        throw new Error(`File MIME type mismatch: declared ${mimetype}, detected ${typeInfo.mime}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  // Sanitize filename
  sanitizeFilename(filename) {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
    console.log(`Starting Cloudinary upload: ${filename} to folder ${sanitizedName}`);
    return `${sanitizedName}${ext}`;
  }

  // Helper: upload buffer to Cloudinary
  async uploadToCloudinary(buffer, originalname, folder = 'images', options = {}) {
    const nameWithoutExt = path.basename(originalname, path.extname(originalname));

    console.log(`Starting Cloudinary upload: ${originalname} to folder ${folder}`);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: nameWithoutExt,
          overwrite: options.overwrite || false,
          use_filename: true,
          unique_filename: options.unique_filename !== false,
          ...options
        },
        (error, result) => {
          if (error) {
            console.error(`Cloudinary upload failed:`, error);
            return reject(error);
          }
          console.log(`Cloudinary upload successful: ${result.public_id} -> ${result.secure_url}`);
          resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  // Upload user profile image
  async uploadUserProfile(username, roomCode, buffer, originalname, mimetype) {
    try {
      await this.validateFileContent(buffer, mimetype);
      
      const sanitizedUsername = this.sanitizeFilename(username);
      const folder = `profiles/${roomCode}`;
      const result = await this.uploadToCloudinary(buffer, sanitizedUsername, folder, {
        overwrite: true,
        unique_filename: false
      });

      const profileData = {
        username,
        roomCode,
        publicId: result.public_id,
        url: result.secure_url,
        uploadedAt: new Date()
      };

      // Store profile reference
      this.userProfileImages.set(username, profileData);

      console.log(`Profile image uploaded for ${username} in room ${roomCode}`);
      return profileData;
    } catch (error) {
      console.error(`Failed to upload profile for ${username}:`, error);
      throw error;
    }
  }

  // Upload map image (temporary - cleaned up on room close)
  async uploadMapImage(roomCode, createdBy, buffer, originalname, mimetype) {
    try {
      await this.validateFileContent(buffer, mimetype);
      
      const sanitizedName = this.sanitizeFilename(originalname);
      const folder = `maps/${roomCode}`;
      const result = await this.uploadToCloudinary(buffer, sanitizedName, folder, {
        overwrite: true,
        unique_filename: false
      });

      const mapData = {
        roomCode,
        createdBy,
        publicId: result.public_id,
        url: result.secure_url,
        uploadedAt: new Date()
      };

      // Store map reference
      this.mapImages.set(roomCode, mapData);

      console.log(`Map image uploaded for room ${roomCode} by ${createdBy}`);
      return mapData;
    } catch (error) {
      console.error(`Failed to upload map for room ${roomCode}:`, error);
      throw error;
    }
  }

  // Get user profile image
  getUserProfile(username) {
    return this.userProfileImages.get(username);
  }

  // Get map image
  getMapImage(roomCode) {
    return this.mapImages.get(roomCode);
  }

  // Update user profile image
  async updateUserProfile(username, roomCode, buffer, originalname, mimetype) {
    // Delete old profile if exists
    const oldProfile = this.userProfileImages.get(username);
    if (oldProfile) {
      await this.deleteImage(oldProfile.publicId);
    }

    return this.uploadUserProfile(username, roomCode, buffer, originalname, mimetype);
  }

  // Delete image from Cloudinary
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'not found') {
        console.warn(`Image not found: ${publicId}`);
      } else {
        console.log(`Deleted image: ${publicId}`);
      }
      return result;
    } catch (error) {
      console.error(`Failed to delete image ${publicId}:`, error);
      throw error;
    }
  }

  // Delete entire folder from Cloudinary
  async deleteFolder(folderPath) {
    try {
      // Get all resources in the folder
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 500
      });

      // Delete all resources in the folder
      const deletePromises = resources.resources.map(async (resource) => {
        try {
          await cloudinary.uploader.destroy(resource.public_id);
          console.log(`Deleted folder resource: ${resource.public_id}`);
        } catch (error) {
          console.error(`Failed to delete folder resource ${resource.public_id}:`, error);
        }
      });

      await Promise.all(deletePromises);
      console.log(`Deleted folder: ${folderPath}`);
      return { deleted: true, folder: folderPath };
    } catch (error) {
      console.error(`Failed to delete folder ${folderPath}:`, error);
      throw error;
    }
  }

  // Delete user profile image
  async deleteUserProfile(username) {
    const profile = this.userProfileImages.get(username);
    if (profile) {
      await this.deleteImage(profile.publicId);
      this.userProfileImages.delete(username);
      console.log(`Deleted profile image for ${username}`);
    }
  }

  // Delete map image (called when room is closed)
  async deleteMapImage(roomCode) {
    const mapImage = this.mapImages.get(roomCode);
    if (mapImage) {
      await this.deleteImage(mapImage.publicId);
      this.mapImages.delete(roomCode);
      console.log(`Deleted map image for room ${roomCode}`);
    }
  }

  // Cleanup all images for a room
  async cleanupRoom(roomCode) {
    try {
      // Delete map image
      await this.deleteMapImage(roomCode);

      // Delete entire profile folder for this room
      await this.deleteFolder(`profiles/${roomCode}`);

      // Delete entire map folder for this room
      await this.deleteFolder(`maps/${roomCode}`);

      // Clear local tracking data
      const profilesToDelete = [];
      for (const [username, profile] of this.userProfileImages) {
        if (profile.roomCode === roomCode) {
          profilesToDelete.push(username);
        }
      }

      for (const username of profilesToDelete) {
        this.userProfileImages.delete(username);
      }

      this.mapImages.delete(roomCode);

      console.log(`Cleaned up all images and folders for room ${roomCode}`);
    } catch (error) {
      console.error(`Error cleaning up room ${roomCode}:`, error);
    }
  }

  // Cleanup user images when they disconnect
  async cleanupUser(username) {
    try {
      await this.deleteUserProfile(username);
      console.log(`Cleaned up images for user ${username}`);
    } catch (error) {
      console.error(`Error cleaning up user ${username}:`, error);
    }
  }

  // Get all images for monitoring
  getAllImages() {
    return {
      profiles: Array.from(this.userProfileImages.values()),
      maps: Array.from(this.mapImages.values())
    };
  }

  // Validate image size
  validateImageSize(buffer) {
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }
    return true;
  }
}

module.exports = new ImageService();